# BMAD PRD: MindWell 前端 UI 全面重构

> **项目：** 观心 / ECHO — MindWell  
> **级别：** Level 3（复杂功能集）  
> **版本：** v1.0  
> **日期：** 2025-07-16  

---

## §1 产品概述与愿景

### 1.1 产品愿景

将 MindWell 从 **SaaS 后台工具风格** 重构为 **「数字情绪栖息地」** — 一个以「月光深夜情绪宇宙」为核心美学的沉浸式心理陪伴空间。

### 1.2 三大核心目标

| ID | 目标 | 说明 |
|----|------|------|
| **G1** | 品牌视觉重塑 | 统一「月光深夜情绪宇宙」主题，建立月亮/星点/呼吸光/漂浮粒子/深夜蓝的品牌记忆点 |
| **G2** | 用户体验升级 | 从功能型界面 → 情感型体验，像 Calm/Headspace 般有温度的陪伴感 |
| **G3** | 技术架构现代化 | 建立 Day/Night 双模式 Token System，CSS Variables 驱动动态主题 |

### 1.3 范围界定

| 范围 | 包含 | 不包含 |
|------|------|--------|
| ✅ 前端 UI 全面重构 | 后端 API 变更（如需要） | 
| ✅ CSS Variables 主题系统重写 | 数据库模型变更 |
| ✅ 所有核心页面（首页/ECHO/聊天/日记） | 第三方集成（如支付） |
| ✅ 布局/导航/右侧面板 | 移动端原生开发 |
| ✅ 动态氛围系统（粒子/呼吸光/流光） | 国际化（i18n） |
| ✅ 情绪反馈驱动的动态页面 | 离线 PWA 支持 |

---

## §2 目标用户与场景

### 2.1 用户画像

| 画像 | 描述 | 核心需求 |
|------|------|---------|
| **深夜倾诉者** | 20-35岁，夜间情绪波动大 | 安静陪伴、无需组织语言、安全感 |
| **情绪记录者** | 25-40岁，有日记习惯 | 沉浸式记录、情绪可视化、趋势追踪 |
| **答案追寻者** | 各年龄段，迷茫/焦虑时 | 寓意式回应、仪式感、宇宙隐喻 |
| **成长学习者** | 20-30岁，自我提升导向 | 心理测评、呼吸练习、正向思维 |

### 2.2 核心用户故事

| 角色 | 故事 |
|------|------|
| 深夜倾诉者 | "凌晨2点，我打开 MindWell，月亮缓缓浮现，粒子在四周漂浮。AI 的头像轻轻呼吸着，好像在说'我在'。" |
| 情绪记录者 | "每天睡前记录心情，情绪球漂浮在页面上，像星星一样。写下感受时，纸条在月光下微微发光。" |
| 答案追寻者 | "我在巨大的玻璃输入框里写下问题，看着它像沉入宇宙深处。片刻后，答案如星光般浮现。" |
| 成长学习者 | "打开首页，湖面在月光下泛着微光。场景卡随着我的情绪变换颜色，像在回应我。" |

---

## §3 现状分析与差距评估

### 3.1 现有基础设施盘点

| 资产 | 状态 | 复用策略 |
|------|------|---------|
| `ParticleField.tsx` | ✅ 可用 | 保留核心逻辑，增加情绪色彩联动 |
| `AmbientLighting.tsx` | ✅ 可用 | 扩展为场景卡背景层，增加呼吸动画 |
| `theme.css` CSS Variables | ⚠️ 部分可用 | 保留结构，扩展为 Day/Night Token System |
| `tailwind.config.ts` | ⚠️ 部分可用 | 保留色值，增加 Token 语义别名 |
| `glass` / `glass-light` / `glass-heavy` | ✅ 可用 | 保留，统一为 Token 驱动 |
| `useMoodTheme.ts` | ⚠️ 需扩展 | 增加 Day/Night 切换，Token 注入 |
| `night.css` | 🏗️ 需迁移 | 逐步迁移到 Token System，最终废弃 |
| `AppShell` 三栏结构 | ✅ 可用 | 保留，增加场景容器层 |

### 3.2 16 条差距矩阵

