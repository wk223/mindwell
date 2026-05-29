# Emotion Planet — 3D 场景系统架构文档

> **项目:** MindWell (观心 / ECHO)
> **阶段:** BMAD Phase 3 — 架构设计
> **日期:** 2025-07-17
> **架构师:** System Architect
> **前置文档:** [bmad-prd.md](./bmad-prd.md), 现有前端代码库

---

## 目录

1. [架构概览](#1-架构概览)
2. [场景树层级](#2-场景树层级)
3. [组件树映射](#3-组件树映射)
4. [6 种星球 Shader 策略](#4-6-种星球-shader-策略)
5. [性能预算](#5-性能预算)
6. [镜头系统](#6-镜头系统)
7. [数据流](#7-数据流)
8. [与现有系统集成](#8-与现有系统集成)
9. [部署与构建配置](#9-部署与构建配置)
10. [开放决策项](#10-开放决策项)

---

## 1. 架构概览

### 1.1 架构模式选择

| 决策 | 选择 | 理由 |
|------|------|------|
| **渲染引擎** | @react-three/fiber (R3F) + Three.js | FR: 3D 星球 / Shader / 粒子喷射 / InstancedMesh — Canvas 2D 无法满足 |
| **物理/后处理** | @react-three/drei (OrbitControls) + @react-three/postprocessing (Bloom) | 避免手写 WebGL 复杂管线 |
| **状态管理** | Zustand universeStore (新建) | 与现有 useMoodStore/useThemeStore 同架构，数据流一致 |
| **构建打包** | Vite code-splitting + dynamic import | R3F bundle 较大 (~180KB gzip)，需懒加载避免阻塞首屏 |
| **路由集成** | `/universe` 新路由 + `AppShell` 包裹 | 复用现有布局结构，与导航体系一致 |

### 1.2 架构总览图

```
┌──────────────────────────────────────────────────────────────────────┐
│                        AppShell (现有)                               │
│  ┌──────────┐  ┌────────────────────┐  ┌──────────┐                │
│  │ Sidebar  │  │     <Outlet />     │  │RightPanel│                │
│  │ (导航)    │  │  ┌──────────────┐  │  │ (陪伴)   │                │
│  └──────────┘  │  │ UniversePage  │  │  └──────────┘                │
│                │  │ (路由: /universe)│  │                            │
│                │  └──────┬───────┘  │                               │
│                └─────────┼──────────┘                               │
│                          │                                           │
│               ┌──────────▼──────────┐                               │
│               │   SceneCanvas (R3F) │                               │
│               │  ┌────────────────┐  │                               │
│               │  │  <Canvas>      │  │                               │
│               │  │  ├ Starfield   │  │                               │
│               │  │  ├ AmbientLight│  │                               │
│               │  │  ├ PlanetGroup │  │                               │
│               │  │  ├ MeteorSystem│  │                               │
│               │  │  └ PostProcess │  │                               │
│               │  └────────────────┘  │                               │
│               └──────────────────────┘                               │
└──────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│                  Zustand Stores                       │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐ │
│  │ useMoodStore │  │ useThemeStore│  │universeStore│ │
│  │ (现有)       │  │ (现有)       │  │ (新建)      │ │
│  └──────┬───────┘  └──────┬───────┘  └──────┬──────┘ │
│         └────────┬────────┘                  │        │
│                  ▼                            │        │
│         ┌────────────────┐                    │        │
│         │useMoodTheme    │                    │        │
│         │(现有, 扩展)    │                    │        │
│         └────────┬───────┘                    │        │
│                  │                            │        │
│                  ▼                            ▼        │
│         ┌────────────────────────────────────────┐    │
│         │      EmotionPlanet 数据聚合层            │    │
│         │  (moodData + dayNight + sceneConfig)    │    │
│         └────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────┘
```

### 1.3 架构驱动因素 (Architectural Drivers)

| # | 驱动因素 | 来源 | 架构影响 |
|---|---------|------|---------|
| AD1 | 6 种不同视觉风格的 3D 星球/天体 | FR (情绪星球) | 每种需要独立的 Shader/几何策略 |
| AD2 | 实时情绪数据驱动行星外观 | FR (数据联动) | Zustand store → uniform 绑定, 运行时 Shader 参数更新 |
| AD3 | 多星球共存于场景 (≥20 个) | FR (星空系统) | InstancedMesh + LOD 控制 draw call |
| AD4 | 流畅 30fps 在 mid-range 设备 | NFR (性能) | 分层 LOD、Bloom 分级、几何预算 |
| AD5 | 与现有 CSS 主题系统联动 | NFR (一致性) | useDayNight/useMoodTheme → material color 同步 |
| AD6 | 镜头自动巡航 + 交互切换 | FR (沉浸感) | OrbitControls + 空闲检测缓动算法 |

---

## 2. 场景树层级

### 2.1 Three.js 场景树全景

```
<Canvas>                                          // R3F Root
  |
  ├── <Stats />                                   // DEV only — FPS monitor
  |
  ├── <Scene>                                     // THREE.Scene
  │   │
  │   ├── <fogExp2 />                             // THREE.FogExp2 — 深空雾
  │   │   props: { color: 0x000814, density: 0.0025 }
  │   │   NFR: 场景景深感, 远处星星淡出
  │   │
  │   ├── Starfield                                // STARFIELD — 静态星空背景
  │   │   ├── <points>                            // THREE.Points
  │   │   │   geometry: BufferGeometry (20,000 vertices)
  │   │   │   material: PointsMaterial { size: 0.3, transparent, opacity: 0.8 }
  │   │   │   NFR: 背景层, 低开销, 无动画
  │   │   └── <sphereGeometry />                  // 远处大球环境星
  │   │       InstancedMesh(100, 面数=16)          // 极小几何
  │   │
  │   ├── AmbientLights                            // 环境光照层
  │   │   ├── <ambientLight />                    // THREE.AmbientLight
  │   │   │   intensity: 0.4
  │   │   │   color: 联动 useDayNight (日:暖白/夜:冷蓝)
  │   │   ├── <directionalLight />                // THREE.DirectionalLight
  │   │   │   position: [5, 10, 5]
  │   │   │   intensity: 0.8
  │   │   │   castShadow: false  (NFR: 性能 — 场景无阴影投射)
  │   │   └── <hemisphereLight />                 // THREE.HemisphereLight
  │   │       skyColor: 0x1a1a2e
  │   │       groundColor: 0x0a0a15
  │   │       intensity: 0.3
  │   │
  │   ├── PlanetGroup                              // 主行星群
  │   │   │  children: <StarSystem />              // 行星分布 (Fibonacci sphere)
  │   │   │
  │   │   ├── [0] IcosahedronGeometry(1, 0)       // LOD0 — 远距离 (64 vertex)
  │   │   │   └── <meshBasicMaterial />
  │   │   │
  │   │   ├── [1] CalmPlanet                       // 蓝色光球 + 轨道环
  │   │   │   ├── <mesh>                           // THREE.Mesh
  │   │   │   │   geometry: SphereGeometry(1, 16, 16)  // LOD1 近处
  │   │   │   │   material: <calmShaderMaterial />
  │   │   │   ├── <mesh>                           // 光晕 — 半透明外球
  │   │   │   │   geometry: SphereGeometry(1.2, 16, 16)
  │   │   │   │   material: MeshBasicMaterial { transparent, opacity: 0.12 }
  │   │   │   └── <TorusGeometry                   // 轨道环
  │   │   │       args: [1.8, 0.04, 8, 64] />
  │   │   │       material: MeshBasicMaterial { color: 0x60a5fa, transparent, opacity: 0.5 }
  │   │   │
  │   │   ├── [2] HappyPlanet                      // 金色粒子球
  │   │   │   ├── <mesh>                           // 核心球
  │   │   │   │   material: <happyShaderMaterial>
  │   │   │   └── <points>                         // 粒子喷射层
  │   │   │       geometry: BufferGeometry (N=200, 动态)
  │   │   │       material: PointsMaterial { color: 0xfbbf24 }
  │   │   │
  │   │   ├── [3] SadPlanet                        // 暗紫雾球
  │   │   │   ├── <mesh>
  │   │   │   │   material: <sadShaderMaterial>    // 自定义 fragment — 表面涟漪
  │   │   │   └── <mesh>                           // 雾状外罩
  │   │   │       geometry: SphereGeometry(1.3, 16, 16)
  │   │   │       material: MeshBasicMaterial { transparent, opacity: 0.08, color: 0x7c3aed }
  │   │   │
  │   │   ├── [4] ReleaseMoon                      // 白色月牙
  │   │   │   ├── ShapeGeometry (自定义新月形状)
  │   │   │   │   material: <releaseShaderMaterial>
  │   │   │   └── <mesh>                           // 晕轮
  │   │   │       geometry: RingGeometry(1.5, 1.8, 32)
  │   │   │       material: MeshBasicMaterial { transparent, opacity: 0.08 }
  │   │   │
  │   │   ├── ChatPlanet                           // 混合色球 (情绪均值)
  │   │   │   └── <mesh>
  │   │   │       material: <chatShaderMaterial>
  │   │   │       uniforms: { colorA, colorB, blend }
  │   │   │
  │   │   ├── [k] ... (其他行星, 最多 60 个)
  │   │   │
  │   │   └── 行星公转轨道 Ring(Instanced)         // InstancedMesh 轨道环
  │   │
  │   ├── MeteorSystem                             // 崩溃流星系统
  │   │   ├── <Meteor>                             // 单颗流星 (1 instance)
  │   │   │   ├── <points>                         // 红色拖尾
  │   │   │   │   geometry: BufferGeometry (N=50)
  │   │   │   │   material: PointsMaterial { color: 0xef4444, size: 0.15 }
  │   │   │   └── lifecycle: 生成→加速→衰减→回收 (6s)
  │   │   └── <MeteorSpawner>                      // 生成管理器
  │   │       spawnInterval: 8000~15000ms random
  │   │       maxConcurrent: 3
  │   │
  │   └── 装饰层
  │       ├── 远处星云 Sprite                        // THREE.Sprite — 轻量
  │       │   material: SpriteMaterial { map: nebulaTexture, transparent }
  │       └── 坐标轴光线 (开发调试)
  │
  └── <EffectComposer>                             // @react-three/postprocessing
      └── <Bloom />
          intensity: 0.3  (分级: 近星球 0.8, 中距 0.3, 远距 0)
          luminanceThreshold: 0.2
          luminanceSmoothing: 0.05
          mipmapBlur: true
          NFR: 性能 — Bloom 仅应用于发光的 mesh layer
```

### 2.2 层间依赖矩阵

| 父节点 | 子节点 | 依赖关系 |
|--------|--------|---------|
| Canvas | Scene | R3F 自动创建 |
| Scene | Starfield | 无依赖, 最先渲染 |
| Scene | AmbientLights | 无依赖 |
| Scene | PlanetGroup | 依赖 AmbientLights 照亮 |
| PlanetGroup | StarSystem | 依赖 universeStore.planets 数据 |
| StarSystem | CalmPlanet/HappyPlanet/... | 依赖 moodData 映射 |
| Scene | MeteorSystem | 独立, 每 8~15s 自动触发 |
| Scene | EffectComposer | 包裹整个 Scene |

### 2.3 LOD 树

```
LOD0 (距离 > 30 units) — 64 顶点 IcosahedronGeometry + 纯色 BasicMaterial
LOD1 (距离 15~30) — SphereGeometry(1, 12, 12) + ShaderMaterial (简化)
LOD2 (距离 < 15) — SphereGeometry(1, 32, 32) + 完整 ShaderMaterial
```

---

## 3. 组件树映射

### 3.1 @react-three/fiber → React 组件树

```
src/
├── pages/
│   └── UniversePage.tsx            ← 路由入口 /universe, 懒加载
│
├── components/
│   ├── universe/
│   │   ├── SceneCanvas.tsx          ← <Canvas> 包裹层
│   │   │   ├── SceneSetup.tsx       ← 相机/灯光/雾/自动巡航
│   │   │   ├── Starfield.tsx        ← 20K 点星空
│   │   │   ├── PlanetGroup.tsx      ← 行星群容器
│   │   │   │   └── Planet.tsx       ← 单颗行星 (根据 type 分发)
│   │   │   │       ├── CalmPlanet.tsx
│   │   │   │       ├── HappyPlanet.tsx
│   │   │   │       ├── SadPlanet.tsx
│   │   │   │       ├── ReleaseMoon.tsx
│   │   │   │       ├── CrisisMeteor.tsx
│   │   │   │       └── ChatPlanet.tsx
│   │   │   ├── MeteorSystem.tsx     ← 流星系统
│   │   │   │   └── Meteor.tsx       ← 单颗流星
│   │   │   ├── PostProcessing.tsx   ← Effects (Bloom)
│   │   │   └── shaders/             ← GLSL Shader 定义
│   │   │       ├── calm.vert.glsl
│   │   │       ├── calm.frag.glsl
│   │   │       ├── happy.vert.glsl
│   │   │       ├── happy.frag.glsl
│   │   │       ├── sad.vert.glsl
│   │   │       ├── sad.frag.glsl
│   │   │       ├── release.vert.glsl
│   │   │       ├── release.frag.glsl
│   │   │       ├── chat.vert.glsl
│   │   │       └── chat.frag.glsl
│   │   ├── StarSystem.tsx           ← Fibonacci sphere 分布算法
│   │   ├── CameraController.tsx     ← OrbitControls + 自动巡航
│   │   └── UniverseHUD.tsx          ← UI 叠加层 (非 3D)
│   │
│   ├── atmosphere/
│   │   └── ParticleField.tsx        ← 现有 2D Canvas (共存, 背景层)
│   │
│   └── layout/
│       └── AmbientLighting.tsx      ← 现有 CSS 光球 (共存, UI 背景)
│
├── stores/
│   └── useUniverseStore.ts          ← 新建 Zustand store
│
└── hooks/
    └── useUniverse.ts               ← 数据聚合 hook
```

### 3.2 Canvas 生命周期管理

```
UniversePage mount
  │
  ├── 1. Suspense fallback 显示       ← React.lazy + Suspense
  │     显示 CSS 占位符 (玻璃卡片 + 呼吸光)
  │
  ├── 2. SceneCanvas mount
  │     ├── <Canvas> 创建 WebGL context
  │     ├── SceneSetup 初始化相机/灯光
  │     ├── Starfield 生成 (一次)
  │     ├── PlanetGroup 请求数据 → 渲染
  │     └── PostProcessing attach
  │
  ├── 3. 数据就绪
  │     ├── universeStore.fetch() → API
  │     ├── setInterval 每 60s 轮询
  │     └── 情绪数据变化 → uniform 更新 (无 re-render)
  │
  ├── 4. 用户交互 (OrbitControls)
  │
  └── 5. UniversePage unmount
        ├── Canvas unmount → Three.js dispose()
        ├── OrbitControls dispose()
        ├── EffectComposer dispose()
        └── 清理 timer / 动画帧
```

### 3.3 AppShell/路由集成

```tsx
// router.tsx — 新增路由
<Route
  path="/universe"
  element={
    <PrivateRoute>
      <AppShell>
        <UniversePage />       {/* React.lazy(() => import(...)) */}
      </AppShell>
    </PrivateRoute>
  }
/>

// UniversePage.tsx — 入口 (懒加载)
const UniversePage = React.lazy(() => import('../pages/UniversePage'));

export default function UniversePageLazy() {
  return (
    <Suspense fallback={<UniverseFallback />}>
      <UniversePage />
    </Suspense>
  );
}

// UniversePage.tsx — 内部
export default function UniversePage() {
  return (
    <div className="universe-container">
      <SceneCanvas />
      {/* HUD overlay — HTML 层, z-index 高于 Canvas */}
      <UniverseHUD />
    </div>
  );
}
```

### 3.4 导航入口

```tsx
// Sidebar.tsx — 新增 nav item
const navItems = [
  { to: "/home", label: "首页", icon: HomeIcon },
  { to: "/chat", label: "倾诉", icon: ChatIcon },
  { to: "/universe", label: "情绪星图", icon: PlanetIcon },  // ← NEW
  { to: "/echo", label: "答案之书", icon: EchoIcon },
  { to: "/mood", label: "情绪日记", icon: MoodIcon },
  { to: "/assessment", label: "自我了解", icon: AssessmentIcon },
  { to: "/night", label: "深夜陪伴", icon: NightIcon },
];
```

> **PlanetIcon** — 新增 SVG 图标，星轨环绕的小行星，与现有 `NavIcons.tsx` 同风格。

---

## 4. 6 种星球 Shader 策略

### 4.1 CalmPlanet (平静 · 蓝色光球)

| 属性 | 值 |
|------|-----|
| **几何** | `SphereGeometry(1, 32, 32)` (LOD2) |
| **核心材质** | 自定义 ShaderMaterial |
| **Uniforms** | `uTime`, `uColor` (#60a5fa), `uGlowIntensity` |
| **Vertex Shader** | 标准 MVP + 顶点轻微正弦波动 (0.02 amplitude) |
| **Fragment Shader** | 多层 Perlin 噪点混合产生柔和云纹 → 球体表面缓慢流动的淡蓝光晕 |
| **额外 mesh** | `SphereGeometry(1.2, 16, 16)` — 半透明外发光罩 `{opacity: 0.12}` |
| **轨道环** | `TorusGeometry(1.8, 0.04, 8, 64)` + `MeshBasicMaterial` 半透明蓝 |
| **环动画** | 绕 Y 轴匀速旋转, `0.2 rad/s` |
| **情绪映射** | mood_score 5~7 |

### 4.2 HappyPlanet (幸福 · 金色粒子球)

| 属性 | 值 |
|------|-----|
| **几何** | `SphereGeometry(0.9, 24, 24)` (核心) |
| **核心材质** | 自定义 ShaderMaterial — 金黄色渐变 + 脉冲发光 |
| **粒子层** | `Points` with `BufferGeometry(N=240)` |
| **粒子 Shader** | `PointsMaterial` + `size` 随时间波动 (0.08~0.2) |
| **粒子发射** | 从球面法线方向射出, 速度 0.008 units/frame, 最大距离 1.5 units |
| **粒子回收** | 超出距离 → 重置到球面随机位置 |
| **粒子颜色** | `0xfbbf24` ~ `0xf59e0b` 渐变 (温度波动) |
| **BufferedGeometry** | `setDrawRange` + `attributes.position.needsUpdate = true` — 避免重建 |
| **情绪映射** | mood_score 8~10 |

### 4.3 SadPlanet (忧伤 · 暗紫雾球)

| 属性 | 值 |
|------|-----|
| **几何** | `SphereGeometry(1, 32, 32)` |
| **材质** | 自定义 ShaderMaterial, 包含自定义 fragment |
| **Uniforms** | `uTime`, `uColor` (#7c3aed), `uRippleSpeed`, `uDistortion` |
| **Fragment Shader 涟漪算法** | 基于 `sin(distance(uv, center) * frequency - uTime * uRippleSpeed)` 产生同心波纹 → 叠加噪声扰动 → 表面水波状流动 |
| **雾罩** | 外球 `SphereGeometry(1.4, 16, 16)` + `MeshBasicMaterial` { opacity: 0.06, 半透明暗紫 } |
| **动画** | 涟漪频率受 `mood_score` 反向影响 (越低波动越快) |
| **情绪映射** | mood_score 1~4 |

**SadPlanet Fragment Shader 伪代码:**
```glsl
uniform float uTime;
uniform vec3 uColor;
uniform float uRippleSpeed;
uniform float uDistortion;

void main() {
  vec2 uv = vUv;  // 球面 UV
  // 同心波纹
  float dist = distance(uv, vec2(0.5));
  float ripple = sin(dist * 20.0 - uTime * uRippleSpeed) * 0.5 + 0.5;
  // 噪声扰动
  float noise = snoise(vec3(uv * 3.0, uTime * 0.2));
  float pattern = ripple * 0.6 + noise * 0.4;
  // 颜色: 暗紫 → 深蓝渐变
  vec3 color = mix(vec3(0.31, 0.16, 0.56), vec3(0.12, 0.08, 0.24), pattern);
  // 发光边缘
  float fresnel = 1.0 - dot(normalize(vNormal), normalize(cameraPosition));
  color += fresnel * uColor * 0.3;
  gl_FragColor = vec4(color, 0.92);
}
```

### 4.4 ReleaseMoon (释怀 · 白色月牙)

| 属性 | 值 |
|------|-----|
| **几何** | 自定义 `ShapeGeometry` — 新月形状 |
| **Shape 构建** | `new THREE.Shape()` → 两个圆弧相减 (大圆 R=1, 小圆偏移 0.35) |
| **材质** | 自定义 ShaderMaterial |
| **Uniforms** | `uTime`, `uColor` (#f0f0f0), `uGlow` |
| **Fragment** | 白色渐变 + 边缘柔光 + 呼吸脉冲 (sin 缓动) |
| **晕轮** | `RingGeometry(1.3, 1.6, 32)` + 半透明白色 |
| **旋转** | 绕 Y 轴缓慢自转 `0.1 rad/s` |
| **情绪映射** | mood_score 5~7 (释怀/平静) + 特别: 释放时刻触发光晕脉冲 |

### 4.5 CrisisMeteor (崩溃 · 红色拖尾流星)

| 属性 | 值 |
|------|-----|
| **类型** | `THREE.Points` — 50 个粒子链 |
| **几何** | `BufferGeometry` 动态更新 position |
| **材质** | `PointsMaterial` { color: 0xef4444, size: 0.15, transparent, opacity 渐变 } |
| **生命周期** | 6s: 生成→加速→拖尾→衰减→回收 |
| **位置算法** | 头部: 随机球面起点→直线运动; 尾部: 延迟跟随 + 随机偏移 0.1 units |
| **衰减** | opacity 从 1.0 → 0.0 (最后 1.5s) |
| **触发条件** | 用户 mood_score 突变 (单日降幅 ≥ 4) 或 crisis 事件 |
| **最大并发** | 3 颗 (避免视觉混乱) |
| **生成间隔** | 8~15s random (空闲时) |
| **情绪映射** | 崩溃/危机事件 |

### 4.6 ChatPlanet (倾诉 · 混合色球体)

| 属性 | 值 |
|------|-----|
| **几何** | `SphereGeometry(1, 32, 32)` |
| **材质** | 自定义 ShaderMaterial — 双色混合 |
| **Uniforms** | `uColorA`, `uColorB`, `uBlend` (0~1) |
| **Fragment** | 基于球面 UV 和噪声平滑过渡 A→B |
| **混合策略** | 根据最近 7 天情绪均值 `avg_score` 决定色对: |
| | avg ≥ 8: 金+橙 (快乐) |
| | avg 5~7: 蓝+紫 (平静) |
| | avg < 5: 紫+灰 (低落) |
| **用途** | 代表用户自身的"情绪星球", 位于场景中心 |
| **动画** | 颜色过渡缓动 2s ease, 无突变 |

---

## 5. 性能预算

### 5.1 面数预算 (Vertex Budget)

| 组件 | 对象数 | 每对象面数 | 总面数 | 备注 |
|------|--------|-----------|--------|------|
| Starfield (背景星点) | 20,000 | N/A (Points) | 0 (Points) | GPU 实例化, 无几何 |
| 行星 (LOD2 近处) | ≤ 10 | 1,024 (32×32 sphere) | ~10,240 | 仅近处的 10 颗高模 |
| 行星 (LOD1 中距) | ≤ 20 | 576 (12×12 sphere) | ~11,520 | 中等距离 |
| 行星 (LOD0 远处) | ≤ 30 | 64 (Icosahedron L0) | ~1,920 | 64 vertices |
| 轨道环 (Instanced) | 1 (60 instances) | 64 seg torus × 8 radial | ~4,096 | InstancedMesh |
| 流星粒子 | 3 × 50 pts | 0 (Points) | 0 | GPU 点 |
| 星球光晕罩 | ≤ 10 | 256 (16×16 sphere) | ~2,560 | 半透明外罩 |
| 星云 Sprite | ≤ 5 | 0 (Sprite) | 0 | 始终面向相机 |
| **总计 (最坏情况)** | | | **~30,336** | |

> **预算红线:** 50,000 面 (含 LOD 切换后)。超出则降级 LOD 阈值或减少行星数量。

### 5.2 Draw Call 预算

| 组件 | Draw Calls | 优化手段 |
|------|-----------|---------|
| Starfield (Points) | 1 | 单次 draw call |
| 星球几何 (所有 LOD) | ≤ 60 | 每星球 1 mesh + 1 光环 = 2 draw calls |
| 轨道环 (Instanced) | 1 | InstancedMesh 合并 |
| 流星 Points | 3 | 最多 3 个 Points |
| 星云 Sprite | 5 | Sprite = 1 draw 每个 |
| EffectComposer (Bloom) | ~4 | 内部 passes |
| **总计** | **~74** | |

> **预算红线:** 120 draw calls (含 Bloom passes)。超出则关闭 Bloom 或合并几何。

### 5.3 Bloom 分级策略

| 层级 | 距离阈值 | Blom intensity | 应用对象 |
|------|---------|---------------|---------|
| **High** | < 10 units | 0.8 | CalmPlanet 光晕, HappyPlanet 粒子, 流星头部 |
| **Medium** | 10~25 units | 0.3 | 中距星球表面发光色 |
| **None** | > 25 units | 0 | 所有远处对象 (纯色 BasicMaterial) |
| **Off** | Bloom disabled | 0 | 降级模式 (FPS < 20) |

**实现方式:**
```tsx
// Bloom 通过 luminanceThreshold 做隐式分级
<Bloom
  intensity={0.4}
  luminanceThreshold={0.3}   // 仅亮度 > 0.3 的区域 bloom
  luminanceSmoothing={0.05}
  mipmapBlur={true}
/>
// 球体发光色: 高亮区域自然 bloom, 暗色区域不过曝
```

### 5.4 LOD 策略实现

```tsx
// Planet.tsx — LOD 逻辑
function Planet({ data, index }: { data: PlanetData; index: number }) {
  const ref = useRef<THREE.Group>(null);
  const camera = useThree((s) => s.camera);
  const [lodLevel, setLodLevel] = useState<0 | 1 | 2>(0);

  useFrame(() => {
    if (!ref.current) return;
    const dist = camera.position.distanceTo(ref.current.position);
    const level = dist > 30 ? 0 : dist > 15 ? 1 : 2;
    if (level !== lodLevel) setLodLevel(level);
  });

  return (
    <group ref={ref} position={data.position}>
      {lodLevel === 0 && <LOD0Planet />}     {/* IcosahedronGeometry(1,0) + Basic */}
      {lodLevel === 1 && <LOD1Planet />}     {/* SphereGeometry(1,12,12) + Shader */}
      {lodLevel === 2 && <LOD2Planet type={data.type} />}  {/* 完整 Shader */}
    </group>
  );
}
```

### 5.5 InstancedMesh 使用场景

| 场景 | 实例数 | 理由 |
|------|--------|------|
| 轨道环 (Torus) | 60 (行星数上限) | 所有环相同几何, 仅位置/旋转不同 |
| 远处背景星(球) | 100 | 极小几何, 仅做视觉填充 |
| ~~行星本体~~ | ❌ 否 | 每行星不同 shader/颜色, 不能合并 |

### 5.6 FPS 降级阶梯

| FPS 区间 | 动作 |
|----------|------|
| ≥ 30 | 全功能 |
| 20~29 | 关闭 Bloom (bloom=false), 粒子减半, LOD 阈值提前 20% |
| 10~19 | 关闭所有后处理, 粒子降到 25%, 最大行星数 20 |
| < 10 | 回退到 CSS-only 占位符, 显示"3D 场景暂时不可用" |

---

## 6. 镜头系统

### 6.1 OrbitControls 参数

```tsx
<OrbitControls
  // 基础
  enableDamping={true}
  dampingFactor={0.08}

  // 缩放限制
  minDistance={3}              // 不能穿透星球
  maxDistance={60}             // 不能拉到场景外
  zoomSpeed={0.8}

  // 旋转限制
  minPolarAngle={0.1}          // 不能看到北极上方
  maxPolarAngle={Math.PI / 2}  // 不能翻到地下
  rotateSpeed={0.5}

  // 自动旋转 (空闲时)
  autoRotate={idle}            // 由 idleTimer 控制
  autoRotateSpeed={0.3}

  // 目标 (场景中心)
  target={[0, 0, 0]}

  // 其他
  enablePan={false}            // 禁用平移 (保持焦点在场景中心)
/>
```

### 6.2 自动巡航算法

```
状态机:
  ┌─────────┐    空闲 10s     ┌──────────┐    点击/拖拽    ┌─────────┐
  │ 交互模式 ├──────────────→ │ 自动巡航 ├───────────────→ │ 交互模式 │
  └─────────┘                └──────────┘                └─────────┘
                                  │
                                  │ 120s 无交互
                                  ▼
                            ┌──────────┐
                            │ 休眠模式  │ → 镜头拉到全景 (distance=50)
                            └──────────┘
```

```tsx
// CameraController.tsx — 自动巡航
function CameraController() {
  const controlsRef = useRef<OrbitControls>(null);
  const [isIdle, setIsIdle] = useState(false);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout>>();

  const resetIdleTimer = useCallback(() => {
    clearTimeout(idleTimerRef.current);
    setIsIdle(false);
    idleTimerRef.current = setTimeout(() => setIsIdle(true), 10_000);
  }, []);

  useEffect(() => {
    // 每帧检测用户交互
    const onStart = () => resetIdleTimer();
    const controls = controlsRef.current;
    controls?.addEventListener('start', onStart);
    controls?.addEventListener('change', onStart);
    return () => {
      controls?.removeEventListener('start', onStart);
      clearTimeout(idleTimerRef.current);
    };
  }, [resetIdleTimer]);

  return (
    <OrbitControls
      ref={controlsRef}
      autoRotate={isIdle}
      autoRotateSpeed={0.3}
      enableDamping
      dampingFactor={0.08}
      minDistance={3}
      maxDistance={60}
      minPolarAngle={0.1}
      maxPolarAngle={Math.PI / 2}
      enablePan={false}
    />
  );
}
```

### 6.3 镜头初始位置

```tsx
// SceneSetup.tsx
<Camera3D
  makeDefault
  position={[0, 8, 20]}      // 俯视 30° 角, 前置
  fov={50}
  near={0.1}
  far={100}
/>
```

### 6.4 阻尼曲线

| 操作 | 阻尼因子 | 手感 |
|------|---------|------|
| 拖拽旋转 | 0.08 | 柔和跟随, 尾部轻微惯性 |
| 缩放 | 0.12 | 稍快, 响应缩放手势 |
| 自动巡航 | 0.05 | 极慢, 几乎无感的缓动 |

---

## 7. 数据流

### 7.1 端到端数据流

```
┌──────────────┐    ┌─────────────┐    ┌──────────────┐    ┌──────────────┐
│  用户每日    │    │ 后端 Mood   │    │  Frontend    │    │ 3D Scene     │
│  情绪记录    │───→│  API        │───→│  Zustand     │───→│  R3F Canvas  │
│  (checkin)   │    │             │    │  Store       │    │              │
└──────────────┘    └─────────────┘    └──────┬───────┘    └──────┬───────┘
                                              │                   │
                                              ▼                   ▼
                                     ┌──────────────┐    ┌──────────────┐
                                     │ planetData:  │    │ uniform 更新 │
                                     │ Array<{      │    │ position     │
                                     │   type,      │    │ rotation     │
                                     │   moodAvg,   │    │ color        │
                                     │   position,  │    │ opacity      │
                                     │   scale,     │    │ scale        │
                                     │ }>           │    └──────────────┘
                                     └──────────────┘
```

### 7.2 universeStore 设计

```ts
// stores/useUniverseStore.ts
import { create } from 'zustand';
import { apiRequest } from '../api/client';

export type PlanetType = 'calm' | 'happy' | 'sad' | 'release' | 'crisis' | 'chat';

export interface PlanetData {
  id: string;
  type: PlanetType;
  moodAvg: number;         // 近 7 天情绪均值
  moodScore?: number;      // 当天得分
  tags?: string[];         // 情绪标签
  position: [number, number, number];  // Fibonacci sphere 分配
  scale: number;           // 0.6 ~ 1.4 (由 mood 强度决定)
  rotationSpeed: number;   // rad/s
  // 3D 内部状态 (非序列化)
  color?: string;
  glowIntensity?: number;
}

interface UniverseState {
  planets: PlanetData[];
  chatPlanet: PlanetData | null;   // 用户自身星球 (中心)
  meteors: { active: boolean; intensity: number };
  isLoading: boolean;
  error: string | null;

  // 动作
  fetchPlanets: () => Promise<void>;
  updateMoodData: () => Promise<void>;  // 轮询更新
}

export const useUniverseStore = create<UniverseState>((set, get) => ({
  planets: [],
  chatPlanet: null,
  meteors: { active: false, intensity: 0 },
  isLoading: false,
  error: null,

  fetchPlanets: async () => {
    set({ isLoading: true });
    try {
      // GET /api/v1/mood/stats + /api/v1/mood/trends?range=weekly
      const [statsRes, trendsRes] = await Promise.all([
        apiRequest('/mood/stats'),
        apiRequest('/mood/trends?range=weekly'),
      ]);

      const entries = trendsRes.entries as Array<{ score: number; date: string; label: string | null }>;
      const avgScore = statsRes.average_score as number;

      // 从历史条目标记生成行星
      const planets: PlanetData[] = entries.map((entry, i) => ({
        id: `planet-${i}`,
        type: scoreToPlanetType(entry.score),
        moodAvg: entry.score,
        position: fibonacciSphere(i, entries.length),  // 见 §7.3
        scale: 0.6 + (entry.score / 10) * 0.8,         // 0.6 ~ 1.4
        rotationSpeed: 0.1 + Math.random() * 0.3,
      }));

      // 用户自身情绪星球 (中心)
      const chatPlanet: PlanetData = {
        id: 'chat-planet',
        type: 'chat',
        moodAvg: avgScore,
        position: [0, 0, 0],
        scale: 1.2,
        rotationSpeed: 0.15,
      };

      // 危机检测: 单日降幅 ≥ 4 或最低分 ≤ 2
      const hasCrisis = entries.some((e, i) => {
        if (i === 0) return false;
        return (entries[i-1].score - e.score) >= 4 || e.score <= 2;
      });

      set({
        planets,
        chatPlanet,
        meteors: { active: hasCrisis, intensity: hasCrisis ? 0.8 : 0 },
        isLoading: false,
      });
    } catch (err) {
      set({ error: String(err), isLoading: false });
    }
  },

  updateMoodData: async () => {
    // 每 60s 轮询, 仅更新 moodAvg 和 crisis 状态
    const state = get();
    // ...轻量更新逻辑
  },
}));

function scoreToPlanetType(score: number): PlanetType {
  if (score >= 8) return 'happy';
  if (score >= 5) return 'calm';
  if (score >= 3) return 'sad';
  return 'crisis';
}
```

### 7.3 Fibonacci Sphere 分布算法

```ts
// StarSystem.tsx — 行星位置分配
function fibonacciSphere(index: number, total: number, radius: number = 8): [number, number, number] {
  const goldenRatio = (1 + Math.sqrt(5)) / 2;
  const theta = Math.acos(1 - 2 * (index + 0.5) / total);
  const phi = 2 * Math.PI * index / goldenRatio;

  return [
    radius * Math.sin(theta) * Math.cos(phi),
    radius * Math.sin(theta) * Math.sin(phi),
    radius * Math.cos(theta),
  ];
}

// 使用:
// total = 行星数 (最多 60)
// radius = 8 (场景半径)
// 结果: 均匀分布在球面上, 无重叠
```

### 7.4 数据聚合 Hook

```ts
// hooks/useUniverse.ts
export function useUniverse() {
  const fetchPlanets = useUniverseStore((s) => s.fetchPlanets);
  const planets = useUniverseStore((s) => s.planets);
  const isLoading = useUniverseStore((s) => s.isLoading);
  const { mode } = useDayNight();        // 日夜模式
  const { theme } = useMoodTheme();       // 情绪主题

  useEffect(() => {
    fetchPlanets();

    // 每 60s 自动轮询
    const interval = setInterval(() => {
      useUniverseStore.getState().updateMoodData();
    }, 60_000);

    return () => clearInterval(interval);
  }, [fetchPlanets]);

  // 日夜 → 环境光颜色联动
  const ambientColor = mode === 'night' ? '#1e3a5f' : '#f5e6d3';

  return {
    planets,
    isLoading,
    ambientColor,
    moodTheme: theme,
  };
}
```

---

## 8. 与现有系统集成

### 8.1 ParticleField 共存策略

| 场景 | ParticleField (2D) | 3D Starfield (R3F) | 说明 |
|------|-------------------|---------------------|------|
| /universe 页面 | ❌ 隐藏 | ✅ 显示 | Canvas 全屏覆盖 |
| 其他页面 | ✅ 运行 | ❌ 卸载 | 保持现有行为 |
| 路由切换时 | ✅ 淡入恢复 | ❌ 卸载 dispose | Universe 离开时清理 |

```tsx
// 在 AppShell 级别控制
// routes.tsx 中 /universe 路由渲染时, ParticleField 自动被替换
// 因为 <AppShell> 内同时存在:
//   <ParticleField />  ← 所有页面
//   <Outlet />          ← 当前页面
// UniversePage 启动后, ParticleField 被 CSS 遮盖 (z-index)
```

### 8.2 useDayNight / useMoodTheme 联动

```
useDayNight() → mode: 'day' | 'night'
                     │
                     ├── AmbientLights.jsx: 环境光颜色
                     │   day  → 暖白 (0xffeedd)
                     │   night → 冷蓝 (0x1a3a6a)
                     │
                     ├── Starfield 背景色
                     │   day  → 淡蓝黑 (0x0a0a2a)
                     │   night → 深空黑 (0x000005)
                     │
                     └── 场景 fog 颜色
                         day  → 暖灰 (0x1a1a2e)
                         night → 纯黑 (0x000008)

useMoodTheme() → theme: 'happy' | 'calm' | 'sad' | 'neutral'
                     │
                     ├── ChatPlanet uniform color
                     │   happy → 金+橙
                     │   calm  → 蓝+紫
                     │   sad   → 紫+灰
                     │
                     ├── 粒子系统颜色倾向
                     │   happy → 暖色调粒子增多
                     │   sad   → 冷色调粒子减少
                     │
                     └── 镜头自动巡航速度
                         happy → 0.5 rad/s (活跃)
                         calm  → 0.3 rad/s (平常)
                         sad   → 0.15 rad/s (舒缓)
```

### 8.3 路由集成总结

| 新增/修改 | 文件 | 内容 |
|-----------|------|------|
| **新增** | `pages/UniversePage.tsx` | 页面入口, React.lazy |
| **新增** | `components/universe/SceneCanvas.tsx` | R3F Canvas root |
| **新增** | `components/universe/Planet.tsx` | 单行星渲染 (含 LOD) |
| **新增** | `components/universe/…` | 所有 3D 子组件 |
| **新增** | `stores/useUniverseStore.ts` | 行星数据状态 |
| **新增** | `hooks/useUniverse.ts` | 数据聚合 hook |
| **新增** | `components/universe/shaders/*.glsl` | 6 种 Shader |
| **修改** | `router.tsx` | 添加 `/universe` 路由 |
| **修改** | `components/layout/Sidebar.tsx` | 添加导航项 "情绪星图" |
| **修改** | `components/shared/NavIcons.tsx` | 添加 PlanetIcon |
| **安装** | `package.json` | 新增依赖: `three`, `@react-three/fiber`, `@react-three/drei`, `@react-three/postprocessing` |

### 8.4 新增依赖

```json
{
  "dependencies": {
    "three": "^0.170.0",
    "@react-three/fiber": "^8.17.0",
    "@react-three/drei": "^9.114.0",
    "@react-three/postprocessing": "^2.16.0"
  },
  "devDependencies": {
    "@types/three": "^0.170.0"
  }
}
```

**估算 Bundle 增量:**
| 包 | 压缩后大小 |
|----|-----------|
| three | ~140 KB (gzip) |
| @react-three/fiber | ~15 KB |
| @react-three/drei | ~25 KB (含 OrbitControls) |
| @react-three/postprocessing | ~8 KB |
| Shader/组件代码 | ~5 KB |
| **总计** | **~193 KB** (gzip) |

> 通过 `React.lazy()` 按需加载, 不会影响首屏 (首页/登录页) 加载时间。

---

## 9. 部署与构建配置

### 9.1 Vite 配置调整

```ts
// vite.config.ts — 增加对 Three.js 的优化
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three', '@react-three/fiber', '@react-three/drei', '@react-three/postprocessing'],
        },
      },
    },
    // Three.js 不需要分块压缩
    chunkSizeWarningLimit: 300,
  },
});
```

### 9.2 构建产出

```
dist/
├── assets/
│   ├── index-xxx.js          ← 主应用 (≤ 50KB)
│   ├── three-xxx.js          ← Three.js 包 (~193KB gzip)
│   └── universe-xxx.js       ← 场景组件 (可选的 code-splitting)
└── index.html
```

### 9.3 浏览器兼容性

| 特性 | 检测 | 降级 |
|------|------|------|
| WebGL 2.0 | `GLctx.getParameter(GLctx.VERSION)` | 显示 CSS 静态占位 |
| `EXT_disjoint_timer_query` | 可选 | 无降级 |
| `prefers-reduced-motion` | `matchMedia` | 关闭所有动画, 静态场景 |

---

## 10. 开放决策项

| ID | 问题 | 选项 | 建议 | 状态 |
|----|------|------|------|------|
| **D7** | Shader 语言选择 | A) GLSL / B) WGSL (WebGPU) | **A** — WebGL 兼容性更高 | **待定** |
| **D8** | 星球数量上限 | A) 20 / B) 40 / C) 60 | **C** — Fibonacci sphere 可均匀分布 60 点 | **待定** |
| **D9** | 数据刷新策略 | A) 页面加载时拉取 / B) WebSocket 实时 / C) 定时轮询 60s | **A+C** — 进入页面拉取 + 60s 轮询 | **待定** |
| **D10** | Meteor 触发条件 | A) 仅 mood_score 突降 / B) 用户主动触发 / C) 后台危机检测 | **A** — 自动检测 | **待定** |
| **D11** | 移动端处理 | A) 降级为静态 2D 场景 / B) 简化 3D / C) 隐藏入口 | **B** — 减少粒子 50%, 关闭 Bloom, LOD 阈值提前 | **待定** |

