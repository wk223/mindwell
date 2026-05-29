# Sprint Tech Spec — 情绪星球功能补充 (Phase 2)

> **项目:** MindWell (观心 / ECHO)
> **阶段:** BMAD Phase 2 — Planning / Sprint Tech Spec
> **日期:** 2025-07-17
> **产品经理 (PM):** BMAD PM Agent
> **前置架构:** [architecture-emotion-planet-2025-07-17.md](../architecture-emotion-planet-2025-07-17.md)
> **状态:** 📋 Draft

---

## 1. Sprint 概览

| 项目 | 内容 |
|------|------|
| **Sprint 名称** | `emotion-planet-detail-interaction-001` |
| **Sprint 编号** | EP-SPRINT-001 |
| **目标陈述** | 实现点击星球→镜头缓动放大→展示内容详情卡片的完整交互闭环，让每颗情绪星球承载可阅读的情感记忆。 |
| **时间范围** | 5 个开发日 (建议) |
| **参与角色** | 前端 × 1 (React/R3F), 后端 × 1 (API 补充), QA × 1 (交互验收) |

### 依赖前置条件

| # | 前置条件 | 来源 |
|---|---------|------|
| 1 | `@react-three/fiber` + `@react-three/drei` + `three` 安装完成 | Sprint 0 (基础设施) |
| 2 | `useUniverseStore` / `PlanetGroup` / `Planet` 基础组件可用 | Sprint 0 (场景渲染) |
| 3 | `OrbitControls` 已集成到 `CameraController` | Sprint 0 (镜头系统) |
| 4 | 情绪数据 API (`/mood/stats`, `/mood/trends`) 可返回 `preview_text` | 本 Sprint 后端 Story |

---

## 2. 问题分类矩阵 — 新增需求映射

### 2.1 需求 → Issues 转化

| ID | 需求描述 | 类型 | 影响范围 | 涉及模块 (预测) | 修复策略 |
|----|---------|------|---------|---------------|---------|
| **I-001** | 🔴 星球不可点击 — 无 Raycaster 交互检测 | 🔴 Critical | 用户无法触发详情, 核心功能阻塞 | `Planet.tsx`, `SceneCanvas.tsx` | 添加 `onClick` Raycaster 检测, 拾取星球 Mesh |
| **I-002** | 🔴 缺少镜头缓动放大能力 — OrbitControls 直接操作无动画 | 🔴 Critical | 点击后无视觉反馈, 体验断层 | `CameraController.tsx`, `Planet.tsx` | 引入 `@react-three/drei` 的 `CameraControls` 或手写 tween |
| **I-003** | 🟡 `PlanetData` 缺少详情字段 — 无 `created_at` / `preview_text` / `source_type` | 🟡 Bug | 卡片无数据可展示 | `useUniverseStore.ts`, 后端 API | 扩展接口和类型定义 |
| **I-004** | 🟡 无 `PlanetDetailCard` 组件 — 浮动卡片不存在 | 🟡 Bug | 放大后无内容呈现 | 新建 `PlanetDetailCard.tsx` | 创建 DOM overlay 卡片, 跟随星球屏幕坐标 |
| **I-005** | 🟡 无二次点击/空白处缩小逻辑 | 🟡 Bug | 用户无法退出详情模式 | `Planet.tsx`, `CameraController.tsx` | 添加 `selectedPlanetId` 状态, 再次点击/点击空白缩小 |
| **I-006** | 🟢 卡片样式需与主题联动 — 毛玻璃+呼吸光 | 🟢 Enhancement | 视觉体验一致性 | `PlanetDetailCard.tsx`, CSS Tokens | 复用现有 `glass` / `glass-light` Token |

### 2.2 严重程度分布

```
🔴 Critical:  2 (I-001, I-002)
🟡 Bug:       3 (I-003, I-004, I-005)
🟢 Enhancement: 1 (I-006)
```

---

## 3. Story 拆分

### Story-1: 后端 — 补充 Planet 详情字段