| # | 需求 | 现状 | 差距等级 |
|---|------|------|---------|
| 1 | 定位: 数字情绪栖息地 | 暗色空间主题 | 🟡 需调性增强 |
| 2 | 月光深夜情绪宇宙主题 | 有 moon 色系，缺系统化 | 🔴 需新建 Token 体系 |
| 3 | 布局左/中/右 | 三栏已实现 | 🟢 微调内容即可 |
| 4 | 首页沉浸场景卡 | Hero 有基础元素 | 🔴 需新建场景卡引擎 |
| 5 | 日夜双模式 | 完全未实现 | 🔴 需新建 |
| 6 | 卡片系统(发光动态) | 三层 glass 存在 | 🟡 需增加发光动画 |
| 7 | 导航月光滑过/高亮 | 基础 hover 存在 | 🟡 需增强动效 |
| 8 | ECHO 宇宙回应感 | 基础功能完整 | 🟡 需提升视觉张力 |
| 9 | 聊天深夜陪伴空间 | 呼吸头像+玻璃气泡 | 🟡 需沉浸感增强 |
| 10 | 情绪日记漂浮球 | 标准表单 | 🔴 需重建 |
| 11 | 动态氛围系统 | ParticleField 存在 | 🟡 需增加元素 |
| 12 | 情绪反馈动态页面 | CSS class 切换 | 🟡 需增强动态范围 |
| 13 | 空状态设计 | 完全未实现 | 🔴 需新建 |
| 14 | 品牌记忆点 | 月亮/星点有基础 | 🟡 需系统化 |
| 15 | CSS Variables 动态主题 | Variables 存在 | 🟡 需 Day/Night 扩展 |
| 16 | Calm/Headspace 质感 | 方向正确 | 🟡 需深度打磨 |

---

## §4 Day/Night Token System（核心技术决策）

### 4.1 三层架构

```
┌────────────────────────────────────────────────┐
│  Layer 3: 情绪层 (Mood Overrides)              │
│  .mood-happy / .mood-calm / .mood-sad          │
│  覆盖 accent / glow / saturation               │
├────────────────────────────────────────────────┤
│  Layer 2: 语义层 (Semantic Tokens)             │
│  --color-surface / --color-text-primary        │
│  --glass-bg / --shadow-ambient                 │
│  由 Day/Night 切换决定取值                     │
├────────────────────────────────────────────────┤
│  Layer 1: 原始层 (Raw Tokens)                  │
│  --moon-400 / --void-900 / --lavender-500      │
│  静态色值，仅设计变更时修改                     │
└────────────────────────────────────────────────┘
```

### 4.2 Day/Night 切换机制

| 属性 | Day Mode (08:00-19:59) | Night Mode (20:00-07:59) |
|------|----------------------|------------------------|
| **背景色** | 暖白渐变 `#fbf8f4 → #f0ecf5` | 深空渐变 `#03050c → #0e1328` |
| **卡片底色** | 白色半透明 0.7 | 白色超半透明 0.06 |
| **文字主色** | `#1f2937` (dark) | `#e2e8f0` (light) |
| **月亮色温** | 暖金 `#fbbf24` | 冷银 `#cbd5e1` |
| **氛围光** | 温暖治愈（桃/金） | 安静陪伴（蓝/紫） |
| **粒子颜色** | 金色/暖白 | 银蓝/淡紫 |

### 4.3 与现有系统的集成

```typescript
// theme.css 新增
:root[data-theme="day"] {
  --color-surface: rgba(255, 255, 255, 0.7);
  --color-text-primary: #1f2937;
  --moon-color: #fbbf24;
}
:root[data-theme="night"] {
  --color-surface: rgba(255, 255, 255, 0.06);
  --color-text-primary: #e2e8f0;
  --moon-color: #cbd5e1;
}

// 渐变过渡
:root {
  transition: --color-surface 0.8s ease,
              --color-text-primary 0.8s ease,
              --moon-color 1.2s ease;
}
```

### 4.4 night.css 迁移路径

| 阶段 | 操作 | 时间 |
|------|------|------|
| Phase 1 | 保留 night.css，Token 系统并行运行 | Sprint 1 |
| Phase 2 | 逐步替换 night.css 引用为 Token | Sprint 2-3 |
| Phase 3 | 废弃 night.css，完全由 Token 接管 | Sprint 4 |

---

## §5 功能需求详述

### 5.1 AppShell / 布局重构

