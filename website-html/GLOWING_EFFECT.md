# 描边发光效果实现说明

## ✨ 效果预览

在纯 HTML 版本的核心功能板块中，我已经添加了 Aceternity UI 风格的**描边发光效果**（Glowing Effect）。

## 🎯 实现原理

### 1. **HTML 结构**

```html
<div class="card-glow-wrapper">
    <div class="card-glow">
        <!-- 卡片内容 -->
        <div class="card-icon">图标</div>
        <h3>标题</h3>
        <p>描述</p>
    </div>
</div>
```

### 2. **CSS 实现 - 双层描边**

#### 外层描边（静态渐变边框）
```css
.card-glow::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 16px;
    padding: 1px;
    background: linear-gradient(135deg, 
        rgba(255, 255, 255, 0.4) 0%, 
        rgba(255, 255, 255, 0.1) 25%, 
        rgba(255, 255, 255, 0.1) 75%, 
        rgba(255, 255, 255, 0.4) 100%);
    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    opacity: 0.3;
}
```

**关键技术：**
- 使用 `mask` 属性创建边框效果
- `linear-gradient` 创建四角渐变
- `mask-composite: xor` 只显示边框部分

#### 内层发光（动态旋转光晕）
```css
.card-glow::after {
    content: '';
    position: absolute;
    inset: -2px;
    border-radius: 16px;
    background: conic-gradient(
        from calc((var(--start, 0) - var(--spread, 60)) * 1deg),
        #00000000 0deg,
        rgba(255, 255, 255, 0.8) calc(var(--spread, 60) * 2deg),
        #00000000 calc(var(--spread, 60) * 2deg)
    );
    opacity: 0;
    filter: blur(8px);
}
```

**关键技术：**
- 使用 `conic-gradient` 创建锥形渐变
- CSS 变量 `--start` 控制发光起始角度
- CSS 变量 `--spread` 控制发光范围
- `filter: blur(8px)` 创建模糊光晕效果

### 3. **JavaScript 实现 - 鼠标跟踪**

```javascript
function initGlowingCards() {
    const cards = document.querySelectorAll('.card-glow');
    
    cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            // 计算鼠标相对于卡片中心的角度
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const deltaX = x - centerX;
            const deltaY = y - centerY;
            const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI) + 180;
            
            // 设置 CSS 变量
            card.style.setProperty('--start', angle);
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.setProperty('--start', 0);
        });
    });
}
```

**工作原理：**
1. 监听鼠标移动事件
2. 计算鼠标位置相对于卡片中心的角度
3. 使用 `Math.atan2()` 计算反正切值
4. 将弧度转换为角度（0-360 度）
5. 通过 CSS 变量动态控制发光位置

### 4. **动画效果**

#### 悬浮时的发光动画
```css
.card-glow:hover::before {
    opacity: 1;
}

.card-glow:hover::after {
    opacity: 0.6;
    animation: glow-rotate 4s linear infinite;
}

@keyframes glow-rotate {
    from {
        --start: 0;
    }
    to {
        --start: 360;
    }
}
```

**效果：**
- 悬浮时边框变亮
- 光晕开始旋转（4 秒一圈）
- 配合 JavaScript 的鼠标跟踪，实现双重动态效果

## 🎨 布局设计

### 响应式网格布局

```css
.glowing-cards {
    display: grid;
    grid-template-columns: 1fr;  /* 移动端单列 */
    gap: 16px;
}

@media (min-width: 768px) {
    .glowing-cards {
        grid-template-columns: repeat(12, 1fr);  /* 桌面端 12 列 */
        grid-template-rows: repeat(3, minmax(14rem, auto));
    }
    
    /* 使用 CSS Grid Area 实现不规则布局 */
    .card-glow-wrapper:nth-child(1) {
        grid-area: 1 / 1 / 2 / 7;   /* 第 1 行，第 1-6 列 */
    }
    .card-glow-wrapper:nth-child(2) {
        grid-area: 1 / 7 / 2 / 13;  /* 第 1 行，第 7-12 列 */
    }
    .card-glow-wrapper:nth-child(3) {
        grid-area: 2 / 1 / 3 / 7;   /* 第 2 行，第 1-6 列 */
    }
    .card-glow-wrapper:nth-child(4) {
        grid-area: 2 / 7 / 3 / 13;  /* 第 2 行，第 7-12 列 */
    }
    .card-glow-wrapper:nth-child(5) {
        grid-area: 3 / 1 / 4 / 13;  /* 第 3 行，第 1-12 列 */
    }
}
```