---

## 附录 A: FR → 设计元素映射

| FR | 描述 | 设计元素 |
|----|------|---------|
| FR-1 | 平静星球 (CalmPlanet) | §4.1 — SphereGeometry + Perlin 噪点 + 轨道环 |
| FR-2 | 幸福星球 (HappyPlanet) | §4.2 — 核心球 + 粒子喷射 Points |
| FR-3 | 忧伤星球 (SadPlanet) | §4.3 — 自定义 fragment 涟漪 shader |
| FR-4 | 释怀月牙 (ReleaseMoon) | §4.4 — ShapeGeometry 新月 + RingGeometry 晕轮 |
| FR-5 | 崩溃流星 (CrisisMeteor) | §4.5 — Points 动态拖尾 + 生命周期 |
| FR-6 | 倾诉星球 (ChatPlanet) | §4.6 — 双色混合 Shader, 场景中心 |
| FR-7 | 星空背景 | §2.1 Starfield — 20K Points + Sprite 星云 |
| FR-8 | 用户交互 (旋转/缩放) | §6 OrbitControls |
| FR-9 | 自动巡航 | §6.2 idle timer + autoRotate |
| FR-10 | 情绪数据联动 | §7 universeStore → uniform 绑定 |
| FR-11 | 轨道环 | §4.1 TorusGeometry InstancedMesh |