| 需求 | 描述 | 优先级 |
|------|------|--------|
| 左侧栏 → 情绪入口 | 保留导航功能，增加情绪状态指示器 | P0 |
| 中央 → 情绪主视觉 | 70% 宽度，场景卡作为页面背景 | P0 |
| 右侧 → 陪伴状态区 | 删除推荐咨询师/紧急求助，改 AI 陪伴状态 | P0 |
| Header 精简 | 保留搜索，删除通知铃铛 | P1 |

### 5.2 首页重构（沉浸式情绪场景卡）

**6 种场景卡：**

| 场景 | 视觉元素 | 动画 | 情绪映射 |
|------|---------|------|---------|
| 🌙 **MoonScene** | 弯月+月晕+星光 | 呼吸光晕、星星闪烁 | 平静/中性 |
| ✨ **StarFieldScene** | 星点粒子+银河带 | 粒子漂浮、流星划过 | 快乐 |
| 🌊 **LakeScene** | 月光湖面+倒影+涟漪 | 水面波动、光点跳跃 | 平静 |
| 🫧 **GlowingBottleScene** | 发光玻璃瓶+漂浮气泡 | 气泡上升、瓶内微光 | 悲伤/治愈 |
| 💛 **FloatingHeartsScene** | 漂浮爱心+暖光粒子 | 心跳脉动、爱心漂浮 | 快乐/爱 |
| 🌿 **NightPlantsScene** | 夜晚植物+萤火虫 | 叶子微动、萤火闪烁 | 中立/思考 |

### 5.3 ECHO 答案之书重构

| 需求 | 描述 |
|------|------|
| 超大玻璃拟态输入框 | `backdrop-filter: blur(40px)` + 微光边框 + 呼吸光晕 |
| "意识浮现"动画 | 答案从模糊→清晰，仿佛从宇宙深处浮出 |
| 宇宙回应感 | 粒子汇聚成文字，星光消散效果 |
| 模式选择保留 | 温柔/清醒/哲学/深夜/希望，视觉增强 |

### 5.4 AI 聊天页重构

| 需求 | 描述 |
|------|------|
| 深夜陪伴空间 | 更暗的背景 + 更强的氛围光 + 更柔和的粒子 |
| AI 头像呼吸动画 | 双重呼吸光圈 + 心跳微光 |
| Glassmorphism 气泡 | 加深模糊 + 增加内发光 + 情绪色彩倾向 |
| 空状态引导 | 有氛围的引导文案，非空白的"开始倾诉" |

### 5.5 情绪日记重构

| 需求 | 描述 |
|------|------|
| 漂浮情绪球 | 10 个情绪球悬浮在页面中，hover 放大+发光 |
| 纸条风格输入 | 模拟纸条/便签质感，微黄底色+横线纹理 |
| 情绪趋势可视化 | 以星光轨迹代替柱状图 |

---

## §6 沉浸式场景卡系统

### 6.1 SceneCardRenderer 引擎架构

```
SceneCardRenderer
├── SceneLayer (背景层 — Canvas 2D)
│   ├── ParticleSystem (粒子系统，复用 ParticleField 核心)
│   ├── AmbientLight (氛围光，复用 AmbientLighting)
│   └── SceneElement (场景元素：月/星/湖/瓶/心/植物)
├── OverlayLayer (叠加层 — CSS/HTML)
│   ├── GlassOverlay (玻璃拟态遮罩)
│   ├── BreathingLight (呼吸光动画)
│   └── MoodIndicator (情绪指示器)
└── InteractionLayer (交互层)
    ├── MouseParallax (鼠标视差)
    ├── ClickRipple (点击涟漪)
    └── HoverGlow (悬停流光)
```

### 6.2 情绪→场景映射

| 情绪 | 场景 | 色温 | 粒子颜色 | 动画速度 |
|------|------|------|---------|---------|
| 快乐 (8-10) | FloatingHearts + StarField | 暖金 | #facc15,#fbbf24 | 快 (1x) |
| 平静 (5-7) | Moon + Lake | 暖白 | #e6c180,#cbd5e1 | 中 (0.7x) |
| 悲伤 (1-4) | GlowingBottle + NightPlants | 冷紫 | #a78bfa,#8b5cf6 | 慢 (0.5x) |
| 中立 (无数据) | Moon + StarField | 银白 | #94a3b8,#cbd5e1 | 中 (0.8x) |

### 6.3 FPS 预算分配

