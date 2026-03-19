# Instant Translate (即时翻译)

A Chrome extension that provides fast, convenient translation with **Google** and **AI (Microsoft Edge Translator)** engines. It supports **Side Panel** and an in-page **dockable panel** that can squeeze the webpage layout (no overlay blocking).

## Key Features

- **Two translation engines**: Google Translate + AI (Microsoft Edge Translator); Google automatically falls back when AI is unavailable.
- **Global language selector**: one “Source / Target” language setting shared across all tabs.
- **Text translation**: input box + one-click paste, translate, copy, and text-to-speech.
- **Back-translation check**: automatically translates the result back to the source language to verify meaning.
- **Web selection (quick translate)**: select text on a webpage and see the translation in the panel.
- **Webpage bilingual/translated mode**: switch between “Bilingual” and “Translated only” (Beta).
- **Resizable docked panel**: drag the left edge to resize; also supports width presets (Default 360px / 50% / 30%).
- **History & caching**: keeps recent translation history and caches translations to improve responsiveness.

## How to Use

- **Open the docked panel**: click the extension icon (or use the shortcut **Alt+Q**).
- **Resize**: drag the left border of the panel.
- **Switch engine**: use the engine dropdown on the panel header.
- **Pick languages**: use the global “Source / Target” language selector above the tab bar.

## Install (Developer Mode)

1. Open `chrome://extensions/` and enable **Developer mode**.
2. Click **Load unpacked** and select the [`extension`](file:///Users/apple/Desktop/即时翻译/extension) folder.
3. Open any webpage and click the extension icon.

## Project Structure

- [`extension`](file:///Users/apple/Desktop/即时翻译/extension): Chrome extension source (Manifest V3)
- [`website`](file:///Users/apple/Desktop/即时翻译/website): landing page assets

## Notes for Development

- After reloading the extension in `chrome://extensions/`, you still need to **refresh the target webpage** to re-inject updated content scripts.