## 附录 B: NFR → 设计元素映射

| NFR | 描述 | 设计元素 |
|-----|------|---------|
| NFR-1 | FPS ≥ 30 | §5 性能预算, LOD, InstancedMesh, Bloom 分级 |
| NFR-2 | 首屏 ≤ 2s | React.lazy() 分割 Three.js, 不影响非 /universe 页面 |
| NFR-3 | Bundle 增量 ≤ 200KB | §8.4 精确估算 193KB, manualChunks 分离 |
| NFR-4 | 主题切换 ≤ 50ms | uniform 直接更新 (无 re-render), CSS Variable 联动 |
| NFR-5 | 无障碍 (prefers-reduced-motion) | §9.3 matchMedia 检测 → 静态场景 |
| NFR-6 | 浏览器降级 | §5.6 FPS 降级阶梯 → 最终 CSS 占位符 |
| NFR-7 | 移动端支持 | §10 D11 — 简化方案 |

---

## 附录 C: 文件清单 (新建/修改)

```
NEW  frontend/src/pages/UniversePage.tsx
NEW  frontend/src/components/universe/SceneCanvas.tsx
NEW  frontend/src/components/universe/SceneSetup.tsx
NEW  frontend/src/components/universe/Starfield.tsx
NEW  frontend/src/components/universe/PlanetGroup.tsx
NEW  frontend/src/components/universe/Planet.tsx
NEW  frontend/src/components/universe/CalmPlanet.tsx
NEW  frontend/src/components/universe/HappyPlanet.tsx
NEW  frontend/src/components/universe/SadPlanet.tsx
NEW  frontend/src/components/universe/ReleaseMoon.tsx
NEW  frontend/src/components/universe/CrisisMeteor.tsx
NEW  frontend/src/components/universe/ChatPlanet.tsx
NEW  frontend/src/components/universe/MeteorSystem.tsx
NEW  frontend/src/components/universe/Meteor.tsx
NEW  frontend/src/components/universe/StarSystem.tsx
NEW  frontend/src/components/universe/CameraController.tsx
NEW  frontend/src/components/universe/PostProcessing.tsx
NEW  frontend/src/components/universe/UniverseHUD.tsx
NEW  frontend/src/components/universe/shaders/calm.vert.glsl
NEW  frontend/src/components/universe/shaders/calm.frag.glsl
NEW  frontend/src/components/universe/shaders/happy.vert.glsl
NEW  frontend/src/components/universe/shaders/happy.frag.glsl
NEW  frontend/src/components/universe/shaders/sad.vert.glsl
NEW  frontend/src/components/universe/shaders/sad.frag.glsl
NEW  frontend/src/components/universe/shaders/release.vert.glsl
NEW  frontend/src/components/universe/shaders/release.frag.glsl
NEW  frontend/src/components/universe/shaders/chat.vert.glsl
NEW  frontend/src/components/universe/shaders/chat.frag.glsl
NEW  frontend/src/stores/useUniverseStore.ts
NEW  frontend/src/hooks/useUniverse.ts
MOD  frontend/src/router.tsx                    ← +/universe route
MOD  frontend/src/components/layout/Sidebar.tsx  ← +nav item
MOD  frontend/src/components/shared/NavIcons.tsx  ← +PlanetIcon
MOD  frontend/package.json                       ← +three + r3f deps
MOD  frontend/vite.config.ts                     ← +manualChunks
```
