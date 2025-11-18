# Omni-Intelligent Investment Advisor & Risk Management AI

**全栈式智能投资顾问与风险管理 AI**

A stunning cyberpunk-styled landing page for an AI-powered investment advisor and risk management system, built with Next.js 14, TypeScript, Tailwind CSS, Framer Motion, and Three.js.

一个采用赛博朋克风格的智能投资顾问与风险管理系统的展示页面，使用 Next.js 14、TypeScript、Tailwind CSS、Framer Motion 和 Three.js 构建。

---

## Features / 功能特性

- 🎨 **Cyberpunk Aesthetic / 赛博朋克美学**: Dark theme with neon accents (cyan, magenta, purple) / 深色主题配霓虹灯效果（青色、品红、紫色）
- 🌍 **Bilingual Support / 双语支持**: English and Chinese language switching / 中英文语言切换
- 📱 **Fully Responsive / 完全响应式**: Mobile-first design with desktop enhancements / 移动优先设计，支持桌面端增强
- ✨ **Smooth Animations / 流畅动画**: Framer Motion powered transitions and effects / 基于 Framer Motion 的过渡和特效
- 🎭 **Interactive 3D / 交互式 3D**: Three.js backgrounds and visualizations / Three.js 背景和可视化
- 📊 **Data Visualization / 数据可视化**: KPI dashboards and risk radar charts / KPI 仪表板和风险雷达图
- 🤖 **AI Investment Advisor Demo / AI 投资顾问演示**: Interactive chat interface with stock recommendations / 交互式聊天界面，提供股票推荐
- 🚀 **Production Ready / 生产就绪**: Optimized for Vercel deployment / 针对 Vercel 部署优化

---

## Tech Stack / 技术栈

- **Framework / 框架**: Next.js 14 (App Router)
- **Language / 语言**: TypeScript
- **Styling / 样式**: Tailwind CSS + Custom CSS Variables
- **Animations / 动画**: Framer Motion
- **3D Graphics / 3D 图形**: Three.js
- **Charts / 图表**: Recharts
- **UI Components / UI 组件**: Radix UI (via shadcn/ui)
- **Icons / 图标**: Lucide React

---

## Getting Started / 快速开始

### Installation / 安装