**布局效果：**
- 移动端：垂直排列
- 桌面端：
  - 第一行：2 个卡片（各占 6 列）
  - 第二行：2 个卡片（各占 6 列）
  - 第三行：1 个卡片（占满 12 列）

## 📝 自定义配置

### 修改发光颜色

```css
/* 改为蓝色发光 */
.card-glow::after {
    background: conic-gradient(
        from calc((var(--start, 0) - var(--spread, 60)) * 1deg),
        #00000000 0deg,
        rgba(59, 130, 246, 0.8) calc(var(--spread, 60) * 2deg),  /* 蓝色 */
        #00000000 calc(var(--spread, 60) * 2deg)
    );
}
```

### 修改发光强度

```css
/* 增强发光 */
.card-glow::after {
    filter: blur(12px);  /* 增大模糊值 */
}

.card-glow:hover::after {
    opacity: 0.8;  /* 提高不透明度 */
}
```

### 修改发光范围

```css
/* 增大发光范围 */
.card-glow::after {
    background: conic-gradient(
        /* ... */
        rgba(255, 255, 255, 0.8) calc(var(--spread, 120) * 2deg),  /* 增大 spread */
        /* ... */
    );
}
```

### 修改动画速度

```css
.card-glow:hover::after {
    animation: glow-rotate 2s linear infinite;  /* 2 秒一圈，更快 */
}
```

## 🔧 技术要点总结

### 1. **CSS Mask**
- 使用 `mask` 创建边框效果
- 比 `border` 更灵活，支持渐变
- `mask-composite: xor` 是关键

### 2. **CSS Conic Gradient**
- 锥形渐变，适合创建旋转效果
- 配合 CSS 变量实现动态控制
- 可以创建任意角度的光晕

### 3. **CSS Variables**
- `--start`: 控制发光起始角度
- `--spread`: 控制发光范围
- JavaScript 动态设置，CSS 实时响应

### 4. **JavaScript Math**
- `Math.atan2()`: 计算角度
- 弧度转角度：`* (180 / Math.PI)`
- 坐标计算：相对中心点的偏移

## 🎯 与 React 版本对比

| 特性 | React 版本 | **纯 HTML 版本** |
|------|-----------|----------------|
| **发光效果** | GlowingEffect 组件 | CSS 伪元素 + 动画 |
| **鼠标跟踪** | useMousePosition Hook | addEventListener |
| **布局** | CSS Grid + grid-area | CSS Grid + grid-area |
| **性能** | 需要 React 渲染 | 原生 CSS，性能更好 |
| **文件大小** | ~20KB（组件） | ~2KB（纯 CSS/JS） |

## 💡 优化建议

### 1. **性能优化**
```css
/* 使用 transform 代替 top/left */
.card-glow::after {
    transform: translateZ(0);  /* GPU 加速 */
    will-change: opacity;
}
```

### 2. **移动端优化**
```css
@media (max-width: 768px) {
    .card-glow::after {
        display: none;  /* 移动端禁用发光动画 */
    }
}
```

### 3. **减少重绘**
```javascript
// 使用节流
let ticking = false;
card.addEventListener('mousemove', (e) => {
    if (!ticking) {
        window.requestAnimationFrame(() => {
            // 更新发光位置
            ticking = false;
        });
        ticking = true;
    }
});
```

## 🚀 下一步

1. **调整发光颜色**：修改 CSS 中的 rgba 值
2. **调整发光强度**：修改 blur 和 opacity
3. **添加更多动画**：结合 hover 状态
4. **优化移动端**：考虑性能禁用动画

---

现在您可以在浏览器中预览效果，鼠标悬浮在卡片上即可看到**描边发光效果**！🎉
