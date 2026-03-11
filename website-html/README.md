# 即时翻译官网 - 纯 HTML 版本

这是一个使用**纯 HTML + CSS + JavaScript**构建的官网，采用 Aceternity UI 设计风格。

## 📁 项目结构

```
website-html/
├── index.html          # 主页面
├── css/
│   └── style.css      # 样式文件
├── js/
│   └── main.js        # JavaScript 文件
└── assets/            # 资源文件（图片等）
```

## 🚀 如何使用

### 方法 1：直接打开
直接双击 `index.html` 文件即可在浏览器中预览。

### 方法 2：使用本地服务器（推荐）

**使用 Python：**
```bash
cd /Users/apple/Desktop/即时翻译/website-html
python3 -m http.server 8000
```

然后在浏览器打开：http://localhost:8000

**使用 Node.js：**
```bash
npx serve /Users/apple/Desktop/即时翻译/website-html
```

## ✨ 主要特性

### 1. **Aceternity UI 设计风格**
- ✅ 中性色调配色方案
- ✅ 渐变文字效果
- ✅ 毛玻璃导航栏
- ✅ 精细的边框和阴影
- ✅ 流畅的动画过渡

### 2. **交互效果**
- ✅ Background Ripple（背景涟漪）
- ✅ 导航栏滚动变形
- ✅ 卡片悬浮效果
- ✅ 平滑滚动导航
- ✅ 按钮悬浮动画

### 3. **响应式设计**
- ✅ 移动端适配
- ✅ 平板适配
- ✅ 桌面端优化

## 🎨 如何修改样式

### 修改颜色

打开 `css/style.css`，在文件顶部找到 `:root` 部分：

```css
:root {
    --background: #ffffff;        /* 背景色 */
    --foreground: #0a0a0a;        /* 文字颜色 */
    --primary-start: #3b82f6;     /* 渐变起始色 */
    --primary-end: #8b5cf6;       /* 渐变结束色 */
}
```

### 修改文字内容

打开 `index.html`，找到对应的部分直接修改文字：

```html
<h1 class="hero-title">
    <span class="title-main">在这里修改主标题</span>
    <span class="title-sub">在这里修改副标题</span>
</h1>
```

### 修改按钮链接

找到按钮元素，修改 `href` 属性：

```html
<a href="你的下载链接.zip" download class="btn btn-large btn-primary">
    下载浏览器插件
</a>
```

## 📝 常用样式类名

### 按钮样式
- `btn btn-primary` - 黑色主按钮
- `btn btn-secondary` - 透明次按钮
- `btn btn-large` - 大尺寸按钮
- `btn btn-full` - 全宽按钮

### 卡片样式
- `card card-glow` - 带发光效果的卡片
- `pricing-card` - 价格卡片
- `step-card` - 步骤卡片
- `faq-item` - FAQ 卡片

### 背景样式
- `section` - 普通白色背景
- `section-bg` - 浅灰色背景

## 🔧 自定义功能

### 添加新的颜色主题

在 `css/style.css` 中添加新的颜色变量：

```css
:root {
    --blue-theme-start: #3b82f6;
    --blue-theme-end: #06b6d4;
}
```

然后在 HTML 中使用：

```html
<span class="title-sub" style="
    background: linear-gradient(to right, var(--blue-theme-start), var(--blue-theme-end));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
">
    你的文字
</span>
```

### 调整动画速度

找到对应的 `@keyframes` 和 `transition`：

```css
/* 修改渐变动画速度 */
@keyframes gradient-shift {
    0%, 100% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
}
/* 默认 8s，可以改成 4s 更快 */
```

## 📱 浏览器兼容性

- ✅ Chrome / Edge（推荐）
- ✅ Firefox
- ✅ Safari
- ✅ 移动端浏览器

## 🎯 下一步

1. **修改内容**：打开 `index.html` 修改为您需要的文字
2. **调整样式**：打开 `css/style.css` 调整颜色和间距
3. **添加功能**：在 `js/main.js` 中添加自定义 JavaScript
4. **部署上线**：上传到任何静态网站托管服务

## 💡 提示

- 所有样式都使用 CSS 变量，方便统一修改
- 代码中有详细的注释，方便理解
- 使用标准的 HTML5，易于扩展
- 完全响应式，移动端友好

## 📄 许可证

自由使用，无限制。

---

如有问题，欢迎随时询问！