```yaml
Story ID: EP-101
标题: 后端 — Planet API 增加 preview_text / source_type / created_at
描述: |
  当前 MoodEntry / Conversation 数据已有 created_at 和文本内容，
  但 PlanetData 接口缺少详情展示所需字段。
  需要在 `/mood/trends` 和 `/mood/stats` 响应中补充:
    - `preview_text`: 日记首句 / 对话首条 / "心情 n/10"
    - `source_type`: "journal" | "chat" | "mood"
    - `created_at`: ISO 时间戳
  后端从 MoodEntry.journal_text 取首句(截取前 40 字),
  从 Conversation.messages 取首条内容,
  纯 mood 记录则取 "心情评分: n/10" 作为预览。
验收标准:
  - [ ] GET /mood/trends 每条记录返回 preview_text (非空字符串)
  - [ ] GET /mood/trends 每条记录返回 source_type 枚举值
  - [ ] preview_text 不超过 50 字符
  - [ ] 纯 mood 记录预览格式为 "心情评分: {score}/10"
  - [ ] 后端单元测试覆盖三种 source_type
预估工作量: 2 Story Points
依赖关系: 无
优先级: 🔴 P0 — 阻塞前端开发
```

---

### Story-2: 数据层 — PlanetData 类型扩展 + Store 更新

```yaml
Story ID: EP-102
标题: 前端 — 扩展 PlanetData 类型与 useUniverseStore
描述: |
  在 `types/planet.ts` (新建) 或现有 mood types 中扩展 PlanetData:
    - 新增 `created_at: string`
    - 新增 `preview_text: string`
    - 新增 `source_type: 'journal' | 'chat' | 'mood'`
  更新 useUniverseStore:
    - 在 fetchPlanets 中解析新字段
    - 新增 `selectedPlanetId: string | null` 状态
    - 新增 `selectPlanet(id: string | null)` action
    - 新增 `resetSelection()` action (清空选中)
验收标准:
  - [ ] PlanetData 接口包含三个新字段 (必选, 非可选)
  - [ ] useUniverseStore 初始化时 selectedPlanetId = null
  - [ ] selectPlanet(id) 设置选中状态, 传 null 清空
  - [ ] 现有测试通过, 无类型错误
预估工作量: 1 Story Point
依赖关系: 依赖 EP-101 (数据类型确定)
优先级: 🔴 P0
```

---

### Story-3: 交互核心 — 点击拾取 + 镜头缓动放大

```yaml
Story ID: EP-103
标题: 前端 — Planet Raycaster 点击拾取 + Camera tween 到目标位置
描述: |
  核心交互机制:
  1. Planet 组件注册 `onClick` 事件 (通过 R3F `mesh.onPointerDown`)
  2. 点击时通过 `useThree` 获取相机, 将 `camera.position` 缓动到星球位置
     - 放大倍率: 2.8x (星球距离缩小为原距离的 1/2.8)
     - 持续时间: 800ms easeInOutCubic
  3. 镜头锁定: 在动画期间禁用 OrbitControls (enabled = false)
  4. 动画完成后: 设置 selectedPlanetId, 允许小范围 Orbit 旋转 (限制 maxDistance)
  5. 使用 `lerp` 或 `gsap` 或 `@react-three/drei/CameraControls` 实现缓动
  6. 点击空白处 (非星球区域) → 调用缩小还原

  实现方案对比:
  | 方案 | 复杂度 | 推荐度 |
  |------|--------|--------|
  | drei `CameraControls` + `setLookAt` | 中 | ⭐ 推荐 |
  | 手写 lerp + OrbitControls.target | 低 | 备选 |
  | gsap 动画 three.js 属性 | 高 | 不推荐 (额外依赖) |

  推荐采用手写 lerp 方案 (减少依赖):
  ```tsx
  // 在 CameraController 或 Planet 的 useFrame 中:
  const targetCamPos = new Vector3(
    planetPos.x * 0.36,  // 距离缩小到 ~1/2.8
    planetPos.y * 0.36,
    planetPos.z * 0.36
  );
  camera.position.lerp(targetCamPos, 0.04); // 每帧逼近
  controls.current?.target.lerp(planetPos, 0.04);
  controls.current?.update();
  ```
验收标准:
  - [ ] 点击星球 → 相机在 800ms 内平稳移动到星球近前 (2.8x 放大)
  - [ ] 动画期间 OrbitControls 禁用 (不可拖动)
  - [ ] 动画完成后 OrbitControls 恢复, 但 maxDistance 限制在放大距离 ±2
  - [ ] 点击空白 (Raycaster 未命中任何星球) → 相机还原到原始位置 (1200ms)
  - [ ] 还原后 OrbitControls 恢复原始 maxDistance
  - [ ] 连续快速点击两颗星球 → 第二次点击取消前一次动画, 直接切换到新目标
预估工作量: 3 Story Points
依赖关系: 依赖 EP-102 (selectedPlanetId 状态)
优先级: 🔴 P0
```