| 组件 | 预算 FPS | 优先级 |
|------|---------|--------|
| 主粒子系统 | 30fps | 高 |
| 场景元素动画 | 24fps | 高 |
| 呼吸光/流光 | 15fps | 中 |
| 鼠标视差 | 按需 | 低 |
| 点击涟漪 | 瞬时 | 低 |

---

## §7 基础设施集成方案

### 7.1 数据流架构

```
User Emotion Input
      ↓
useMoodStore (Zustand)
      ↓
useMoodTheme Hook
  ├── MoodTheme → CSS Class (.mood-happy)
  ├── DayNight → data-theme attribute
  └── SceneMap → 场景选择
        ↓
SceneCardRenderer
  ├── ParticleField (颜色/速度由 mood+theme 控制)
  ├── AmbientLighting (色温由 day/night 控制)
  ├── Glass Layer (透明度由 mood 控制)
  └── Animation Speed (由 mood intensity 控制)
```

### 7.2 与并行 Sprint 的边界

本 PRD 规划的 Sprint 与现有 `frontend-fix-001`（前端阻断 Bug 修复）关系：
- **建议：** `frontend-fix-001` 作为 **Sprint 0** 优先执行
- 修复完成后启动本 PRD 的 Sprint 1

---

## §8 非功能需求

### 8.1 性能指标

| 指标 | 目标 | 测量方式 |
|------|------|---------|
| FPS | ≥ 30fps (场景卡) | Chrome DevTools Performance |
| 首屏渲染 | ≤ 2s | Lighthouse |
| 主题切换 | ≤ 50ms | Performance API |
| Bundle 增量 | ≤ 50KB (场景卡) | webpack-bundle-analyzer |

### 8.2 无障碍要求

- 所有动画尊重 `prefers-reduced-motion`
- 粒子系统支持 `prefers-reduced-motion` 时完全静默
- 色彩对比度 ≥ 4.5:1（WCAG AA）
- 所有交互元素支持键盘导航

### 8.3 浏览器降级方案

| 特性 | 降级策略 |
|------|---------|
| `backdrop-filter` | 不支持的浏览器回退到 `rgba` 纯色背景 |
| CSS `@property` | 不支持时回退到 class 切换（无渐变过渡） |
| Canvas 2D | 回退到 CSS-only 粒子效果 |
| FPS < 20 | 自动降低粒子数量 (50% → 25% → 停用) |

---

## §9 Sprint 划分

### Sprint 1: 基础设施（第1-10天）
| ID | Story | 点数 | 依赖 |
|----|-------|------|------|
| S1-01 | Day/Night Token 三层架构设计实现 | 5 | 无 |
| S1-02 | Day/Night 自动切换引擎 + localStorage 覆盖 | 3 | S1-01 |
| S1-03 | theme.css → Token 系统迁移 | 5 | S1-01 |
| S1-04 | glass-card 统一组件（参考现有 glass 体系） | 2 | 无 |
| S1-05 | useMoodTheme 扩展（Day/Night + Token 注入） | 3 | S1-01, S1-02 |
| S1-06 | Mood Color Map 定义（场景卡颜色映射表） | 2 | S1-01 |
| S1-07 | AppShell 场景容器层 (SceneProvider) | 3 | S1-05 |
| S1-08 | TailwindCSS Token 扩展 + 语义化 class | 3 | S1-01 |
| | **小计** | **26 SP** | |

### Sprint 2: 动态页面与氛围（第11-20天）
| ID | Story | 点数 | 依赖 |
|----|-------|------|------|
| S2-01 | ParticleField 情绪色彩联动 | 3 | S1-05 |
| S2-02 | AmbientLighting 日夜色温联动 | 2 | S1-02 |
| S2-03 | Framer Motion 过渡动画系统（渐变切换） | 3 | S1-02 |
| S2-04 | HomePage 情绪入口改造 | 2 | S1-07 |
| S2-05 | Sidebar 导航月光flow/hover效果 | 3 | S1-01 |
| S2-06 | RightPanel 重构（删推荐→陪伴状态） | 3 | 无 |
| S2-07 | ChatPage 基础深夜氛围适配 | 3 | S1-02, S2-02 |
| S2-08 | ECHO 页面增强（玻璃输入+浮现动画） | 3 | S1-01 |
| | **小计** | **22 SP** | |

