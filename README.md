# 智慧树AI智能课程 - 全自动掌握度提升脚本

[![License](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Tampermonkey](https://img.shields.io/badge/Tampermonkey-v5.0+-black?logo=tampermonkey)](https://www.tampermonkey.net/)

专为**智慧树 AI 智能课程**（`ai-smart-course-student-pro.zhihuishu.com`）设计的全自动答题脚本。
## 声明
- 本项目仅供学习和研究使用，请勿用于商业用途。
- 使用前请确保已了解并遵守智慧树平台的相关规定。
- 作者不对因使用本脚本而导致的任何后果负责。
- 本项目只是作者用于学习ai和使用ai编程的训练项目
## 功能

- ✅ 全题型 AI 答题（填空 / 单选 / 多选 / 判断）—— 基于 DeepSeek API
- ✅ 自动提交、错题自动记录与修正、重答至全对
- ✅ 全知识点遍历提升至 90%+ 掌握度
- ✅ 外部 JSON 题库加载 + 错题自动积累
- ✅ 题库优先匹配，未命中自动 Fallback 到 AI

## 安装

1. 安装 [Tampermonkey](https://www.tampermonkey.net/)（支持 Chrome / Edge / Firefox）
2. 点击 Tampermonkey 图标 → 创建新脚本 → 复制 `index.js` 全部内容粘贴
3. 打开 [智慧树 AI 智能课程](https://ai-smart-course-student-pro.zhihuishu.com/learnPage/) 学习页面
4. 点击右侧 **AI** 按钮打开设置面板
5. 填入你的 **DeepSeek API Key**（在 [platform.deepseek.com](https://platform.deepseek.com/) 获取）
6. （可选）启用题库，加载外部 JSON 题库
7. 点击「开始自动答题」

## 配置说明

| 配置项 | 说明 |
|--------|------|
| DeepSeek API Key | 必填。在 DeepSeek 开放平台获取 |
| 启用题库 | 可选。开启后优先从题库匹配答案 |
| 题库 JSON 地址 | 题库文件的 Raw URL（如 Gist） |
| AI Fallback | 题库未命中时自动调用 DeepSeek |
| 本地题库 | 从本地加载下载的 JSON 题库文件 |
| 完成条件 | 仅灰色（未开始）/ 含薄弱点（灰+粉） |

## 题库格式

```json
[
  { "q": "题目内容...", "a": "A" },
  { "q": "填空题题目...", "a": "正确答案" }
]
```

## License

[MIT](https://opensource.org/licenses/MIT)