---

### Story-4: PlanetDetailCard — DOM overlay 浮动卡片

```yaml
Story ID: EP-104
标题: 前端 — PlanetDetailCard 组件 (DOM overlay + 屏幕坐标跟随)
描述: |
  创建 `PlanetDetailCard.tsx`:
  - 渲染在 React DOM 层 (非 R3F Canvas 内)
  - CSS 定位: `position: fixed`, 通过 `planets[selectedPlanetId].position` 的 3D → 屏幕坐标投影计算 left/top
  - 使用 `useThree(camera).project()` 将 3D 坐标映射到屏幕
  - 卡片内容:
    ```
    ┌──────────────────────────────┐
    │  📅 2025-07-15               │
    │  ─────────────────────       │
    │  "今天心情不错, 阳光洒在..."  │ ← preview_text
    │                              │
    │  💬 来源: 情绪日记           │ ← source_type 中文映射
    │  🎯 心情指数: 8/10           │
    └──────────────────────────────┘
    ```
  - 样式: 复用现有 `glass` 毛玻璃类, 呼吸光边框
  - 进场动画: fadeIn + slideUp (framer-motion, 300ms)
  - 出场动画: fadeOut (200ms)
  - 位置: 默认出现在星球右侧 20px 偏移, 若超出视口则自动翻转到左侧
  - 关闭按钮: 右上角 ✕, 点击触发 resetSelection

  屏幕坐标投影逻辑:
  ```tsx
  const [screenPos, setScreenPos] = useState({ x: 0, y: 0 });

  useFrame(() => {
    if (!selectedPlanet) return;
    const vec = new THREE.Vector3(...selectedPlanet.position);
    vec.project(camera);
    const x = (vec.x * 0.5 + 0.5) * window.innerWidth;
    const y = (-vec.y * 0.5 + 0.5) * window.innerHeight;
    setScreenPos({ x, y });
  });

  // 卡片位置 = screenPos + 偏移量 (默认右侧)
  ```
验收标准:
  - [ ] 点击星球 → 卡片以 fadeIn + slideUp 动画出现 (300ms)
  - [ ] 卡片固定在星球屏幕坐标右侧 20px (视口内自动翻转)
  - [ ] 卡片显示: 创建日期 (格式化 YYYY-MM-DD) + preview_text + source_type 中文标签 + mood_score
  - [ ] 卡片背景为毛玻璃 (`glass` class), 呼吸光边框
  - [ ] 右上角关闭按钮 → 清除 selectedPlanetId → 卡片淡出 + 镜头还原
  - [ ] 星球公转/镜头旋转时, 卡片实时跟随星球屏幕位置
  - [ ] 超出视口边界时自动翻转侧
预估工作量: 3 Story Points
依赖关系: 依赖 EP-103 (selectedPlanetId 非空时触发渲染)
优先级: 🔴 P0
```

---

### Story-5: 缩小还原 — 空白点击 + 退出动画