### Sprint 3: 沉浸场景卡系统（第21-30天）
| ID | Story | 点数 | 依赖 |
|----|-------|------|------|
| S3-01 | SceneCardRenderer 引擎 | 5 | S2-01, S2-02 |
| S3-02 | MoonScene (月亮场景卡) | 3 | S3-01 |
| S3-03 | StarFieldScene (星空场景卡) | 3 | S3-01 |
| S3-04 | LakeScene (湖面场景卡) | 3 | S3-01 |
| S3-05 | GlowingBottleScene (发光瓶场景卡) | 3 | S3-01 |
| S3-06 | FloatingHeartsScene (爱心场景卡) | 2 | S3-01 |
| S3-07 | NightPlantsScene (夜晚植物场景卡) | 2 | S3-01 |
| S3-08 | 场景卡与情绪数据联动 | 2 | S2-01, S3-01 |
| | **小计** | **23 SP** | |

### Sprint 4: 集成收尾（第31-40天）
| ID | Story | 点数 | 依赖 |
|----|-------|------|------|
| S4-01 | ChatPage 深度沉浸集成 | 3 | S2-07, S3-01 |
| S4-02 | ECHO + 日记场景集成（情绪球/纸条） | 3 | S2-08, S3-01 |
| S4-03 | MoodPage 情绪球 + 纸条输入改造 | 3 | S2-01, S3-01 |
| S4-04 | 空状态设计（所有页面） | 2 | 无 |
| S4-05 | 情绪反馈系统全页面对接 | 3 | S1-05, S2-01 |
| S4-06 | 响应式适配 + 移动端 | 3 | 全部 |
| S4-07 | 性能优化（FPS/首屏/降级） | 3 | 全部 |
| S4-08 | 无障碍审计 + 修复 | 2 | 全部 |
| S4-09 | night.css 废弃清理 | 1 | S1-01 |
| S4-10 | 端到端集成测试 | 3 | 全部 |
| | **小计** | **26 SP** | |

### 总计
| Sprint | Stories | Story Points | 人日估算 |
|--------|---------|-------------|---------|
| Sprint 1 | 8 | 26 | ~10 |
| Sprint 2 | 8 | 22 | ~10 |
| Sprint 3 | 8 | 23 | ~10 |
| Sprint 4 | 10 | 26 | ~10 |
| **总计** | **34** | **97** | **~40** |

---

## §10 开放决策项（D1-D6）

| ID | 问题 | 选项 | 建议 | 决策 |
|----|------|------|------|------|
| **D1** | 场景卡渲染技术 | A) Canvas 2D / B) WebGL / C) CSS-only | **A** — 与现有 ParticleField 一致 | **待定** |
| **D2** | Day/Night 切换时间 | A) 固定 06:00/18:00 / B) 日出日落 API / C) 用户自定 | **A** + localStorage 覆盖 | **待定** |
| **D3** | 场景卡数据上报 | A) 匿名上报 / B) 不上报 / C) 全量上报 | **A** — 仅交互事件 | **待定** |
| **D4** | 情绪映射表来源 | A) 前端硬编码 / B) 后端接口 / C) 配置文件 | **A** — 变化频率极低 | **待定** |
| **D5** | MVP 场景卡数量 | A) 全部 6 种 / B) 4 种 / C) 2 种 | **A** — 引擎复用度高 | **待定** |
| **D6** | iOS backdrop-filter | A) 始终启用 / B) 检测后启用 / C) 禁用 | **A** + FPS < 20 降级 | **待定** |

---

## 附录

### A. 参考资料
- 现有代码库：`frontend/src/` (主题/组件/页面)
- 现有主题：`frontend/src/styles/theme.css`
- 现有粒子：`frontend/src/components/atmosphere/ParticleField.tsx`
- 现有氛围光：`frontend/src/components/layout/AmbientLighting.tsx`
- 现有情绪主题：`frontend/src/hooks/useMoodTheme.ts`

### B. 设计参考
- **Calm App** — 场景化呼吸空间
- **Headspace** — 温暖友好的视觉语言
- **梦境情绪空间** — 漂浮/模糊/半透明的数字质感

### C. 词汇表
| 术语 | 说明 |
|------|------|
| Token | CSS 自定义属性的设计系统值 |
| Day/Night | 基于时间段的双模式主题 |
| 场景卡 | 沉浸式背景情绪场景 |
| Glassmorphism | 玻璃拟态设计风格 |
| 呼吸动画 | 缓慢的 scale/opacity 循环动画 |
