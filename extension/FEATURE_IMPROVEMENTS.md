# 即时翻译插件 - 功能改进说明

## 📋 改进内容总览

本次更新主要实现了以下三个核心功能改进：

1. ✅ **将插件的侧边栏模式改为在当前页面上悬浮**
2. ✅ **将翻译引擎左右旋转改为下拉框选择**
3. ✅ **新增页面宽度调整功能和拖拽功能**

---

## 🎯 功能详细说明

### 1. 引擎选择下拉框

**改进前：** 左右切换的 Tab 标签（谷歌翻译引擎 | AI 智能引擎）
**改进后：** 简洁的下拉框选择器

**位置：** Header 区域右侧
**操作方式：** 点击下拉框选择翻译引擎
- 谷歌翻译引擎
- AI 智能引擎

**技术实现：**
- 使用原生 `<select>` 元素，自定义样式
- 引擎切换逻辑保持不变
- 设置自动保存到 `chrome.storage.sync`

---

### 2. 拖拽功能

**拖拽图标：** 
- 位置：Header 最左端（Logo 前面）
- 大小：20x20px
- 图标：六圆点拖拽手柄 (⋮⋮)

**操作方式：**
1. 鼠标悬停到拖拽图标上，光标变为抓取状态 (grab)
2. 按住拖拽图标，光标变为抓取中状态 (grabbing)
3. 拖动到任意位置释放即可

**技术细节：**
- 拖拽功能主要用于悬浮窗模式
- 拖拽位置自动保存到 `chrome.storage.local`
- 下次打开悬浮窗时恢复上次的位置
- 边界检测：悬浮窗不会超出浏览器可视区域

**注意：** Popup 模式下的拖拽仅保存偏移量，实际移动效果在悬浮窗模式下生效

---

### 3. 宽度调整功能

**宽度调整按钮：**
- 位置：Header 最右端（引擎选择器右侧）
- 大小：20x20px
- 图标：宽度调整图标（↔ 带有分割线）

**宽度循环模式：**
```
默认宽度 (400px) 
  ↓ 点击
50% 屏幕宽度 
  ↓ 点击
33.3% 屏幕宽度 
  ↓ 点击
默认宽度 (400px)
```

**状态提示：**
- 默认状态：`调整宽度（点击切换为 50%）`
- 50% 状态：`宽度：50%（点击切换为 33%）`
- 33% 状态：`宽度：33%（点击恢复默认）`

**技术实现：**
- 宽度状态保存到 `chrome.storage.local`
- 宽度变化消息通过 `chrome.runtime.sendMessage` 发送
- Background script 转发消息到 content script
- 悬浮窗和 popup 同步调整宽度

---

### 4. 页面悬浮窗模式 🆕

**悬浮窗特点：**
- 独立悬浮在网页上，不依赖浏览器侧边栏
- 可自由拖拽到任意位置
- 可调整宽度（50% / 33% / 默认）
- 包含完整的翻译功能

**悬浮窗结构：**
```
┌─────────────────────────────────┐
│ [⋮⋮] 🌐 即时翻译    [引擎▼] [↔] [×] │ ← Header（可拖拽）
├─────────────────────────────────┤
│                                 │
│         iframe (popup.html)     │
│                                 │
│                                 │
└─────────────────────────────────┘
```

**打开悬浮窗的方式：**
1. 首次加载时自动检查 `floatingPanelOpen` 状态
2. 通过消息 `jt_open_floating_panel` 触发打开

**关闭悬浮窗：**
- 点击 Header 右上角的关闭按钮 (×)
- 关闭后状态保存到 `chrome.storage.local`

**位置记忆：**
- 拖拽后自动保存位置到 `chrome.storage.local`
- 包含 `panelX`、`panelY` 坐标
- 下次打开时恢复上次的位置

---

## 📁 文件修改清单

### 修改的文件

1. **popup.html**
   - 添加拖拽图标（`.drag-handle`）
   - 添加宽度调整按钮（`.width-adjust-btn`）
   - 将引擎选择器改为下拉框（`.engine-select`）
   - 更新 Header 布局（`.header-controls`）

2. **popup.js**
   - 新增 `initDragFeature()` 函数：初始化拖拽功能
   - 新增 `updateWidthUI()` 函数：更新宽度 UI 显示
   - 新增 `initEngineSelect()` 函数：初始化引擎下拉框
   - 在 `DOMContentLoaded` 事件中调用新功能

3. **content.js**
   - 新增 `createFloatingPanel()` 函数：创建悬浮窗
   - 新增悬浮窗拖拽逻辑
   - 新增悬浮窗宽度调整逻辑
   - 添加消息监听器处理 `jt_open_floating_panel`
   - 添加消息监听器处理 `jt_width_changed`

4. **background.js**
   - 新增 `jt_width_changed` 消息处理：转发宽度变化
   - 新增 `jt_open_floating_panel` 消息处理：打开悬浮窗
   - 确保 content script 注入后再发送消息

### 未修改的文件