```yaml
Story ID: EP-105
标题: 前端 — 空白区域点击缩小还原 + 交互优化
描述: |
  实现退出的三种途径:
  1. 点击空白 (Canvas 区域但未命中任何星球) → 缩小还原
  2. 点击已选中星球本身 → 切换为缩小还原 (toggle 行为)
  3. 点击 PlanetDetailCard 关闭按钮 → 缩小还原

  还原动画:
  - 相机回到初始位置 (position: [0, 0, 12] 或原始 OrbitControls 位置)
  - 持续时间: 1200ms, easeOutCubic (比放大稍慢, 更舒缓)
  - 动画完成后 `selectedPlanetId = null`
  - OrbitControls 完全恢复 (原始 maxDistance)

  Pointer 事件处理:
  ```tsx
  // SceneCanvas.tsx
  <Canvas onPointerMissed={() => {
    if (selectedPlanetId) {
      handleDeselect();  // 缩小还原
    }
  }}>
  ```
  R3F 的 `onPointerMissed` 原生支持点击空白区域回调。
验收标准:
  - [ ] 点击空白 (Canvas 未命中星球) → 相机 1200ms 缩小还原
  - [ ] 再次点击已选中的星球 → 触发缩小还原 (toggle)
  - [ ] 关闭按钮 → 缩小还原 (同 1200ms)
  - [ ] 还原过程中若再次点击另一星球 → 取消还原, 直接放大到新星球
  - [ ] 还原后 selectedPlanetId = null, OrbitControls 完全恢复
预估工作量: 1 Story Point
依赖关系: 依赖 EP-103 (镜头控制), EP-104 (关闭按钮)
优先级: 🔴 P0
```

---

### Story-6: 视觉打磨 — 细节微调与主题联动

```yaml
Story ID: EP-106
标题: 前端 — 卡片样式微调 + 主题联动 + 极端情况处理
描述: |
  1. 主题联动:
     - Night 模式: 卡片底色 `rgba(15, 23, 42, 0.85)`, 边框光晕冷色 (#60a5fa)
     - Day 模式: 卡片底色 `rgba(255, 255, 255, 0.85)`, 边框光晕暖色 (#f59e0b)
  2. 极端情况:
     - preview_text 为空 → 显示 "此刻无声 🌙"
     - source_type 未知 → fallback 显示 "记录"
     - 星球被其他星球遮挡 → 提高 Raycaster 优先级 (根据距离排序)
  3. 卡片点击穿透:
     - 卡片本身不阻断 Canvas Raycaster (除了关闭按钮)
     - 卡片上的交互 (链接/按钮) 通过 stopPropagation 控制
  4. 性能:
     - 屏幕坐标投影仅在 selectedPlanetId 非 null 时执行 (useFrame 条件判断)
     - 避免每帧 setState → 改用 ref 更新, requestAnimationFrame 节流
验收标准:
  - [ ] Night/Day 模式下卡片颜色/光晕正确切换
  - [ ] preview_text 为空时显示 "此刻无声 🌙"
  - [ ] 被遮挡的星球也能通过 Raycaster 拾取 (基于距离优先)
  - [ ] 卡片上的关闭按钮可点击, 点击事件不穿透到 Canvas
  - [ ] 无选中状态时 useFrame 不执行投影计算
预估工作量: 1 Story Point
依赖关系: 依赖 EP-104
优先级: 🟡 P1
```

---

## 4. Sprint 时间线

```
Day 1          Day 2          Day 3          Day 4          Day 5
│              │              │              │              │
EP-101 ──────► │              │              │              │
(后端字段)      │              │              │              │
               │              │              │              │
EP-102 ───────►│              │              │              │
(类型+Store)   │              │              │              │
               │              │              │              │
               EP-103 ───────►│◄───── 里程碑 1              │
               (点击+镜头)     │  核心交互可用                  │
                              │  (可点击/放大/缩小)            │
                              │              │              │
                              EP-104 ───────►│              │
                              (DetailCard)   │              │
                                             │              │
                              EP-105 ───────►│◄── 里程碑 2  │
                              (退出逻辑)     │  全流程闭环   │
                                             │              │
                                             EP-106 ──────►│
                                             (打磨+主题)    │
                                                            │
                                                    ◄── 里程碑 3
                                                    发布就绪
```