```bash
# Clone the repository / 克隆仓库
git clone <your-repo-url>

# Install dependencies / 安装依赖
npm install
# or / 或
pnpm install

# Run development server / 运行开发服务器
npm run dev
# or / 或
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. / 在浏览器中打开 [http://localhost:3000](http://localhost:3000)。

### Build for Production / 构建生产版本

```bash
npm run build
npm run start
```

---

## Project Structure / 项目结构

```
/
├── app/
│   ├── layout.tsx          # Root layout with language provider / 根布局（包含语言提供者）
│   ├── page.tsx             # Main landing page / 主页面
│   ├── globals.css          # Global styles and cyberpunk theme / 全局样式和赛博朋克主题
│   └── api/
│       └── feedback/        # Contact form API endpoint / 联系表单 API 端点
├── components/
│   ├── ui/                  # Reusable UI components / 可复用的 UI 组件
│   ├── NeonHeader.tsx       # Navigation header / 导航头部
│   ├── HeroGlitchTitle.tsx  # Glitched title effect / 故障标题效果
│   ├── HoloCard.tsx         # Holographic card component / 全息卡片组件
│   ├── ArchitectureScene.tsx # 3D architecture visualization / 3D 架构可视化
│   ├── MetricsPanel.tsx     # KPI dashboard / KPI 仪表板
│   ├── RiskRadar.tsx        # Risk visualization / 风险可视化
│   ├── TimelineRoadmap.tsx  # Product roadmap / 产品路线图
│   ├── FAQ.tsx              # Accordion FAQ / 手风琴式常见问题
│   ├── ContactForm.tsx      # Contact form / 联系表单
│   ├── UseCases.tsx         # Use case cards / 用例卡片
│   ├── KeyModules.tsx       # Feature modules / 功能模块
│   ├── ProblemSolution.tsx  # Problem/solution section / 问题/解决方案部分
│   ├── AIConsultant.tsx     # AI Investment Advisor demo / AI 投资顾问演示
│   └── FooterCRT.tsx        # Footer with CRT scanline effect / 带 CRT 扫描线效果的页脚
├── content/
│   ├── project.json         # Main content (bilingual) / 主要内容（双语）
│   └── kpis.json            # KPI data and chart data / KPI 数据和图表数据
├── lib/
│   ├── language-context.tsx # Language switching context / 语言切换上下文
│   └── utils.ts             # Utility functions / 工具函数
└── public/                  # Static assets / 静态资源
```

---

## Content Management / 内容管理

All text content is managed through JSON files in `/content`: / 所有文本内容通过 `/content` 目录中的 JSON 文件管理：

### `/content/project.json`

This file contains: / 此文件包含：

- Project title (bilingual) / 项目标题（双语）
- Problem statement / 问题陈述
- Solution description / 解决方案描述
- Key modules / 核心模块
- Use cases / 用例
- Roadmap / 路线图
- FAQ / 常见问题

### `/content/kpis.json`

Contains: / 包含：

- Metric values (VaR, Sharpe, Drawdown, etc.) / 指标值（VaR、夏普比率、回撤等）
- Chart data / 图表数据
- Risk radar data / 风险雷达数据

To modify content, edit these JSON files directly. The site will update automatically on rebuild. / 要修改内容，请直接编辑这些 JSON 文件。网站将在重新构建时自动更新。

---

## AI Investment Advisor Demo / AI 投资顾问演示

The AI Investment Advisor component (`components/AIConsultant.tsx`) provides an interactive chat interface for demonstrating investment advisory capabilities. / AI 投资顾问组件（`components/AIConsultant.tsx`）提供了一个交互式聊天界面，用于演示投资顾问功能。

### Features / 功能

- **Interactive Chat Interface / 交互式聊天界面**: Real-time conversation with the AI advisor / 与 AI 顾问实时对话
- **Stock Recommendations / 股票推荐**: Ask "What are some fundamentally strong stocks to recommend?" to get demo stock suggestions / 询问"最近有什么基本面好的股票推荐？"以获取演示股票建议
- **Quick Questions / 快速问题**: Pre-defined question buttons for easy interaction / 预定义问题按钮，便于交互
- **Demo Responses / 演示回复**: Fixed responses for demonstration purposes / 用于演示的固定回复

### Usage / 使用方法

Users can interact with the AI advisor by: / 用户可以通过以下方式与 AI 顾问交互：

1. Typing questions directly / 直接输入问题
2. Clicking quick question buttons / 点击快速问题按钮
3. Asking about stocks, risk analysis, or investment strategies / 询问股票、风险分析或投资策略

**Note**: This is a demo component with predefined responses. For production use, integrate with a real AI/ML backend. / **注意**：这是一个带有预定义回复的演示组件。在生产环境中使用，需要与真实的 AI/ML 后端集成。

---

## Deployment / 部署

### Vercel (Recommended) / Vercel（推荐）

1. Push your code to GitHub / 将代码推送到 GitHub
2. Import your repository on [Vercel](https://vercel.com) / 在 [Vercel](https://vercel.com) 上导入您的仓库
3. Vercel will automatically detect Next.js and deploy / Vercel 会自动检测 Next.js 并部署

### Manual Build / 手动构建

```bash
npm run build
```

The output will be in `.next/` directory. / 输出将在 `.next/` 目录中。

---

## Customization / 自定义

### Colors / 颜色

Edit `app/globals.css` to customize neon colors: / 编辑 `app/globals.css` 以自定义霓虹灯颜色：

```css
--neon-cyan: #00ffff;
--neon-magenta: #ff00ff;
--neon-purple: #a855f7;
```

### Animations / 动画

Adjust animation durations and effects in component files using Framer Motion props. / 使用 Framer Motion 属性在组件文件中调整动画持续时间和效果。

### 3D Scene / 3D 场景

Modify `components/ArchitectureScene.tsx` to customize the Three.js scene. / 修改 `components/ArchitectureScene.tsx` 以自定义 Three.js 场景。

### AI Advisor Responses / AI 顾问回复

Edit the `getAIResponse` function in `components/AIConsultant.tsx` to customize demo responses. / 编辑 `components/AIConsultant.tsx` 中的 `getAIResponse` 函数以自定义演示回复。

---

## Performance / 性能

- Three.js scenes use `IntersectionObserver` for lazy loading / Three.js 场景使用 `IntersectionObserver` 进行懒加载
- Images are optimized with Next.js Image component / 使用 Next.js Image 组件优化图片
- Framer Motion animations respect `prefers-reduced-motion` / Framer Motion 动画尊重 `prefers-reduced-motion` 设置
- Mobile devices get simplified 3D renderings / 移动设备获得简化的 3D 渲染

---

## Language Support / 语言支持

The application supports both English and Chinese. The default language is set to English. Users can toggle between languages using the language switch button in the header. / 应用程序支持英文和中文。默认语言设置为英文。用户可以使用标题栏中的语言切换按钮在语言之间切换。

To change the default language, modify `lib/language-context.tsx`: / 要更改默认语言，请修改 `lib/language-context.tsx`：

```typescript
const [language, setLanguage] = useState<Language>('en') // or 'zh' / 或 'zh'
```

---

## License / 许可证

MIT License - feel free to use this project for your own purposes. / MIT 许可证 - 可自由用于您自己的目的。

---

## Credits / 致谢

Built with ❤️ using Next.js, Tailwind CSS, Framer Motion, and Three.js. / 使用 Next.js、Tailwind CSS、Framer Motion 和 Three.js 构建。

---

## Contributing / 贡献

Contributions are welcome! Please feel free to submit a Pull Request. / 欢迎贡献！请随时提交 Pull Request。

---

## Support / 支持

For issues and questions, please open an issue on GitHub. / 如有问题和疑问，请在 GitHub 上提交 issue。
