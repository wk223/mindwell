# Phase 1 — 项目全景

> 目标：不写一行代码，先看懂整个项目的样子和骨架。
> 预计时间：2-3 小时

---

## 1.1 这是什么

**观心 MindWell** 是一个 AI 心理健康陪伴 Web 应用。用户打开网站后可以：

- 跟 AI 聊天（像 ChatGPT，但有危机检测和安全引导）
- 记录每天的心情分数和日记
- 翻开"答案之书"获取随机哲学回应
- 查看自己的"情绪星球"——一个 3D 宇宙，每次倾诉/日记都会生成一颗星球
- 在匿名社区发帖
- 做心理测评量表
- 进行呼吸练习

技术上它是一个**前后端分离的全栈项目**：

```
用户浏览器
    ↓ HTTP
Nginx（端口 80）
    ├── /           → 前端静态文件（React SPA）
    └── /api/*      → 后端（FastAPI，端口 8000）
                        ├── PostgreSQL（数据库）
                        ├── Redis（缓存 + 限流）
                        └── DeepSeek API（AI 对话）
```

---

## 1.2 三分钟跑起来

### 1.2.1 只跑前端（最简单）

```bash
cd frontend
npm install
npm run dev
```

浏览器打开 `http://localhost:5173`。API 请求会自动转发到 `121.4.44.210`（远程服务器）。
**不需要本地数据库、Redis、Python！**

这一行是怎么实现的？看 `frontend/vite.config.ts`：

```typescript
// frontend/vite.config.ts
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://121.4.44.210",   // ← 所有 /api/* 请求转发到远程服务器
        changeOrigin: true,
      },
    },
  },
});
```

Vite 开发服务器内置了代理功能。当你访问 `http://localhost:5173` 时：
- 页面、组件、CSS → Vite 本地提供（热更新，秒级刷新）
- 任何 `/api/*` 请求 → Vite 自动转发到远程服务器

这就是为什么你改一个按钮样式，保存后浏览器立即更新，但 AI 对话功能也能正常工作。

### 1.2.2 完整部署（Docker）

如果要在服务器上跑完整服务：

```bash
# 1. 配置环境变量
cp .env.example .env
# 编辑 .env，填入：
#   JWT_SECRET=你的密钥
#   LLM_API_KEY=你的DeepSeek API key
#   POSTGRES_PASSWORD=数据库密码

# 2. 启动所有服务
docker compose -f docker-compose.prod.yml up -d --build
```

这一条命令做了什么？它会启动 6 个 Docker 容器：

```
mindwell-frontend-1    ← Nginx + React 打包文件，监听 :80
mindwell-backend-1     ← FastAPI，监听 :8000
mindwell-postgres-1    ← PostgreSQL 16，监听 :5432
mindwell-redis-1       ← Redis 7，监听 :6379
mindwell-ollama-1      ← Ollama（可选本地 AI 模型）
mindwell-ollama-init-1 ← Ollama 模型拉取（一次性）
```

---

## 1.3 项目目录总览

```
mindwell/
├── backend/               ← Python 后端（FastAPI）
│   ├── app/
│   │   ├── api/v1/        ← 7 组 REST 接口（auth, dialogue, mood…）
│   │   ├── core/           ← LLM客户端 / Agent编排 / 安全管线
│   │   ├── models/         ← 7 张数据库表定义
│   │   ├── services/       ← 业务逻辑层
│   │   ├── schemas/        ← 请求/响应格式定义
│   │   ├── middleware/     ← 请求ID / 日志 / 限流 / 异常处理
│   │   ├── db/             ← 数据库连接 + Redis
│   │   ├── config.py       ← 全局配置（读 .env）
│   │   ├── dependencies.py ← JWT 认证依赖注入
│   │   └── main.py         ← FastAPI 应用入口
│   ├── tests/              ← 45 个自动化测试
│   ├── alembic/            ← 数据库迁移脚本
│   └── Dockerfile
│
├── frontend/               ← React 前端（Vite + TypeScript）
│   ├── src/
│   │   ├── pages/          ← 13 个页面组件
│   │   ├── components/     ← 50+ 个 UI 组件
│   │   ├── stores/         ← 8 个 Zustand 状态管理
│   │   ├── api/            ← API 调用封装
│   │   ├── hooks/          ← 自定义 Hook
│   │   ├── styles/         ← theme.css（600+ 行 CSS 变量）
│   │   ├── types/          ← TypeScript 类型定义
│   │   ├── router.tsx      ← 路由表
│   │   ├── main.tsx        ← 应用入口
│   │   └── index.css       ← Tailwind + 全局样式
│   ├── public/textures/    ← 星球纹理图片
│   ├── nginx.conf          ← Nginx 配置
│   ├── Dockerfile
│   └── vite.config.ts
│
├── docker-compose.prod.yml ← 生产环境 Docker 编排
├── scripts/                ← 部署/备份脚本
├── docs/                   ← 所有文档
└── .env                    ← 环境变量（不入 Git）
```

---

## 1.4 理解核心概念：数据是怎么流动的

以"用户发送一条 AI 对话"为例，追踪数据流：