### 每日交付物建议

| 日期 | 交付物 | 验证方式 |
|------|--------|---------|
| **Day 1** | EP-101 (后端 API 新增字段) + EP-102 (前端类型扩展) | API 返回 preview_text; Store 编译通过 |
| **Day 2** | EP-103 (点击拾取 + 镜头放大) — 核心交互 | 点击星球, 镜头缓动到近前, OrbitControls 锁定 |
| **Day 3** | EP-104 (PlanetDetailCard) — 卡片渲染 + 屏幕坐标跟随 | 放大后卡片出现, 跟随星球移动, 样机匹配 |
| **Day 4** | EP-105 (缩小还原) + 全流程联调 | 点击空白缩小, toggle 切换, 关闭按钮, 全链路无断点 |
| **Day 5** | EP-106 (视觉打磨 + 主题联动 + 极端情况) + QA | Night/Day 双模式验证, 空数据容错, FPS 检查 |

---

## 5. 风险与缓解措施

| # | 风险 | 概率 | 影响 | 缓解措施 |
|---|------|------|------|---------|
| R1 | **Raycaster 拾取精度低** — 星球较小或被遮挡时点击无响应 | 🟡 中 | 🔴 高 — 功能失效 | 增大 mesh 的 clickable 碰撞体 (不可见包围盒); 实现 distance-based 优先级排序 |
| R2 | **镜头动画抖动** — `useFrame` lerp 与 OrbitControls 冲突 | 🟡 中 | 🟡 中 — 体验降级 | 动画期间 `controls.enabled = false`; 使用 `camera.position.lerp` 而非直接赋值 |
| R3 | **屏幕坐标投影闪烁** — 每帧 setState 导致 React re-render | 🟡 中 | 🟡 中 | 使用 `useRef` 存储 screenPos + `requestAnimationFrame` 节流, 仅在位置变化 > 2px 时更新 DOM |
| R4 | **快速点击多颗星球** — 动画队列混乱 | 🟢 低 | 🔴 高 — 状态不一致 | 每次新点击取消前次动画目标; 用 `AbortController` 或状态标记 `isAnimating` |
| R5 | **preview_text 含敏感内容** — 用户隐私泄露 | 🟢 低 | 🔴 高 — 合规风险 | 后端统一过 Safety filter; preview 仅取首句前 40 字, 不包含完整对话 |

### 决策记录 (ADRs)

| ADR ID | 决策 | 选项 | 结果 |
|--------|------|------|------|
| ADR-001 | 镜头动画方案 | a) drei CameraControls b) 手写 lerp c) gsap | ✅ 手写 lerp — 最小依赖, 与 R3F 生命周期一致 |
| ADR-002 | 卡片渲染层 | a) R3F 内 Sprite b) DOM overlay | ✅ DOM overlay — 样式灵活, 支持 framer-motion 动画 |
| ADR-003 | 屏幕坐标更新频率 | a) 每帧 setState b) ref + rAF 节流 | ✅ ref + rAF — 避免无谓 re-render, 性能友好 |
| ADR-004 | 点击空白检测 | a) R3F onPointerMissed b) 自定义 event listener | ✅ R3F onPointerMissed — 原生支持, 零额外代码 |

---

## 6. 附录

### 6.1 修改文件清单