- **manifest.json** - 权限配置已正确，无需修改

---

## 🔧 技术实现细节

### 状态管理

**宽度状态：**
```javascript
const widthStates = ['default', 'half', 'third'];
let currentWidthState = 0; // 循环索引
```

**存储内容：**
- `chrome.storage.sync`: `engine` (引擎选择)
- `chrome.storage.local`: 
  - `widthState` (宽度状态)
  - `panelX`, `panelY` (悬浮窗位置)
  - `floatingPanelOpen` (悬浮窗开关状态)
  - `dragDeltaX`, `dragDeltaY` (拖拽偏移量)

### 消息通信流程

**宽度调整：**
```
popup.js (点击按钮)
  ↓ sendMessage('jt_width_changed')
background.js (接收并转发)
  ↓ tabs.sendMessage()
content.js (接收并应用宽度)
  ↓ 更新悬浮窗宽度
```

**打开悬浮窗：**
```
popup.js / 用户操作
  ↓ sendMessage('jt_open_floating_panel')
background.js (接收)
  ↓ 注入 content.js
  ↓ sendMessage('jt_open_floating_panel')
content.js (接收并创建悬浮窗)
```

### 拖拽算法

```javascript
// 计算偏移量
offsetX = mouseDownX - panelRect.left
offsetY = mouseDownY - panelRect.top

// 拖拽时更新位置
newX = currentMouseX - offsetX
newY = currentMouseY - offsetY

// 边界检查
finalX = clamp(newX, 0, screenWidth - panelWidth)
finalY = clamp(newY, 0, screenHeight - panelHeight)
```

---

## 🚀 使用方法

### 使用 Popup 模式（默认）

1. 点击浏览器工具栏的即时翻译图标
2. 使用拖拽图标调整 popup 位置（有限支持）
3. 点击宽度调整按钮改变宽度
4. 使用下拉框选择翻译引擎

### 使用悬浮窗模式

**打开悬浮窗：**
```javascript
// 在 popup 中发送消息
chrome.runtime.sendMessage({ 
  type: 'jt_open_floating_panel' 
});
```

**使用悬浮窗：**
1. 拖动 Header 移动悬浮窗到任意位置
2. 点击宽度调整按钮改变宽度
3. 使用下拉框选择翻译引擎
4. 点击关闭按钮 (×) 关闭悬浮窗

---

## 📝 注意事项

### 性能优化

1. **拖拽性能：** 使用 `requestAnimationFrame` 优化（未来改进）
2. **位置保存：** 只在 `mouseup` 时保存，避免频繁写入
3. **宽度调整：** 使用 CSS `transition` 实现平滑过渡

### 兼容性

- ✅ Chrome 88+
- ✅ Edge 88+ (基于 Chromium)
- ⚠️ Firefox 需要额外适配（manifest v3 支持）

### 已知限制

1. **Popup 拖拽：** 浏览器限制，popup 本身无法自由移动，拖拽功能主要在悬浮窗模式下生效
2. **最小宽度：** 悬浮窗最小宽度为 300px，避免内容显示不全
3. **位置记忆：** 切换显示器后位置可能需要重新调整

---

## 🎨 UI/UX 改进

### 视觉设计

- **拖拽图标：** 六圆点手柄，符合常见拖拽交互习惯
- **宽度调整图标：** 分割线 + 双向箭头，直观表达宽度调整
- **引擎下拉框：** 圆角设计，与整体风格统一
- **悬浮窗：** 现代化卡片设计，阴影和圆角提升质感

### 交互体验

- **光标反馈：** grab/grabbing 光标状态切换
- **工具提示：** hover 时显示功能说明
- **平滑过渡：** 宽度变化使用 0.3s ease 动画
- **边界检测：** 拖拽时不会超出可视区域

---

## 📊 测试清单

### 功能测试

- [x] 引擎下拉框可以正常切换引擎
- [x] 拖拽功能可以移动悬浮窗
- [x] 宽度调整按钮可以循环切换三种宽度
- [x] 悬浮窗可以正常打开和关闭
- [x] 位置和宽度状态可以正确保存和恢复

### 兼容性测试

- [ ] Chrome 最新版
- [ ] Edge 最新版
- [ ] 不同分辨率屏幕
- [ ] 多显示器环境

### 性能测试

- [ ] 拖拽流畅无卡顿
- [ ] 宽度调整响应迅速
- [ ] 内存占用合理

---

## 🔮 未来改进方向

1. **更多宽度预设：** 支持自定义宽度输入
2. **透明度调节：** 悬浮窗支持透明度调整
3. **置顶功能：** 支持悬浮窗始终置顶
4. **快捷键：** 添加快捷键快速打开/关闭悬浮窗
5. **主题切换：** 支持深色模式

---

## 📞 技术支持

如有问题或建议，请查看：
- 项目文档：`PLUGIN_IMPROVEMENTS.md`
- 更新日志：本文档

**版本：** v1.3
**更新日期：** 2026-03-11
