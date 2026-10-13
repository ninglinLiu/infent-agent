# omniAI 与学习室 · 雨夜桌面入口

`/dashboard` 的初始画面仅显示 3D 房子和雨夜场景，没有标题、浮层导航、介绍文案或安装横幅。不制作手机端布局。

- 点击 omniAI 主招牌或桌面屏幕：打开 infent-agent 的研究工作台。
- 点击学习室竖牌或二楼 READ / THINK：打开学院，保留导师、三节短课、四步剧情模拟。
- 点击 CASE FILES：打开学习室的剧情模拟。
- 点击 GitHub 实体牌：在新标签页打开 https://github.com/ninglinLiu 。
- 按住鼠标左键拖动可 360° 水平旋转并调整俯视角度；滚轮可以放大或缩小。限制最近／最远距离并避免镜头转到地面下。
- 场景内按 Esc 还原初始视角；键盘聚焦场景后按 Enter 进入 omniAI，按 L 进入学习室。拖动招牌不会误触导航。
- 工作台内按 Esc 或点击侧栏顶部返回按钮回到房子。

## 保留的前端

主仓库统一为 `ninglinLiu/infent-agent`。学习室在登录／序章、内部页顶部提供 English／中文切换，设置页也可选择语言；共享研究工作台的 `omni.lang` 偏好。内容来自 `lib/academy-content.ts`，课程进度仍使用原有索引与存储键，切换语言不重置昵称或进度。

`components/dash/repository/` 复用指定仓库 `ninglinLiu/infent-agent` 的研究前端与本地已接入的服务端能力。2026-10-13 核对 main 为 a023c68，与本地 HEAD 一致。omniAI 保留行情、AI 研究、持仓、策略、回测等功能。

`AcademyConsole` 重新接入已有学院组件，对照 https://infent-academy-3d.vercel.app/dashboard 。学习室只保留昵称／序章、导师、课程、剧情模拟和学习设置，移除重复的 K 线、净值指标、Agent 聊天、持仓与策略时间线。学习退出只清理学院进度，不重置 omniAI 的状态。原有本地存储键不变，保留已有学习进度。

挥手修正：右侧手臂改用正 Z 旋转，向身体外侧抬起；增加平滑过渡。

街角新增 GitHub 牌、灯串／纸灯笼、遮雨伞、长椅、书箱与小猫、路沿／斑马线／井盖、空调外机、后窗与爬梯。仍以 3D 实体物件展示，不添加首屏浮层。

## 3D 参考及实现范围

参考 [Jesse’s Ramen case study](https://jesse-zhou.medium.com/jesses-ramen-case-study-77bae77ab5f0)：独立建筑、冷暖霓虹、地面反射、雨点、屋顶粒子全息和入口镜头推进。

当前模型由 Three.js 几何体生成，使用实时灯光、Bloom 和低分辨率反射，尚未使用原案例的 Blender 模型及烘焙贴图。未使用原作者模型或纹理文件。

系统减少动态效果偏好会停止环境动画；页面隐藏及工作台打开时暂停场景渲染。低帧率时降低渲染开销。WebGL 加载失败时仅在错误状态显示进入工作台的备用入口。
