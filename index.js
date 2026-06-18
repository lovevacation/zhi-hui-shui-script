// ==UserScript==
// @name         智慧树AI智能课程 - 自动答题脚本
// @namespace    https://github.com/lovevacation/zhi-hui-shui-script
// @version      1.0.5
// @description  全自动完成智慧树AI智能课程掌握度练习。基于DeepSeek API自动答题，支持题库搜索与错题积累。
// @author       Coren
// @match        https://studentexamcomh5.zhihuishu.com/studentReviewTestOrExam*
// @match        https://ai-smart-course-student-pro.zhihuishu.com/point/*
// @match        https://ai-smart-course-student-pro.zhihuishu.com/examPreview/*
// @match        https://ai-smart-course-student-pro.zhihuishu.com/learnPage/*
// @match        https://ai-smart-course-student-pro.zhihuishu.com/masteryHistory/*
// @connect      api.deepseek.com
// @connect      gist.githubusercontent.com
// @connect      *
// @grant        GM_addStyle
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_download
// @grant        unsafeWindow
// @license      MIT
// ==/UserScript==

(function () {
    'use strict';

    // --- 1. UI 和样式 ---
    GM_addStyle(`
        #ai-panel {
            position: fixed; top: 100px; right: 20px; width: 340px;
            background: #ffffff;
            border: 1px solid #e2e8f0;
            
            border-radius: 12px;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.12);
            z-index: 9999;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.35s ease;
            transform: translateX(110%);
            opacity: 0;
        }
        #ai-panel.show {
            transform: translateX(0);
            opacity: 1;
        }
        #panel-toggle {
            position: fixed; top: 100px; right: 20px;
            width: 44px; height: 44px;
            background: linear-gradient(135deg, #6366f1, #8b5cf6);
            color: white; border: none; border-radius: 50%;
            cursor: pointer; z-index: 10000;
            display: flex; justify-content: center; align-items: center;
            font-size: 18px; font-weight: 600;
            box-shadow: 0 4px 14px rgba(99, 102, 241, 0.35);
            transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        #panel-toggle:hover {
            transform: scale(1.08);
            box-shadow: 0 6px 20px rgba(99, 102, 241, 0.5);
        }
        #panel-header {
            padding: 16px 20px;
            background: linear-gradient(135deg, #6366f1, #8b5cf6);
            color: white;
            border-top-left-radius: 12px; border-top-right-radius: 12px;
            font-size: 17px; font-weight: 600;
            letter-spacing: 0.3px;
        }
        #panel-content {
            padding: 20px; display: flex; flex-direction: column; gap: 14px;
        }
        .input-group { display: flex; flex-direction: column; gap: 5px; }
        .input-group label {
            margin-bottom: 0; color: #475569; font-weight: 500; font-size: 13px;
        }
        .input-group input, .input-group select {
            padding: 10px 12px;
            border: 1.5px solid #e2e8f0;
            border-radius: 8px; font-size: 14px;
            background: #f8fafc;
            color: #334155;
            transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }
        .input-group input:focus, .input-group select:focus {
            outline: none;
            border-color: #6366f1;
            box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.12);
        }
        #start-button {
            padding: 12px 16px;
            background: linear-gradient(135deg, #6366f1, #8b5cf6);
            color: white; border: none; border-radius: 8px;
            cursor: pointer; font-size: 15px; font-weight: 600;
            transition: all 0.25s ease;
            box-shadow: 0 2px 10px rgba(99, 102, 241, 0.25);
        }
        #start-button:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 16px rgba(99, 102, 241, 0.4);
        }
        #status-log {
            margin-top: 8px; padding: 12px;
            background: #1e293b;
            border-radius: 8px;
            height: 120px; overflow-y: auto;
            font-size: 12px; color: #94a3b8;
            font-family: 'SF Mono', 'Cascadia Code', 'Fira Code', 'Consolas', monospace;
            line-height: 1.6;
        }
        #status-log div { color: #a5f3fc; }
        .quizbank-settings.hidden { display: none; }

        /* 开关 */
        .toggle-row {
            display: flex; align-items: center; justify-content: space-between;
            padding: 4px 0;
        }
        .toggle-row span {
            color: #475569; font-weight: 500; font-size: 13px;
        }
        .toggle-switch {
            position: relative; width: 44px; height: 24px;
        }
        .toggle-switch input { opacity: 0; width: 0; height: 0; }
        .toggle-slider {
            position: absolute; cursor: pointer;
            top: 0; left: 0; right: 0; bottom: 0;
            background: #cbd5e1; border-radius: 24px;
            transition: 0.3s;
        }
        .toggle-slider:before {
            content: ""; position: absolute;
            height: 18px; width: 18px; left: 3px; bottom: 3px;
            background: white; border-radius: 50%;
            transition: 0.3s;
        }
        .toggle-switch input:checked + .toggle-slider {
            background: linear-gradient(135deg, #6366f1, #8b5cf6);
        }
        .toggle-switch input:checked + .toggle-slider:before {
            transform: translateX(20px);
        }

        .btn-secondary {
            padding: 8px 12px;
            background: #f1f5f9; color: #475569;
            border: 1px solid #e2e8f0; border-radius: 8px;
            cursor: pointer; font-size: 13px; font-weight: 500;
            transition: all 0.2s ease;
        }
        .btn-secondary:hover {
            background: #e2e8f0; color: #334155;
        }
        .text-hint {
            font-size: 11px; color: #94a3b8; margin-top: 3px;
        }
        .divider {
            border: none; border-top: 1px solid #e2e8f0;
            margin: 2px 0;
        }
        @keyframes pulse-alert {
            0%, 100% { transform: scale(1); box-shadow: 0 4px 14px rgba(239, 68, 68, 0.35); }
            50% { transform: scale(1.15); box-shadow: 0 6px 24px rgba(239, 68, 68, 0.7); }
        }
    `);

    const panelHTML = `
        <button id="panel-toggle">AI</button>
        <div id="ai-panel">
            <div id="panel-header">🤖 AI 自动答题设置</div>
            <div id="panel-content">
                <div class="input-group">
                    <label for="api-key">DeepSeek API Key</label>
                    <input type="password" id="api-key" placeholder="sk-...">
                    <small class="text-hint">在 <a href="https://platform.deepseek.com/" target="_blank" style="color:#6366f1;">platform.deepseek.com</a> 获取</small>
                </div>

                <hr class="divider">

                <div class="toggle-row">
                    <span>启用题库</span>
                    <label class="toggle-switch">
                        <input type="checkbox" id="quizbank-toggle">
                        <span class="toggle-slider"></span>
                    </label>
                </div>

                <div class="quizbank-settings hidden">
                    <div class="input-group">
                        <label for="quizbank-url">题库 JSON 地址</label>
                        <input type="text" id="quizbank-url" placeholder="https://gist.../raw/.../quiz.json">
                    </div>
                    <div class="input-group" style="flex-direction: row; align-items: center; margin-top: 2px;">
                        <input type="checkbox" id="fallback-ai" style="width: 16px; height: 16px; margin-right: 8px; padding: 0; accent-color: #6366f1;">
                        <label for="fallback-ai" style="margin-bottom: 0; font-weight: normal;">题库未命中则 AI 自动答题</label>
                    </div>
                    <button id="refresh-quizbank" class="btn-secondary" style="margin-top: 6px; width: 100%;">刷新 / 加载题库</button>
                    <small class="text-hint">格式: [ { "q": "问题...", "a": "A" }, ... ]</small>
                </div>

                <div class="input-group" style="margin-top: 2px;">
                    <input type="file" id="local-quizbank-input" accept=".json" style="display: none;">
                    <button id="load-local-quizbank" class="btn-secondary" style="width: 100%;">📁 从本地加载题库</button>
                    <small class="text-hint">下载重复时文件名会带 (1)(2)... 后缀，手动选择最新版本即可</small>
                </div>

                <hr class="divider">

                <div class="input-group">
                    <label for="stop-condition">完成条件</label>
                    <select id="stop-condition">
                        <option value="gray">仅灰色 (未开始)</option>
                        <option value="non-red">含薄弱点 (灰+粉)</option>
                    </select>
                </div>

                <button id="start-button">▶ 开始自动答题</button>
                <div id="status-log"><div>📋 状态日志...</div></div>
                <button id="clear-bank-btn" class="btn-secondary" style="width: 100%; margin-top: 4px; color: #ef4444;">🗑 清除错题本</button>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', panelHTML);

    // --- 2. DOM元素 & 变量初始化 ---
    const panel = document.getElementById('ai-panel');
    const toggleButton = document.getElementById('panel-toggle');
    const startButton = document.getElementById('start-button');
    const apiKeyInput = document.getElementById('api-key');
    const statusLog = document.getElementById('status-log');
    const quizbankSettings = document.querySelector('.quizbank-settings');
    const quizbankToggle = document.getElementById('quizbank-toggle');
    const quizbankUrlInput = document.getElementById('quizbank-url');
    const fallbackAiCheckbox = document.getElementById('fallback-ai');
    const refreshQuizbankButton = document.getElementById('refresh-quizbank');
    const localQuizbankInput = document.getElementById('local-quizbank-input');
    const loadLocalQuizbankButton = document.getElementById('load-local-quizbank');
    const stopConditionSelect = document.getElementById('stop-condition');
    const clearBankBtn = document.getElementById('clear-bank-btn');

    let isPanelVisible = false;
    let autoMode = false;
    let quizBank = [];
    try {
        let stored = (unsafeWindow || window).name;
        if (stored && stored.startsWith('quizbank:')) stored = stored.substring(9);
        else stored = GM_getValue('quiz_bank_storage', '') || (unsafeWindow && unsafeWindow.localStorage.getItem('quiz_bank_data')) || '[]';
        quizBank = JSON.parse(stored);
    } catch(e) { quizBank = []; }

    // --- 3. UI交互与设置管理 ---
    toggleButton.addEventListener('click', () => {
        isPanelVisible = !isPanelVisible;
        panel.classList.toggle('show', isPanelVisible);
        toggleButton.textContent = isPanelVisible ? '✕' : 'AI';
    });

    // 恢复设置
    apiKeyInput.value = GM_getValue('deepseek_api_key', '');
    quizbankToggle.checked = GM_getValue('quizbank_enabled', false);
    quizbankUrlInput.value = GM_getValue('quizbank_url', '');
    fallbackAiCheckbox.checked = GM_getValue('fallback_ai', false);
    stopConditionSelect.value = GM_getValue('stop_condition', 'gray');

    function updateUIVisibility() {
        quizbankSettings.classList.toggle('hidden', !quizbankToggle.checked);
    }
    updateUIVisibility();

    apiKeyInput.addEventListener('input', () => { GM_setValue('deepseek_api_key', apiKeyInput.value); });
    quizbankToggle.addEventListener('change', () => { GM_setValue('quizbank_enabled', quizbankToggle.checked); updateUIVisibility(); });
    quizbankUrlInput.addEventListener('input', () => { GM_setValue('quizbank_url', quizbankUrlInput.value); });
    fallbackAiCheckbox.addEventListener('change', () => { GM_setValue('fallback_ai', fallbackAiCheckbox.checked); });
    stopConditionSelect.addEventListener('change', () => { GM_setValue('stop_condition', stopConditionSelect.value); });
    refreshQuizbankButton.addEventListener('click', fetchQuizBank);
    loadLocalQuizbankButton.addEventListener('click', () => localQuizbankInput.click());
    localQuizbankInput.addEventListener('change', loadQuizBankFromFile);
    startButton.addEventListener('click', () => {
        if (autoMode) toggleAutoMode(false);  // 不再自动清除错题本
        else toggleAutoMode(true);
    });
    // 手动清除错题本（需确认）
    clearBankBtn.addEventListener('click', () => {
        if (quizBank.length === 0) { log("错题本已为空。"); return; }
        if (confirm(`确定要清除 ${quizBank.length} 条错题记录吗？此操作不可恢复。`)) {
            quizBank = [];
            (unsafeWindow || window).name = '';
            saveQuizBank();
            log("错题本已手动清除。");
        }
    });
    function updateClearBankBtn() {
        clearBankBtn.textContent = `🗑 清除错题本 (${quizBank.length}条)`;
    }
    updateClearBankBtn();

    // --- 4. 核心功能函数 ---
    function log(message) {
        console.log(`[AI脚本] ${message}`);
        const timestamp = new Date().toLocaleTimeString();
        statusLog.innerHTML += `<div>${timestamp}: ${message}</div>`;
        statusLog.scrollTop = statusLog.scrollHeight;
    }
    log(`已恢复 ${quizBank.length} 条错题记录。`);

    function reliableClick(element) {
        if (!element) { log("警告: 尝试点击一个不存在的元素。"); return; }
        const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true, view: unsafeWindow });
        element.dispatchEvent(clickEvent);
    }

    // 点击后验证跳转是否生效，未生效自动重试
    let clickFailCount = 0;
    const MAX_CLICK_FAILS = 6;

    async function goBackToMain() {
        log("🔙 连续失败过多，尝试返回主页面...");
        const backBtn = document.querySelector('.left-back .back');
        if (backBtn) {
            reliableClick(backBtn);
            await new Promise(r => setTimeout(r, 2000));
            log("已点击返回。");
        } else {
            // 备用：直接跳转学习页
            log("未找到返回按钮，跳转学习页...");
            window.location.href = 'https://ai-smart-course-student-pro.zhihuishu.com/learnPage/';
        }
    }

    async function clickAndVerify(element, verifyFn, label, maxRetries, delayMs) {
        maxRetries = maxRetries || 3;
        delayMs = delayMs || 800;
        if (!element) { log(`clickAndVerify: ${label} - 元素不存在`); clickFailCount++; return false; }
        for (let i = 0; i < maxRetries; i++) {
            reliableClick(element);
            await new Promise(r => setTimeout(r, delayMs));
            if (verifyFn()) {
                clickFailCount = 0; // 成功则重置
                if (i > 0) log(`${label} - 第${i + 1}次点击生效`);
                return true;
            }
            if (i < maxRetries - 1) {
                log(`${label} - 点击未生效，重试(${i + 2}/${maxRetries})...`);
                await new Promise(r => setTimeout(r, 400));
            }
        }
        log(`${label} - 重试${maxRetries}次仍未生效`);
        clickFailCount++;
        if (clickFailCount >= MAX_CLICK_FAILS) {
            log(`❌ 累计${clickFailCount}次点击失败，触发紧急返回...`);
            await goBackToMain();
            toggleAutoMode(false);
        }
        return false;
    }

    function getLevenshteinDistance(a, b) {
        if (a.length === 0) return b.length;
        if (b.length === 0) return a.length;
        const matrix = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(null));
        for (let i = 0; i <= a.length; i++) matrix[0][i] = i;
        for (let j = 0; j <= b.length; j++) matrix[j][0] = j;
        for (let j = 1; j <= b.length; j++) {
            for (let i = 1; i <= a.length; i++) {
                const cost = a[i - 1] === b[j - 1] ? 0 : 1;
                matrix[j][i] = Math.min(matrix[j - 1][i] + 1, matrix[j][i - 1] + 1, matrix[j - 1][i - 1] + cost);
            }
        }
        return matrix[b.length][a.length];
    }

    function findInQuizBank(question, options) {
        if (quizBank.length === 0) { log("题库为空，跳过检索。"); return null; }
        log(`开始在 ${quizBank.length} 条题库中检索...`);
        // 归一化：去序号、去所有空格和标点，用于更鲁棒的匹配
        function norm(s) {
            return s.replace(/^\d+[.、\s]*/, '').replace(/[\s　\r\n，。！？、；：""''（）\(\)\[\]【】\-—…·]/g, '').trim();
        }
        const procQ = norm(question);
        let bestMatch = null, highestSimilarity = 0;
        for (const item of quizBank) {
            if (!item.q || !item.a) continue;
            const procItemQ = norm(item.q);
            if (procQ === procItemQ) { bestMatch = item; highestSimilarity = 1; break; }
            const distance = getLevenshteinDistance(procQ, procItemQ);
            const similarity = 1 - (distance / Math.max(procQ.length, procItemQ.length, 1));
            if (similarity > highestSimilarity) { highestSimilarity = similarity; bestMatch = item; }
        }
        const threshold = 0.7; // 降低阈值，容忍细微差异
        if (highestSimilarity >= threshold && bestMatch) {
            let answer = bestMatch.a;
            // 如果有选项文本，基于文本重映射字母（防选项顺序变化）
            if (options && options.length > 0 && /^[A-Z]+$/.test(answer) && bestMatch.t) {
                const storedTexts = bestMatch.t.split('|');
                let remapped = '';
                for (let i = 0; i < answer.length; i++) {
                    const storedIdx = answer.charCodeAt(i) - 65;
                    const targetText = storedTexts[storedIdx] || '';
                    let bestIdx = -1, bestSim = 0;
                    for (let j = 0; j < options.length; j++) {
                        const sim = 1 - (getLevenshteinDistance(targetText, options[j].trim()) / Math.max(targetText.length, options[j].trim().length, 1));
                        if (sim > bestSim) { bestSim = sim; bestIdx = j; }
                    }
                    if (bestIdx >= 0 && bestSim > 0.6) {
                        remapped += String.fromCharCode(65 + bestIdx);
                    } else {
                        remapped += answer[i];
                    }
                }
                if (remapped !== answer) {
                    log(`选项顺序变化: ${answer} → ${remapped} (基于文本匹配)`);
                }
                answer = remapped;
            }
            log(`${highestSimilarity === 1 ? '精确' : '模糊'}命中(${(highestSimilarity * 100).toFixed(0)}%) → ${answer}`);
            return answer;
        }
        log(`未命中(最高${(highestSimilarity * 100).toFixed(0)}%，${bestMatch ? '最佳候选题：「' + bestMatch.q.substring(0, 40) + '」' : '无候选题'})，交给AI`);
        return null;
    }

    function saveQuizBank(skipDownload) {
        const data = JSON.stringify(quizBank, null, 2);
        (unsafeWindow || window).name = 'quizbank:' + data;
        GM_setValue('quiz_bank_storage', data);
        try { if (unsafeWindow) unsafeWindow.localStorage.setItem('quiz_bank_data', data); } catch(e) {}
        if (!skipDownload) {
            GM_download({
                url: 'data:application/json;base64,' + btoa(unescape(encodeURIComponent(data))),
                name: 'zhihuishu-quizbank.json',
                saveAs: false
            });
        }
        log(`已保存 ${quizBank.length} 条到${skipDownload ? '存储' : '磁盘 + 存储'}`);
        updateClearBankBtn();
    }

    async function fetchQuizBank() {
        const url = quizbankUrlInput.value;
        if (!url) { log("错误: 题库 URL 为空。"); return; }
        log("正在从 Gist/URL 加载题库...");
        quizBank = [];
        GM_xmlhttpRequest({
            method: "GET", url, timeout: 15000,
            onload: function (response) {
                if (response.status === 200) {
                    try {
                        let data = JSON.parse(response.responseText);
                        if (Array.isArray(data)) {
                            quizBank = data.filter(item => item.q && item.a);
                            saveQuizBank();
                            log(`题库加载成功！共 ${quizBank.length} 条有效记录。`);
                        } else { log("错误: 题库格式不是一个 JSON 数组。"); quizBank = []; }
                    } catch (e) { log(`题库JSON解析失败: ${e.message}`); quizBank = []; }
                } else { log(`题库加载失败: ${response.status} ${response.statusText}`); }
            },
            onerror: (err) => log(`题库 Gist/URL 请求错误: ${err.statusText || 'Network Error'}`),
            ontimeout: () => log("题库 Gist/URL 请求超时。")
        });
    }

    function loadQuizBankFromFile() {
        const file = localQuizbankInput.files[0];
        if (!file) return;
        log(`正在读取本地文件: ${file.name}...`);
        const reader = new FileReader();
        reader.onload = function (e) {
            try {
                let data = JSON.parse(e.target.result);
                if (Array.isArray(data)) {
                    quizBank = data.filter(item => item.q && item.a);
                    saveQuizBank(true);
                    log(`本地题库加载成功！共 ${quizBank.length} 条有效记录。`);
                } else { log("错误: 文件格式不是一个 JSON 数组。"); }
            } catch (err) { log(`本地文件JSON解析失败: ${err.message}`); }
        };
        reader.onerror = function () { log("读取本地文件失败。"); };
        reader.readAsText(file);
        localQuizbankInput.value = '';
    }

    // --- 5. DeepSeek API ---
    function callDeepSeekApi(question, options, type, blankCount, hint) {
        return new Promise((resolve) => {
            const apiKey = apiKeyInput.value;
            if (!apiKey) { log('错误: 请先填入 DeepSeek API Key'); return resolve(null); }

            let prompt;
            const hintText = hint ? `\n\n【重要参考】错题本中记录了该题的答案可能是「${hint}」，请优先参考此答案。如果该答案与当前选项明显不符（可能是选项顺序变化），请根据内容含义重新匹配。` : '';

            if (type === '填空题') {
                const realBlankCount = blankCount || 1;
                prompt = `你是一个专业的在线课程答题助手。请根据以下填空题的题干，直接给出空白处应填入的正确答案。规则：1. **这是一个填空题，有 ${realBlankCount} 个空需要填入。** 2. **直接返回答案文字，如果只有一个空，直接返回答案；如果有多个空，用斜杠"/"分隔。不要包含任何解释或额外文字。** 例如：单空填"大变局"，就返回 "大变局"；两空填"不稳定"和"不确定性"，就返回 "不稳定/不确定性"。${hintText}---题目: ${question}---你的答案 (仅文字，多空用/分隔):`;
            } else {
                const optionsText = options.length > 0
                    ? options.map((opt, index) => `${String.fromCharCode(65 + index)}. ${opt}`).join('\n')
                    : '';
                prompt = `你是一个专业的在线课程答题助手。请根据以下题目和选项，直接给出正确答案的字母。规则：1.  **${type === '多选题' ? '这是一个多选题，答案可能有多个。' : '这是一个' + type + '。'}** 2.  **直接返回代表正确选项的字母，不要包含任何其他解释、标点符号或文字。** -   例如：如果答案是A，就返回 "A"。-   如果是多选题，答案是A和B，就返回 "AB"。-   如果是判断题，对的返回 "A"，错的返回 "B"。${hintText}---题目: ${question}---选项:${optionsText}---你的答案 (仅字母):`;
            }

            log("正在请求 DeepSeek API...");
            GM_xmlhttpRequest({
                method: "POST",
                url: "https://api.deepseek.com/v1/chat/completions",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${apiKey}`
                },
                data: JSON.stringify({
                    model: "deepseek-chat",
                    messages: [{ "role": "user", "content": prompt }],
                    max_tokens: 100,
                    temperature: 0
                }),
                timeout: 15000,
                onload: function (response) {
                    if (response.status >= 200 && response.status < 300) {
                        try {
                            const responseData = JSON.parse(response.responseText);
                            let content = responseData.choices?.[0]?.message?.content;
                            log(`API 原始: ${response.responseText.substring(0, 200)}`);
                            if (content !== null && content !== undefined && content.trim() !== '') {
                                let answer = content.trim();
                                if (type !== '填空题') {
                                    answer = answer.toUpperCase().replace(/[^A-Z]/g, '');
                                }
                                log(`DeepSeek 回答: ${answer}`);
                                resolve(answer);
                            } else {
                                log(`API 返回为空`);
                                resolve(null);
                            }
                        } catch (e) { log(`解析API响应失败: ${e.message}`); resolve(null); }
                    } else { log(`API 请求失败: ${response.status}`); resolve(null); }
                },
                onerror: (error) => { log(`API 调用出错: ${error.statusText || '网络错误'}`); resolve(null); },
                ontimeout: () => { log(`API 请求超时`); resolve(null); }
            });
        });
    }

    function findBestBankHint(question) {
        // 搜索错题本中与当前题目最相似的记录，作为AI提示
        if (quizBank.length === 0) return null;
        const processedQuestion = question.replace(/^\d+[.、\s]*/, '').trim();
        let bestMatch = null, highestSim = 0;
        for (const item of quizBank) {
            if (!item.q || !item.a) continue;
            const processedItemQ = item.q.replace(/^\d+[.、\s]*/, '').trim();
            const distance = getLevenshteinDistance(processedQuestion, processedItemQ);
            const sim = 1 - (distance / Math.max(processedQuestion.length, processedItemQ.length, 1));
            if (sim > highestSim) { highestSim = sim; bestMatch = item; }
        }
        // 相似度 > 60% 就作为参考提示
        if (bestMatch && highestSim > 0.6) {
            return bestMatch.t || bestMatch.a;
        }
        return null;
    }

    async function getAnswer(question, options, type, blankCount) {
        // 错题本始终优先查询
        const bankAnswer = findInQuizBank(question, options);
        if (bankAnswer) {
            log(`答案来自错题本: ${bankAnswer}`);
            // 错题本瞬间返回，页面可能还没渲染完，等待一下
            await new Promise(r => setTimeout(r, 600));
            return bankAnswer;
        }

        // 题库模式下未开启AI回退 → 不调AI
        if (quizbankToggle.checked && !fallbackAiCheckbox.checked) {
            log("错题本未命中，且未开启 AI Fallback。");
            return null;
        }

        // 调用AI，传入错题本最佳匹配作为参考提示
        const hint = findBestBankHint(question);
        if (hint) log(`AI提示: 错题本记录 ≈「${hint}」`);
        return await callDeepSeekApi(question, options, type, blankCount, hint);
    }

    // --- 6. 考试答题页面 (studentexamcomh5) — 核心答题逻辑 ---

    // 检测当前题目是否已有作答（覆盖所有题型）
    function questionHasAnswer() {
        // el-radio / el-checkbox 原生组件
        if (document.querySelectorAll('.questionContent .el-radio__original:checked, .questionContent .el-checkbox__original:checked').length > 0) return true;
        // custom-radio (radio-view li) 选中态 — 检查 .checkIcon 的 active 类或 li 的选中类
        if (document.querySelectorAll('.questionContent .radio-view li.clearfix .checkIcon.active, .questionContent .radio-view li.clearfix .checkIcon[class*="active"], .questionContent .radio-view li.clearfix.active, .questionContent .radio-view li.clearfix[class*="active"]').length > 0) return true;
        // 填空输入框
        const inputs = document.querySelectorAll('.questionContent .el-input__inner');
        if (Array.from(inputs).some(inp => inp.value && inp.value.trim() !== '')) return true;
        return false;
    }

    async function processNewExamPage() {
        log("进入答题页面，开始自动答题...");
        await new Promise(r => setTimeout(r, 800));

        const treeNodes = document.querySelectorAll('.el-tree-node__children .font-sec-style-node');
        const totalQuestions = treeNodes.length;
        if (totalQuestions === 0) { log("错误: 未找到题目列表，请刷新重试。"); toggleAutoMode(false); return; }
        log(`共检测到 ${totalQuestions} 道题。`);

        const examStartTime = Date.now();
        const EXAM_TIMEOUT = 3 * 60 * 1000; // 3分钟超时

        for (let i = 0; i < totalQuestions; i++) {
            if (!autoMode) { log("自动答题已停止。"); return; }

            // 超时保底：在答题界面停留过久，自动返回
            if (Date.now() - examStartTime > EXAM_TIMEOUT) {
                log("⏰ 答题超时（3分钟），自动点击返回...");
                const backBtn = document.querySelector('.left-back .back');
                if (backBtn) { reliableClick(backBtn); log("已点击返回。"); }
                else { log("未找到返回按钮。"); }
                toggleAutoMode(false);
                return;
            }

            await new Promise(r => setTimeout(r, 500));

            const typeEl = document.querySelector('.questionContent .letterSortNum');
            let currentQNum = i + 1;
            if (typeEl) { const match = typeEl.innerText.match(/^(\d+)/); if (match) currentQNum = parseInt(match[1]); }
            const isLastQuestion = currentQNum >= totalQuestions;
            log(`当前题号: ${currentQNum}/${totalQuestions}${isLastQuestion ? ' (最后一题)' : ''}`);

            // 跳过已作答的题（覆盖所有题型：单选/多选/判断/填空）
            if (questionHasAnswer()) {
                log(`第 ${currentQNum} 题已有作答记录，跳过。`);
                if (!isLastQuestion) { const nb = document.querySelector('.next-topic'); if (nb) { const pq = currentQNum; clickAndVerify(nb, () => { const e = document.querySelector('.questionContent .letterSortNum'); if (!e) return false; const m = e.innerText.match(/^(\d+)/); return m && parseInt(m[1]) !== pq; }, '下一题(跳过)', 2, 600); } }
                continue;
            }

            try {
                const typeEl2 = document.querySelector('.questionContent .letterSortNum');
                let questionType = '单选题';
                if (typeEl2) {
                    const rawType = typeEl2.innerText.trim();
                    if (rawType.includes('多选')) questionType = '多选题';
                    else if (rawType.includes('判断')) questionType = '判断题';
                    else if (rawType.includes('填空')) questionType = '填空题';
                }

                const titleEl = document.querySelector('.questionContent .centent-pre pre.preStyle');
                const questionTitle = titleEl ? titleEl.innerText.trim() : '';
                if (!questionTitle) {
                    log("错误: 无法解析题干，跳过。");
                    if (!isLastQuestion) { const nb = document.querySelector('.next-topic'); if (nb) { const pq = currentQNum; clickAndVerify(nb, () => { const e = document.querySelector('.questionContent .letterSortNum'); if (!e) return false; const m = e.innerText.match(/^(\d+)/); return m && parseInt(m[1]) !== pq; }, '下一题(跳过)', 2, 600); } }
                    continue;
                }
                log(`题目 (${questionType}): ${questionTitle}`);

                // --- 解析选项 ---
                let optionElements = [], textInputs = [];
                const optionsText = [];
                let optionType = '';

                if (questionType === '填空题') {
                    textInputs = document.querySelectorAll('.questionContent .el-input__inner');
                    if (textInputs.length === 0) {
                        log("错误: 未找到填空输入框，跳过。");
                        if (!isLastQuestion) { const nb = document.querySelector('.next-topic'); if (nb) { const pq = currentQNum; clickAndVerify(nb, () => { const e = document.querySelector('.questionContent .letterSortNum'); if (!e) return false; const m = e.innerText.match(/^(\d+)/); return m && parseInt(m[1]) !== pq; }, '下一题(跳过)', 2, 600); } }
                        continue;
                    }
                    optionType = 'input';
                    log(`填空题，共 ${textInputs.length} 个空。`);
                } else {
                    const radioLabels = document.querySelectorAll('.questionContent .el-radio');
                    const checkboxLabels = document.querySelectorAll('.questionContent .el-checkbox');
                    const customRadioItems = document.querySelectorAll('.questionContent .radio-view li.clearfix');
                    log(`[调试] el-radio:${radioLabels.length}, el-checkbox:${checkboxLabels.length}, radio-view:${customRadioItems.length}`);

                    if (radioLabels.length > 0) {
                        optionType = 'el-radio';
                        radioLabels.forEach(label => {
                            const preEl = label.querySelector('.el-radio__label pre.preStyle');
                            if (preEl) optionsText.push(preEl.innerText.trim());
                            optionElements.push(label);
                        });
                    } else if (checkboxLabels.length > 0) {
                        optionType = 'el-checkbox';
                        checkboxLabels.forEach(label => {
                            const preEl = label.querySelector('.el-checkbox__label pre.preStyle');
                            if (preEl) optionsText.push(preEl.innerText.trim());
                            optionElements.push(label);
                        });
                    } else if (customRadioItems.length > 0) {
                        optionType = 'custom-radio';
                        customRadioItems.forEach(li => {
                            const stemEl = li.querySelector('.stem, .preStyle');
                            if (stemEl) optionsText.push(stemEl.innerText.trim());
                            optionElements.push(li);
                        });
                    }
                }

                if (questionType !== '填空题' && optionsText.length === 0) {
                    log("错误: 无法解析选项，跳过。");
                    if (!isLastQuestion) { const nb = document.querySelector('.next-topic'); if (nb) { const pq = currentQNum; clickAndVerify(nb, () => { const e = document.querySelector('.questionContent .letterSortNum'); if (!e) return false; const m = e.innerText.match(/^(\d+)/); return m && parseInt(m[1]) !== pq; }, '下一题(跳过)', 2, 600); } }
                    continue;
                }

                // --- 调用 AI ---
                const blankCount = questionType === '填空题' ? textInputs.length : undefined;
                const answer = await getAnswer(questionTitle, optionsText, questionType, blankCount);

                if (answer) {
                    log(`尝试填入答案: ${answer}`);

                    if (questionType === '填空题') {
                        const fillAnswers = textInputs.length > 1
                            ? answer.split(/[/,，;；\s]+/).filter(Boolean)
                            : [answer.trim()];

                        let sharedReviewComp = null;
                        let sharedRootComp = null;

                        for (let j = 0; j < Math.min(fillAnswers.length, textInputs.length); j++) {
                            const input = textInputs[j];
                            if (!input) break;
                            const answerText = fillAnswers[j];

                            const wrapper = input.closest('.el-input');
                            const vueComp = wrapper?.__vue__;
                            if (vueComp) {
                                const fillComp = vueComp.$parent;
                                if (fillComp?.strings !== undefined) fillComp.strings = answerText;

                                if (!sharedReviewComp) {
                                    const reviewComp = vueComp.$parent?.$parent?.$parent;
                                    if (reviewComp && 'userAnswerRequestVos' in reviewComp) {
                                        sharedReviewComp = reviewComp;
                                        sharedRootComp = reviewComp?.$parent || null;
                                    }
                                }

                                input.value = answerText;
                                log(`[Vue] 填入: ${answerText}`);
                            } else {
                                log(`[Vue] 未找到 el-input 组件实例`);
                            }
                            await new Promise(r => setTimeout(r, 300));
                        }

                        const joinedAnswer = fillAnswers.join('#@#');
                        if (sharedReviewComp && 'userAnswerRequestVos' in sharedReviewComp) {
                            sharedReviewComp.userAnswerRequestVos = joinedAnswer;
                        }
                        if (sharedRootComp && 'userAnswer' in sharedRootComp) {
                            sharedRootComp.userAnswer = joinedAnswer;
                        }
                        log(`[Vue] 最终写入: ${joinedAnswer}`);
                    } else if (optionType === 'custom-radio') {
                        for (let char of answer) {
                            const idx = char.charCodeAt(0) - 65;
                            if (idx >= 0 && idx < optionElements.length) {
                                const li = optionElements[idx];
                                const icon = li.querySelector('.checkIcon');
                                reliableClick(icon || li);
                                await new Promise(r => setTimeout(r, 200));
                            }
                        }
                    } else {
                        for (let char of answer) {
                            const idx = char.charCodeAt(0) - 65;
                            if (idx >= 0 && idx < optionElements.length) {
                                reliableClick(optionElements[idx]);
                                await new Promise(r => setTimeout(r, 200));
                            }
                        }
                    }
                } else {
                    log("未找到答案，跳过。");
                }

                // 验证答案确实被选中（custom-radio 须等导航后才生效，跳过即时检查）
                if (answer && optionType !== 'custom-radio') {
                    let retries = 0;
                    while (!questionHasAnswer() && retries < 3) {
                        retries++;
                        log(`答案未生效，重试点击(${retries}/3)...`);
                        if (optionType === 'input') break; // 填空已在上面填入，无需重试
                        for (let char of answer) {
                            const idx = char.charCodeAt(0) - 65;
                            if (idx >= 0 && idx < optionElements.length) {
                                reliableClick(optionElements[idx]);
                                await new Promise(r => setTimeout(r, 300));
                            }
                        }
                        await new Promise(r => setTimeout(r, 500));
                    }
                    if (questionHasAnswer()) log("答案已确认生效。");
                    else log("警告: 答案可能未生效。");
                }

                if (!isLastQuestion) {
                    await new Promise(r => setTimeout(r, 800));
                    const nextBtn = document.querySelector('.next-topic');
                    if (nextBtn) {
                        const prevQNum = currentQNum;
                        await clickAndVerify(nextBtn,
                            () => {
                                const el = document.querySelector('.questionContent .letterSortNum');
                                if (!el) return false;
                                const m = el.innerText.match(/^(\d+)/);
                                return m && parseInt(m[1]) !== prevQNum;
                            },
                            '下一题', 3, 1300);
                    }
                } else {
                    // 最后一题：通过切到上一题再切回来触发答案提交，然后验证
                    log(">>>> 最后一题，切题触发保存...");
                    await new Promise(r => setTimeout(r, 800));
                    const prevBtn = document.querySelector('.pre-topic');
                    if (prevBtn) {
                        // 切到上一题
                        const prevOk = await clickAndVerify(prevBtn,
                            () => {
                                const el = document.querySelector('.questionContent .letterSortNum');
                                if (!el) return false;
                                const m = el.innerText.match(/^(\d+)/);
                                return m && parseInt(m[1]) < currentQNum;
                            },
                            '上一题(切出)', 3, 1000);
                        if (prevOk) {
                            // 切回来
                            await new Promise(r => setTimeout(r, 500));
                            const nextBtn2 = document.querySelector('.next-topic');
                            if (nextBtn2) {
                                await clickAndVerify(nextBtn2,
                                    () => {
                                        const el = document.querySelector('.questionContent .letterSortNum');
                                        if (!el) return false;
                                        const m = el.innerText.match(/^(\d+)/);
                                        return m && parseInt(m[1]) === currentQNum;
                                    },
                                    '下一题(切回)', 3, 1000);
                                await new Promise(r => setTimeout(r, 500));
                            }
                        }
                    }
                    // 切回后检查答案是否已提交
                    if (!questionHasAnswer()) {
                        log("警告: 最后一题答案仍未检测到，但仍将提交。");
                    } else {
                        log("最后一题答案已确认。");
                    }
                    await verifyAndSubmit(totalQuestions);
                    return;
                }

                // 避免 API 限速
                log("等待0.5秒避免API限速...");
                await new Promise(r => setTimeout(r, 500));
            } catch (err) {
                log(`处理出错: ${err.message}, 跳过。`);
                if (!isLastQuestion) { const nb = document.querySelector('.next-topic'); if (nb) { const pq = currentQNum; clickAndVerify(nb, () => { const e = document.querySelector('.questionContent .letterSortNum'); if (!e) return false; const m = e.innerText.match(/^(\d+)/); return m && parseInt(m[1]) !== pq; }, '下一题(跳过)', 2, 600); } }
            }
        }

        // 兜底：循环结束但还没提交（如最后一题被跳过），自动触发验证提交
        if (autoMode) {
            log("答题循环结束，触发兜底验证...");
            await verifyAndSubmit(totalQuestions);
        }
    }

    // 提交前验证：确保所有题目都已作答
    async function verifyAndSubmit(totalQuestions) {
        // 等 Vue 更新答题卡状态（最后一题刚答完，DOM 需要时间刷新）
        await new Promise(r => setTimeout(r, 2000));
        const verifyStartTime = Date.now();
        const VERIFY_TIMEOUT = 3 * 60 * 1000;

        function scanAnswerCard() {
            const answered = document.querySelectorAll('.custom-tree-answer-normal.answer').length;
            const unanswered = document.querySelectorAll('.custom-tree-answer-normal.no-answer').length;
            const progressEl = document.querySelector('.answer-pro .pro');
            let pct = 0;
            if (progressEl) pct = parseFloat(progressEl.innerText) || 0;
            return { answered, unanswered, pct };
        }

        // 解析题型、选项等（复用逻辑）
        function parseCurrentQuestion() {
            const typeEl = document.querySelector('.questionContent .letterSortNum');
            let questionType = '单选题';
            if (typeEl) {
                const rawType = typeEl.innerText.trim();
                if (rawType.includes('多选')) questionType = '多选题';
                else if (rawType.includes('判断')) questionType = '判断题';
                else if (rawType.includes('填空')) questionType = '填空题';
            }
            const titleEl = document.querySelector('.questionContent .centent-pre pre.preStyle');
            const questionTitle = titleEl ? titleEl.innerText.trim() : '';
            let optionElements = [], textInputs = [], optionsText = [], optionType = '';

            if (questionType === '填空题') {
                textInputs = document.querySelectorAll('.questionContent .el-input__inner');
                optionType = 'input';
            } else {
                const radioLabels = document.querySelectorAll('.questionContent .el-radio');
                const checkboxLabels = document.querySelectorAll('.questionContent .el-checkbox');
                const customRadioItems = document.querySelectorAll('.questionContent .radio-view li.clearfix');
                if (radioLabels.length > 0) {
                    optionType = 'el-radio';
                    radioLabels.forEach(l => { const p = l.querySelector('.el-radio__label pre.preStyle'); if (p) optionsText.push(p.innerText.trim()); optionElements.push(l); });
                } else if (checkboxLabels.length > 0) {
                    optionType = 'el-checkbox';
                    checkboxLabels.forEach(l => { const p = l.querySelector('.el-checkbox__label pre.preStyle'); if (p) optionsText.push(p.innerText.trim()); optionElements.push(l); });
                } else if (customRadioItems.length > 0) {
                    optionType = 'custom-radio';
                    customRadioItems.forEach(li => { const s = li.querySelector('.stem, .preStyle'); if (s) optionsText.push(s.innerText.trim()); optionElements.push(li); });
                }
            }
            return { questionType, questionTitle, optionElements, textInputs, optionsText, optionType };
        }

        async function applyAnswer(answer, qInfo) {
            if (qInfo.questionType === '填空题') {
                const fillAnswers = qInfo.textInputs.length > 1
                    ? answer.split(/[/,，;；\s]+/).filter(Boolean)
                    : [answer.trim()];
                for (let j = 0; j < Math.min(fillAnswers.length, qInfo.textInputs.length); j++) {
                    const input = qInfo.textInputs[j];
                    if (!input) break;
                    const vueComp = input.closest('.el-input')?.__vue__;
                    if (vueComp) {
                        const fillComp = vueComp.$parent;
                        if (fillComp?.strings !== undefined) fillComp.strings = fillAnswers[j];
                        input.value = fillAnswers[j];
                    }
                    await new Promise(r => setTimeout(r, 300));
                }
            } else if (qInfo.optionType === 'custom-radio') {
                for (let char of answer) {
                    const idx = char.charCodeAt(0) - 65;
                    if (idx >= 0 && idx < qInfo.optionElements.length) {
                        reliableClick(qInfo.optionElements[idx].querySelector('.checkIcon') || qInfo.optionElements[idx]);
                        await new Promise(r => setTimeout(r, 200));
                    }
                }
            } else {
                for (let char of answer) {
                    const idx = char.charCodeAt(0) - 65;
                    if (idx >= 0 && idx < qInfo.optionElements.length) {
                        reliableClick(qInfo.optionElements[idx]);
                        await new Promise(r => setTimeout(r, 200));
                    }
                }
            }
        }

        let status = scanAnswerCard();
        log(`📋 答题卡: 已答 ${status.answered}/${totalQuestions}, 进度 ${status.pct}%`);

        // 进度100%直接提交
        if (status.unanswered === 0 || status.pct >= 100) {
            log("✅ 全部已作答，提交...");
            const ok = await doSubmit();
            if (!ok) toggleAutoMode(false);
            return;
        }

        // 逐个补救
        log(`⚠️ ${status.unanswered} 道未答，开始补救...`);

        for (let retry = 0; retry < 5 && autoMode; retry++) {
            if (Date.now() - verifyStartTime > VERIFY_TIMEOUT) {
                log("⏰ 验证超时，直接提交当前进度...");
                break;
            }

            const unansweredNodes = document.querySelectorAll('.custom-tree-answer-normal.no-answer');
            if (unansweredNodes.length === 0) break;

            let fixedAny = false;
            for (const node of unansweredNodes) {
                if (!autoMode || Date.now() - verifyStartTime > VERIFY_TIMEOUT) break;

                const numEl = node.querySelector('.font-sec-style-node');
                if (!numEl) continue;
                const qNum = numEl.innerText.trim();

                // 点击答题卡导航，验证题目内容区跳转成功
                const treeNode = node.closest('.el-tree-node');
                const treeContent = node.closest('.el-tree-node__content');
                const navTarget = treeNode || treeContent || numEl;
                const navOk = await clickAndVerify(navTarget,
                    () => {
                        const el = document.querySelector('.questionContent .letterSortNum');
                        if (!el) return false;
                        const m = el.innerText.match(/^(\d+)/);
                        return m && m[1] === qNum;
                    },
                    `跳转第${qNum}题`, 3, 1000);
                if (!navOk) { log(`跳转第${qNum}题失败，跳过。`); continue; }

                // 已有作答 → 跳过AI
                if (questionHasAnswer()) {
                    log(`第 ${qNum} 题已有作答，跳过。`);
                    fixedAny = true;
                    continue;
                }

                // 解析并作答
                const qInfo = parseCurrentQuestion();
                if (!qInfo.questionTitle) { log(`第 ${qNum} 题无法解析。`); continue; }
                if (qInfo.questionType !== '填空题' && qInfo.optionsText.length === 0) continue;

                log(`第 ${qNum} 题(${qInfo.questionType}) 调用AI...`);
                const answer = await getAnswer(qInfo.questionTitle, qInfo.optionsText, qInfo.questionType,
                    qInfo.questionType === '填空题' ? qInfo.textInputs.length : undefined);

                if (answer) {
                    await applyAnswer(answer, qInfo);
                    log(`第 ${qNum} 题 → ${answer}`);
                    fixedAny = true;
                    await new Promise(r => setTimeout(r, 600));
                }
            }

            status = scanAnswerCard();
            log(`🔄 第${retry + 1}轮后: 已答 ${status.answered}/${totalQuestions}, 进度 ${status.pct}%`);

            if (status.unanswered === 0 || status.pct >= 100) break;
            if (!fixedAny && status.unanswered > 0) {
                // 本轮一个都没修好，可能答题卡没更新 — 再等一轮
                await new Promise(r => setTimeout(r, 1500));
            }
        }

        // 最终判定：进度≥90% 或 剩余≤1 就直接提交
        status = scanAnswerCard();
        if (status.unanswered <= 1 || status.pct >= 90) {
            log(`✅ 达标 (进度${status.pct}%, 未答${status.unanswered})，提交。`);
        } else if (status.unanswered > 1) {
            log(`⚠️ 仍有 ${status.unanswered} 道未答，但已达最大重试次数，仍然提交。`);
        }
        const ok = await doSubmit();
        if (!ok) toggleAutoMode(false);
    }

    async function doSubmit() {
        const submitUrl = location.href;
        await new Promise(r => setTimeout(r, 1000));
        const submitBtn = document.querySelector('.reviewDone');
        if (!submitBtn) { log("未找到提交按钮。"); return false; }

        // 点击提交，验证确认弹窗出现
        const confirmed = await clickAndVerify(submitBtn,
            () => !!document.querySelector('.setting-defalut-tip-dialog .comfirm.button'),
            '提交作业', 3, 4000);
        if (!confirmed) { log("提交按钮点击后未弹出确认框。"); return false; }

        log("已点击提交作业。");
        await new Promise(r => setTimeout(r, 1000));
        const confirmBtn = document.querySelector('.setting-defalut-tip-dialog .comfirm.button');
        if (!confirmBtn) { log("未找到确认按钮。"); return false; }

        // 点击确认，然后验证页面跳转
        reliableClick(confirmBtn);
        log("已确认提交。");

        // 等待并验证页面是否跳转
        for (let i = 0; i < 8; i++) {
            await new Promise(r => setTimeout(r, 1500));
            if (location.href !== submitUrl) {
                log("✅ 提交成功，页面已跳转。");
                return true;
            }
            // 弹窗可能还在，再点一次确认
            const retryConfirm = document.querySelector('.setting-defalut-tip-dialog .comfirm.button');
            if (retryConfirm && i < 3) {
                log(`页面未跳转，重试确认(${i + 1})...`);
                reliableClick(retryConfirm);
            }
        }

        log("❌ 提交后页面长时间未跳转，触发紧急返回...");
        await goBackToMain();
        return false;
    }

    // --- 7. ai-smart-course 页面处理 ---

    // Point 结果页
    async function processPointPage() {
        log("进入提交结果页面...");
        await new Promise(r => setTimeout(r, 1200));
        if (!autoMode) return;

        const recordLink = document.querySelector('.line1-count-link');
        if (recordLink) {
            log("点击「查看作答记录与解析」...");
            reliableClick(recordLink);
        } else {
            log("未找到「查看作答记录与解析」按钮。");
        }
    }

    // 作答记录页：记录错题 + 重试
    async function processAnswerRecordPage() {
        log("进入作答记录页面，开始记录错题...");
        await new Promise(r => setTimeout(r, 1200));
        if (!autoMode) return;

        const examItems = document.querySelectorAll('.exam-preview .exam-item');
        let newRecords = 0;
        let wrongCount = 0;

        for (const item of examItems) {
            try {
                const resultEl = item.querySelector('.question-result');
                const isError = resultEl && (
                    resultEl.classList.contains('error') ||
                    resultEl.textContent.includes('回答错误')
                );
                if (!isError) continue;
                wrongCount++;

                const typeEl = item.querySelector('.quest-type');
                const qType = typeEl ? typeEl.innerText.trim() : '';
                const isFill = qType.includes('填空');

                const nameEl = item.querySelector('.option-name, .option-name .inner-box');
                const qText = nameEl ? nameEl.innerText.trim() : '';
                if (!qText) continue;

                let correctAnswer = '';
                const answerTitle = item.querySelector('.answer-title');
                if (answerTitle) {
                    if (isFill) {
                        const span = answerTitle.querySelector('span');
                        correctAnswer = span ? span.innerText.trim() : answerTitle.innerText.replace('参考答案：', '').trim();
                    } else {
                        correctAnswer = answerTitle.innerText
                            .replace('参考答案：', '')
                            .replace(/[、，,\s]/g, '')
                            .trim();
                    }
                }
                if (!correctAnswer) continue;

                // 提取选项文本，存储后用于防选项顺序变化的匹配
                let answerTexts = correctAnswer; // 默认用字母（向后兼容）
                if (!isFill && /^[A-Z]+$/.test(correctAnswer)) {
                    const texts = [];
                    // 从 exam-item 中找选项字母→文本的映射
                    const letterEls = item.querySelectorAll('.letterSort');
                    const textEls = item.querySelectorAll('.option-name pre, .preStyle, .stem');
                    for (let k = 0; k < Math.min(letterEls.length, textEls.length); k++) {
                        const letter = letterEls[k].innerText.trim().charAt(0);
                        const idx = letter.charCodeAt(0) - 65;
                        if (idx >= 0 && idx < 26) texts[idx] = textEls[k].innerText.trim();
                    }
                    // 依照正确答案的字母顺序拼接对应文本
                    const mapped = [];
                    for (const ch of correctAnswer) {
                        const idx = ch.charCodeAt(0) - 65;
                        mapped.push(texts[idx] || ch);
                    }
                    answerTexts = mapped.join('|');
                }

                const exists = quizBank.find(entry => entry.q === qText);
                if (!exists) {
                    quizBank.push({ q: qText, a: correctAnswer, t: answerTexts });
                    newRecords++;
                } else if (exists.a !== correctAnswer || exists.t !== answerTexts) {
                    exists.a = correctAnswer;
                    exists.t = answerTexts;
                    newRecords++;
                }
            } catch (e) {
                log(`记录错题出错: ${e.message}`);
            }
        }

        if (newRecords > 0) {
            saveQuizBank();
        }
        log(`错题记录完成！新增/更新 ${newRecords} 条，题库共 ${quizBank.length} 条。`);

        if (wrongCount > 0) {
            log(`还有 ${wrongCount} 道错题，点击「重新答题」重试...`);
            await new Promise(r => setTimeout(r, 1000));
            const retryBtn = document.querySelector('.exam-preview .submit');
            if (retryBtn) {
                const prevUrl = location.href;
                await clickAndVerify(retryBtn, () => location.href !== prevUrl, '重新答题', 5, 1200);
            } else {
                log("未找到重新答题按钮。");
                toggleAutoMode(false);
            }
        } else {
            log("全部答对！点击关闭按钮返回...");
            await new Promise(r => setTimeout(r, 800));
            const closeBtn = document.querySelector('.exam-preview .close-btn');
            if (closeBtn) {
                const prevUrl = location.href;
                await clickAndVerify(closeBtn, () => location.href !== prevUrl, '关闭', 4, 1000);
            }
        }
    }

    // 掌握度历史页
    async function processMasteryHistoryPage() {
        log("进入掌握度历史页，点击「去提升」...");
        await new Promise(r => setTimeout(r, 1000));
        const btn = document.querySelector('.improve-btn');
        if (btn) {
            const prevUrl = location.href;
            await clickAndVerify(btn, () => location.href !== prevUrl, '去提升', 5, 1200);
        }
        else { log("未找到「去提升」按钮。"); }
    }

    let learnPageBusy = false;

    // 完成当前知识点的必学资源
    async function completeCurrentResources(itemName) {
        // 读取必学进度
        const progressEls = document.querySelectorAll('.section-item-collapse-info.active .collapse-info-progress .progress-text');
        if (progressEls.length === 0) { log("  未找到必学进度元素。"); return; }
        const text = progressEls[0].innerText.trim();
        const match = text.match(/(\d+)\s*\/\s*(\d+)/);
        if (!match) { log("  无法解析必学进度。"); return; }
        const done = parseInt(match[1]), total = parseInt(match[2]);
        log(`  "${itemName}" 必学资源: ${done}/${total}`);
        if (done >= total) { log("  必学资源已完成。"); return; }

        // 等待资源卡片加载（Vue渲染可能延迟）
        let cards = document.querySelectorAll('.basic-info-video-card-container');
        for (let w = 0; w < 8 && cards.length === 0; w++) {
            await new Promise(r => setTimeout(r, 1000));
            cards = document.querySelectorAll('.basic-info-video-card-container');
        }
        if (cards.length === 0) { log("  资源卡片未加载，跳过。"); return; }

        // 找未完成的资源卡片
        let clicked = 0;
        for (let idx = 0; idx < cards.length; idx++) {
            if (!autoMode) break;
            cards = document.querySelectorAll('.basic-info-video-card-container');
            if (idx >= cards.length) break;
            const card = cards[idx];
            if (card.querySelector('.finished-icon')) continue;
            reliableClick(card);
            clicked++;
            log(`  点击未完成资源(${clicked})，等待4秒...`);
            await new Promise(r => setTimeout(r, 4000));
            let done = false;
            for (let w = 0; w < 10 && !done; w++) {
                await new Promise(r => setTimeout(r, 1000));
                const fresh = document.querySelectorAll('.basic-info-video-card-container');
                if (fresh[idx] && fresh[idx].querySelector('.finished-icon')) { done = true; break; }
            }
            log(done ? `  资源已完成。` : `  资源超时未完成，继续。`);
            await new Promise(r => setTimeout(r, 500));
        }
        if (clicked > 0) log(`  共处理 ${clicked} 个资源。`);
    }

    // 学习主页面
    async function processLearnPage() {
        if (learnPageBusy) return;
        learnPageBusy = true;
        log("进入学习主页面...");
        await new Promise(r => setTimeout(r, 1200));
        if (!autoMode) { learnPageBusy = false; return; }

        const currentTitle = document.querySelector('.point-title-text');
        const currentName = currentTitle ? currentTitle.innerText.trim() : '';

        let itemList = [];
        try { itemList = JSON.parse(GM_getValue('learn_tree_items', '[]')); } catch(e) {}
        if (itemList.length === 0) {
            log("首次进入，构建项目树...");
            const collapsedHeaders = document.querySelectorAll('.el-collapse-item__header:not(.is-active)');
            for (const h of collapsedHeaders) {
                try { h.click(); await new Promise(r => setTimeout(r, 500)); } catch(e) {}
            }
            await new Promise(r => setTimeout(r, 1000));
            const items = document.querySelectorAll('.section-item-collapse-info .title-text');
            items.forEach(el => { const n = el.innerText.trim(); if (n) itemList.push(n); });
            GM_setValue('learn_tree_items', JSON.stringify(itemList));
            log(`构建完成，共 ${itemList.length} 个项目。`);
        } else {
            log(`已加载树结构，共 ${itemList.length} 个项目。`);
        }

        let currentIdx = itemList.indexOf(currentName);
        if (currentIdx < 0 && currentName) {
            itemList = [];
            GM_setValue('learn_tree_items', '[]');
            log("当前项目不在树中，下次重新构建。");
            learnPageBusy = false;
            return;
        }
        log(`当前项目: "${currentName}" (第 ${currentIdx + 1}/${itemList.length})`);

        for (let i = currentIdx >= 0 ? currentIdx : 0; i < itemList.length; i++) {
            if (!autoMode) { learnPageBusy = false; return; }
            const name = itemList[i];

            const nowTitle = document.querySelector('.point-title-text');
            const nowName = nowTitle ? nowTitle.innerText.trim() : '';
            if (nowName !== name) {
                log(`切换到项目: "${name}"`);
                const allItems = document.querySelectorAll('.section-item-collapse-info .title-text');
                let found = false;
                for (const el of allItems) {
                    if (el.innerText.trim() === name) {
                        reliableClick(el);
                        found = true;
                        break;
                    }
                }
                if (!found) { log(`未找到项目"${name}"，跳过。`); continue; }
                await new Promise(r => setTimeout(r, 1500));
            }
            // 先完成必学资源（无论是否切换都要检查）
            await completeCurrentResources(name);
            // 等DOM稳定后再检测掌握度
            await new Promise(r => setTimeout(r, 800));

            // 读取掌握度，并做双重验证
            function readMasteryPct() {
                const el = document.querySelector('.simplified-mastery__percent');
                if (!el) return NaN;
                const raw = el.innerText || el.textContent || '';
                const m = raw.match(/(\d+)/);
                return m ? parseInt(m[1]) : NaN;
            }
            let pct = readMasteryPct();
            if (isNaN(pct)) { log(`"${name}" 无法读取掌握度。`); continue; }
            log(`"${name}" 掌握度: ${pct}%`);

            if (pct >= 90) {
                log(`≥90%，跳过。`);
                continue;
            }

            // 二次确认：重新读取防止瞬间数值变动
            await new Promise(r => setTimeout(r, 500));
            const pct2 = readMasteryPct();
            if (!isNaN(pct2) && pct2 >= 90) {
                log(`二次确认 ≥90% (${pct2}%)，跳过。`);
                continue;
            }

            log(`< 90%，点击「去提升」...`);
            const btn = document.querySelector('.simplified-mastery__action');
            if (btn) {
                const prevUrl = location.href;
                learnPageBusy = false;
                await clickAndVerify(btn, () => location.href !== prevUrl, '去提升', 5, 1200);
                return;
            }
            log("未找到「去提升」按钮。");
        }

        GM_setValue('learn_tree_items', '[]');
        log("🎉 所有项目 ≥ 90%！脚本完成。");
        learnPageBusy = false;
        toggleAutoMode(false);
    }

    // --- 8. 主调度 ---
    function mainLoop() {
        if (!autoMode) return;
        const currentUrl = window.location.href;

        if (currentUrl.includes('/studentReviewTestOrExam')) {
            processNewExamPage();
        } else if (currentUrl.includes('/masteryHistory/')) {
            processMasteryHistoryPage();
        } else if (currentUrl.includes('/learnPage/')) {
            processLearnPage();
        } else if (currentUrl.includes('/examPreview/')) {
            processAnswerRecordPage();
        } else if (currentUrl.includes('/point/')) {
            processPointPage();
        }
    }

    function notifyUser(title, message) {
        // 浏览器桌面通知
        if (Notification && Notification.permission === 'granted') {
            new Notification(title, { body: message, icon: 'https://image.zhihuishu.com/zhs/b2cm/base1/202304/a9b4329d78f142a8ac4d266e3c354187.png' });
        } else if (Notification && Notification.permission !== 'denied') {
            Notification.requestPermission().then(p => { if (p === 'granted') new Notification(title, { body: message }); });
        }
        // 闪烁面板按钮
        toggleButton.style.animation = 'none';
        toggleButton.offsetHeight; // reflow
        toggleButton.style.animation = 'pulse-alert 0.5s ease 4';
        setTimeout(() => { toggleButton.style.animation = ''; }, 2500);
    }

    function toggleAutoMode(start, clearBank) {
        autoMode = start;
        GM_setValue('auto_mode_running', start);
        if (autoMode) {
            startButton.textContent = '⏹ 停止自动答题';
            startButton.style.background = 'linear-gradient(135deg, #ef4444, #f43f5e)';
            startButton.style.boxShadow = '0 2px 10px rgba(239, 68, 68, 0.3)';
            log('🚀 自动答题已开始！');
            mainLoop();
        } else {
            startButton.textContent = '▶ 开始自动答题';
            startButton.style.background = 'linear-gradient(135deg, #6366f1, #8b5cf6)';
            startButton.style.boxShadow = '0 2px 10px rgba(99, 102, 241, 0.25)';
            if (clearBank) {
                quizBank = [];
                (unsafeWindow || window).name = '';
                saveQuizBank();
                log('自动答题已停止，错题记录已清除。');
                notifyUser('答题脚本已停止', '错题记录已清除');
            } else {
                log('自动答题已停止。');
                notifyUser('答题脚本已停止', '请检查页面状态');
            }
        }
    }

    // --- 9. 启动 ---
    let lastUrl = location.href;
    new MutationObserver(() => {
        const url = location.href;
        if (url !== lastUrl) { lastUrl = url; log(`URL 变动: ${url}`); if (autoMode) setTimeout(mainLoop, 3000); }
    }).observe(document, { subtree: true, childList: true });

    window.addEventListener('load', () => {
        log("✨ AI答题脚本已加载。请在右侧面板配置并开始。");
        if (GM_getValue('quizbank_enabled', false) && GM_getValue('quizbank_url', '')) { fetchQuizBank(); }
        if (GM_getValue('auto_mode_running', false)) {
            log("检测到答题进行中，自动继续...");
            toggleAutoMode(true);
        }
    }, false);

})();
