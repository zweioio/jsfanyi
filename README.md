# 即时翻译（Instant Translate）

即时翻译是一款 Chrome 翻译插件，集成「谷歌翻译 / AI 智能翻译」双引擎，支持 Side Panel 与网页内右侧停靠面板，并提供回译核对与划词快捷翻译等能力。

## English

Instant Translate is a Chrome extension that provides fast, convenient translation with **Google** and **AI (Microsoft Edge Translator)** engines. It supports both **Side Panel** and an in-page **dockable right panel** that can squeeze the webpage layout (no overlay blocking).

### Features

- Two engines: Google Translate + AI (Microsoft Edge Translator); falls back to Google when AI is unavailable
- Global language selector shared across all tabs (Source / Target)
- Text translation: paste, translate, copy, and text-to-speech
- Back-translation check to verify meaning
- Web selection (quick translate): select text on a webpage and view results in the panel
- Webpage bilingual / translated-only mode (Beta)
- Resizable docked panel: drag the left edge; width presets (Default 360px / 50% / 30%)
- History & caching for better responsiveness

### Install (Developer Mode)

1. Open `chrome://extensions/` and enable **Developer mode**
2. Click **Load unpacked** and select the `extension` folder
3. Open any webpage and click the extension icon

### Usage

1. Click the extension icon (or press **Alt+Q**) to open the docked panel
2. Pick languages using the global selector above the tab bar
3. Use Text Translate / Web Selection / Webpage modes as needed

### Dev Notes

- After reloading the extension in `chrome://extensions/`, you still need to **refresh the target webpage** to re-inject updated content scripts

## 功能

- 双引擎翻译：谷歌翻译 + AI 智能翻译；AI 不可用时自动回退谷歌翻译
- 全局语言选择：一套“翻译语言 / 目标语言”在三个 Tab 间共享
- 文本翻译：输入框 + 一键粘贴、翻译、复制、语音朗读
- 回译核对：自动将译文回译为源语言，便于核对语义是否准确
- 网页划词快捷翻译：在网页中选中文本，面板内即时显示翻译结果
- 网页对照翻译：支持“双语对照 / 仅查看译文”（Beta）
- 可调宽度停靠面板：拖动面板左侧边框调整宽度，并支持宽度预设（默认 360px / 50% / 30%）
- 历史记录与缓存：保存最近翻译记录，并对翻译结果做缓存提升响应速度

## 安装（开发者模式）

1. 打开 `chrome://extensions/`，开启右上角「开发者模式」
2. 点击「加载已解压的扩展程序」，选择 `extension` 文件夹
3. 打开任意网页，点击插件图标即可使用

## 使用方式

1. 点击插件图标（或使用快捷键 **Alt+Q**）打开右侧停靠面板
2. 在 Tab 选项上方的全局语言选择栏中设置“翻译语言 / 目标语言”
3. 根据需要使用「文本翻译 / 网页滑词翻译 / 网页对照翻译」

## 开发提示

- 在 `chrome://extensions/` 里刷新扩展后，仍需 **刷新目标网页** 才会重新注入更新后的内容脚本
