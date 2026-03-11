# 即时翻译官网 - React + Tailwind CSS + Aceternity UI

这是一个使用 Next.js、React、Tailwind CSS 和 Framer Motion 构建的现代化官网，采用 Aceternity UI 设计风格。

## 技术栈

- **Next.js 14** - React 框架
- **TypeScript** - 类型安全
- **Tailwind CSS** - 原子化 CSS
- **Framer Motion** - 动画库
- **Lucide React** - 图标库
- **clsx + tailwind-merge** - 类名合并工具

## 安装步骤

### 1. 安装依赖

```bash
cd website-react
npm install
```

### 2. 运行开发服务器

```bash
npm run dev
```

打开浏览器访问 [http://localhost:3000](http://localhost:3000)

### 3. 构建生产版本

```bash
npm run build
npm start
```

## 项目结构

```
website-react/
├── src/
│   ├── app/
│   │   ├── globals.css      # 全局样式
│   │   ├── layout.tsx       # 根布局
│   │   └── page.tsx         # 主页
│   ├── components/          # React 组件
│   │   ├── Navbar.tsx       # 导航栏
│   │   ├── Hero.tsx         # Hero 区域
│   │   ├── Features.tsx     # 功能展示
│   │   ├── Pricing.tsx      # 价格方案
│   │   ├── Install.tsx      # 安装教程
│   │   ├── FAQ.tsx          # 常见问题
│   │   └── Footer.tsx       # 页脚
│   └── lib/
│       └── utils.ts         # 工具函数
├── public/
│   └── assets/              # 静态资源
├── tailwind.config.ts       # Tailwind 配置
├── postcss.config.js        # PostCSS 配置
└── package.json             # 依赖配置
```

## Aceternity UI 组件

本项目实现了 Aceternity UI 的核心设计元素：

- ✨ 网格背景
- 🌈 渐变光晕效果
- 💎 玻璃拟态导航栏
- 🎨 渐变文字动画
- 🖱️ 鼠标跟随发光效果
- 🎭 流畅的页面动画
- 📱 响应式设计

## 特性

- 🚀 快速加载
- 📱 完全响应式
- 🎨 现代化设计
- ♿ 无障碍访问
- 🔍 SEO 优化

## 开发

### 代码风格

- 使用 TypeScript 进行类型检查
- 使用 ESLint 进行代码规范
- 使用 Prettier 进行代码格式化

### 添加新组件

1. 在 `src/components/` 目录创建新的 `.tsx` 文件
2. 使用 `framer-motion` 添加动画
3. 使用 Tailwind CSS 进行样式设计
4. 在 `page.tsx` 中导入并使用

## 部署

### Vercel（推荐）

```bash
npm install -g vercel
vercel
```

### Docker

```bash
docker build -t instant-translate .
docker run -p 3000:3000 instant-translate
```

## 许可证

MIT License

## 联系方式

如有问题或建议，请提交 Issue 或联系开发团队。