```
# 后端
MOD  backend/app/api/v1/...mood.py           # +preview_text, source_type 字段
MOD  backend/app/schemas/mood.py             # +PlanetDetailSchema

# 前端 — 新增
NEW  frontend/src/types/planet.ts            # PlanetData 扩展类型 (或合并到 mood.ts)
NEW  frontend/src/components/universe/PlanetDetailCard.tsx   # DOM 浮动卡片
NEW  frontend/src/hooks/usePlanetInteraction.ts             # 点击/镜头/选中逻辑封装

# 前端 — 修改
MOD  frontend/src/stores/useUniverseStore.ts  # +selectedPlanetId, +selectPlanet, +resetSelection
MOD  frontend/src/components/universe/Planet.tsx             # +onPointerDown, +Raycaster 拾取
MOD  frontend/src/components/universe/SceneCanvas.tsx        # +onPointerMissed
MOD  frontend/src/components/universe/CameraController.tsx   # +lerp 动画, +锁定/恢复逻辑
MOD  frontend/src/components/universe/PlanetGroup.tsx        # +选中高亮传递
```

### 6.2 PlanetData 最终接口定义

```ts
// types/planet.ts
export type PlanetType = 'calm' | 'happy' | 'sad' | 'release' | 'crisis' | 'chat';
export type PlanetSourceType = 'journal' | 'chat' | 'mood';

export interface PlanetData {
  id: string;
  type: PlanetType;
  moodAvg: number;              // 近 7 天情绪均值
  moodScore?: number;           // 当天得分
  preview_text: string;         // 预览内容 (≤50 chars, 非空)
  source_type: PlanetSourceType; // 来源分类
  created_at: string;           // ISO 时间戳
  tags?: string[];
  position: [number, number, number];
  scale: number;
  rotationSpeed: number;
  color?: string;
  glowIntensity?: number;
}
```

### 6.3 交互状态机

```
                ┌─────────────────────────────────────────────┐
                │              IDLE (无选中)                    │
                │  OrbitControls: 自由                         │
                │  PlanetDetailCard: 隐藏                      │
                └──────────┬──────────────────────────────────┘
                           │
                 点击星球 (onPointerDown)
                           │
                           ▼
                ┌─────────────────────────────────────────────┐
                │          ZOOMING_IN (放大中)                  │
                │  OrbitControls: disabled                     │
                │  相机: lerp → 目标位置 (800ms)                │
                │  卡片: 不可见 (等动画完成)                     │
                └──────────┬──────────────────────────────────┘
                           │
                 动画完成 (onAnimationComplete)
                           │
                           ▼
                ┌─────────────────────────────────────────────┐
                │          DETAIL (详情查看)                    │
                │  OrbitControls: enabled (maxDistance 受限)    │
                │  PlanetDetailCard: 可见 + 屏幕坐标跟随         │
                └──────────┬──────────────────────────────────┘
               ┌───────────┼──────────────┐
               │           │              │
       点击空白        点击同一星球     点击关闭按钮
  (onPointerMissed)  (onPointerDown)   (onClose)
               │           │              │
               └───────────┼──────────────┘
                           │
                           ▼
                ┌─────────────────────────────────────────────┐
                │         ZOOMING_OUT (缩小中)                  │
                │  OrbitControls: disabled                     │
                │  相机: lerp → 初始位置 (1200ms)               │
                │  卡片: fadeOut (200ms) → 隐藏                 │
                └──────────┬──────────────────────────────────┘
                           │
                 动画完成 (selectedPlanetId = null)
                           │
                           ▼
                ┌─────────────────────────────────────────────┐
                │              IDLE (恢复)                      │
                │  OrbitControls: 完全恢复                      │
                └─────────────────────────────────────────────┘
```

### 6.4 SSR 兼容性注意事项

> ✅ `PlanetDetailCard.tsx` 为纯 DOM 组件, 无 WebGL 依赖, SSR 友好。
> ⚠️ `useThree().project()` 仅在 Canvas 上下文中可用 — 通过 props 传递 `camera` 实例或在 `PlanetDetailCard` 内部通过 `useThree()` 获取。
> ⚠️ 确保 `PlanetDetailCard` 在 `Suspense` 外渲染 (DOM overlay 不应被 R3F loading 阻塞)。

---

*文档结束 — 2025-07-17*