```
步骤 1：用户在 ChatInput 输入框打字，点发送
    ↓
步骤 2：ChatInput 组件调用 useDialogueStore.sendMessage("你好")
    ↓
步骤 3：Store 内部调用 api/dialogue.ts 的 SSE 流式请求
    → POST /api/v1/dialogue/send
    → Headers: Authorization: Bearer <JWT token>
    → Body: { message: "你好", stream: true }
    ↓
步骤 4：Nginx 收到请求，匹配 location /api/ { proxy_pass http://backend:8000; }
    ↓
步骤 5：FastAPI 后端收到请求
    → 中间件链：RequestID → RequestLog → RateLimit → CORS
    → 路由匹配：POST /api/v1/dialogue/send
    → 依赖注入：get_current_user（JWT 解码 + 数据库查用户）
    ↓
步骤 6：DialogueService.process_message()
    → SafetyPipeline（内容安全检查）
    → AgentOrchestrator（意图路由，选合适的 AI Agent）
    → LLMClient.chat()（调用 DeepSeek API）
    ↓
步骤 7：DeepSeek 返回流式 token
    → 后端逐 token 包装为 SSE 事件
    → 通过 HTTP 连接逐条发回前端
    ↓
步骤 8：前端 SSE 解析
    → onToken 回调 → UseDialogueStore 逐字更新 UI
    → MessageBubble 实时渲染新文字
```

**关键理解**：整个过程的瓶颈在步骤 6→7（LLM 响应延迟），不在前端或数据库。所以流式传输至关重要——用户不用等 AI 全部回答完就能看到前几个字。

---

## 1.5 理解前端是怎样组织的

打开 `frontend/src/main.tsx`，这是整个前端的入口：

```typescript
import "./index.css";        // ← 全局样式（Tailwind + body背景 + 玻璃拟态）
import "./styles/theme.css"; // ← CSS 变量（日间/深夜/情绪 三层 Token）

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>           // ← 全局错误兜底
      <BrowserRouter>         // ← React Router
        <ParticleField />     // ← 全屏粒子背景（Canvas 2D）
        <App />               // ← App 组件
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>
);
```

`App` 组件（`App.tsx`）非常简单：

```typescript
import AppRouter from "./router";
export default function App() {
  return <AppRouter />;
}
```

`AppRouter`（`router.tsx`）定义了所有路由：

```typescript
<Routes>
  <Route path="/" element={<Navigate to="/home" />} />
  <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
  <Route path="/chat" element={<PrivateRoute><AppShell><ChatPage /></AppShell></PrivateRoute>} />
  {/* ... 其他路由 ... */}
</Routes>
```

**关键理解**：
- `PrivateRoute` — 检查 `isAuthenticated`，未登录跳转 `/login`
- `GuestRoute` — 检查 `isAuthenticated`，已登录跳转 `/home`
- `AppShell` — 桌面端布局（左侧导航 + 中间内容 + 右侧面板）

---

## 1.6 理解后端是怎样组织的

打开 `backend/app/main.py`：

```python
# 创建 FastAPI 应用
app = FastAPI(title="MindWell API", version="0.1.0")

# 添加中间件（按顺序执行）
app.add_middleware(CORSMiddleware, ...)      # 1. 跨域
app.add_middleware(RequestIDMiddleware)       # 2. 注入 X-Request-ID
app.add_middleware(RequestLogMiddleware)      # 3. 记录请求日志
app.add_middleware(RateLimitMiddleware)       # 4. 限流
app.add_exception_handler(Exception, ...)     # 全局异常兜底

# 注册路由
app.include_router(router)  # router 前缀 /api/v1
```

`router`（`api/router.py`）聚合了 7 个子路由：

```python
router = APIRouter(prefix="/api/v1")
router.include_router(auth.router)       # /api/v1/auth/*
router.include_router(dialogue.router)   # /api/v1/dialogue/*
router.include_router(mood.router)       # /api/v1/mood/*
# ... 其他 4 个
```

每个子路由是一个独立的 `APIRouter`，对应一个业务模块。

---

## 1.7 三个图层：理解 UI 是怎样"活"起来的

MindWell 最特别的不是功能，是**页面会跟着用户状态变化**。这通过三个正交的 CSS class 实现：

```
<html> 元素同时有三个 class：
  └── .night-theme    ← 日夜模式（08:00-19:59 日间 / 20:00-07:59 深夜）
  └── .mood-anxious   ← 情绪天气（1-3分 雨天 / 4-6分 月光 / 7-10分 晴天）
                        ↑
                        这三个是同时存在的，互不影响！
```

每个 class 覆盖一组 CSS 变量：

```css
:root {
  --bg-deep: #eaf5ed;      /* 日间暖绿底 */
  --accent-400: #66bb6a;   /* 日间绿色 */
}
.night-theme {
  --bg-deep: #020617;      /* 深夜深蓝底 */
  --accent-400: #8b5cf6;   /* 深夜紫色 */
}
.mood-anxious {
  --bg-deep: #0f1f35;      /* 雨天冷蓝底 */
  --particle-color: rgba(96, 165, 250, 0.2);  /* 粒子减少 */
}
```

所有组件都通过 `var(--xxx)` 引用这些变量——改一个 class，整个页面变色。

---

## 1.8 学习路线建议

后面的 Phase 按以下顺序阅读效果最好：

| Phase | 内容 | 为什么这个顺序 |
|-------|------|---------------|
| **Phase 2** | 后端基础（入口→路由→模型→中间件） | 先理解"数据从哪来" |
| **Phase 3** | AI 对话管线（最复杂的部分） | 项目的灵魂，理解了它就理解了 60% |
| **Phase 4** | 前端骨架（路由→Store→API→AppShell） | 理解"数据怎么到 UI" |
| **Phase 5** | UI 系统（Token→情绪→粒子→场景卡） | 理解"页面怎么活起来" |
| **Phase 6** | 3D 情绪星球 | 独立子系统，最后学 |
| **Phase 7** | 部署 + CI/CD | 工程化收尾 |
| **Phase 8** | 架构复盘 | 全链路串联 + 设计模式总结 |

---

*Phase 1 完。下一章：[Phase 2 — 后端基础设施](./phase-2-backend.md)*
