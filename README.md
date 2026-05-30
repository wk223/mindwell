# 🌙 观心 MindWell — 数字情绪栖息地

> "世界终于安静了一点。"

MindWell 是一个 **AI 驱动的心理健康陪伴平台**。不是冷冰冰的工具网站，而是一个会呼吸的深夜情绪空间。用户可以倾诉、记录心情、翻开答案之书、探索自己的情绪宇宙。

---

## ✨ 核心功能

### 💭 AI 倾诉
基于 DeepSeek API 的流式 AI 对话。支持情绪识别、危机检测、安全引导。聊天界面采用玻璃拟态设计，AI 头像带呼吸光效。

### 📖 ECHO 答案之书
在心里默念问题，翻开这一页。宇宙会回应你——答案以"意识浮现"动画逐字呈现，带光晕扩散效果。

### 🌌 情绪星球 (3D Universe)
每一次倾诉、每一篇日记、每一次情绪波动，都会生成一颗星球。平静是蓝色冰洋，幸福是金色气态巨星，忧伤是暗紫岩石——三者围绕炽白核心公转，构成你独一无二的情绪宇宙。基于 Three.js + React Three Fiber 渲染。

### 📝 情绪日记
每天记录心情分数（1-10），情绪球浮动选择器 + 纸条风格输入。自动生成周趋势图。支持多时段记录。

### 🧩 心理测评
内置 PHQ-9 抑郁筛查、GAD-7 焦虑筛查、16 型人格测试。科学量表，自动评分 + 解读。

### 🌿 社区广场
匿名发帖 + 评论，内容安全检测。树洞般的倾诉空间。

### 🎵 黑胶唱片机
内置 BGM 播放器，拖拽移动位置，模拟黑胶唱机交互。

---

## 🎨 视觉系统

### 日夜双模式
- ☀️ **日间** (08:00–19:59)：暖绿调、柔光、治愈感
- 🌙 **深夜** (20:00–07:59)：深蓝紫、月光、陪伴感
- CSS Variables 三层 Token 系统，1.8s 渐变过渡
- 支持手动切换（HomePage 右上角胶囊按钮）

### 情绪反馈
根据当天心情自动调整页面色调——开心偏暖金、平静偏薄荷绿、低落偏冷紫。粒子密度和光晕强度联动。

### 纯 CSS 视觉组件
毛玻璃三档、卡片三级层次、月光导航、呼吸光环、意识浮现动画、星空自转漂移——零贴图、零 emoji。

---

## 🛠 技术栈

| 层 | 技术 |
|---|------|
| **前端** | React 18 + TypeScript + Vite |
| **样式** | Tailwind CSS + CSS Variables + Framer Motion |
| **3D** | Three.js + @react-three/fiber + @react-three/drei |
| **状态** | Zustand (8 stores) |
| **后端** | Python 3.12 + FastAPI + SQLAlchemy 2.0 (async) |
| **数据库** | PostgreSQL 16 + Redis 7 |
| **AI** | DeepSeek API (OpenAI 兼容) |
| **部署** | Docker Compose + Nginx |
| **安全** | JWT 认证 + RLS + 内容安全管线 + 速率限制 |

---

## 🚀 快速启动

### 环境变量
```bash
cp .env.example .env
# 编辑 .env：填写 JWT_SECRET、LLM_API_KEY、POSTGRES_PASSWORD 等
```

### 本地开发（仅前端）
```bash
cd frontend
npm install
npm run dev          # → http://localhost:5173
```

### Docker 部署（服务器）
```bash
docker compose -f docker-compose.prod.yml build --no-cache
docker compose -f docker-compose.prod.yml up -d
# 访问 http://服务器IP
```

### 服务架构
```
Nginx (:80) → Frontend (React SPA)
            → Backend (:8000) → PostgreSQL (:5432)
                              → Redis (:6379)
                              → DeepSeek API / Ollama
```

---

## 📁 项目结构

```
mindwell/
├── backend/
│   └── app/
│       ├── api/v1/        # 7 组 REST 端点 (auth/dialogue/mood/assessment/community/memories/night)
│       ├── core/          # LLM客户端 / Agent编排 / 安全管线 / 提示词管理 / 心理量表
│       ├── models/        # 7 个 SQLAlchemy 模型
│       ├── services/      # 7 个业务服务层
│       └── middleware/     # 请求ID / 日志 / 限流
├── frontend/
│   └── src/
│       ├── pages/         # 13 个页面
│       ├── components/    # 10 个组件分组 (含 3D 宇宙)
│       ├── stores/        # 8 个 Zustand store
│       ├── hooks/         # useDayNight / useMoodTheme
│       └── styles/        # theme.css (600+ 行 CSS 变量 & keyframes)
├── docker-compose.prod.yml
└── docs/                  # 架构文档 / Tech Spec / PRD
```

---

## 📊 页面路由

| 路由 | 页面 | 功能 |
|------|------|------|
| `/home` | 首页 | 情绪场景卡 + 卡片系统 + 日夜切换 |
| `/chat` | AI 倾诉 | 流式对话 + 危机检测 |
| `/echo` | 答案之书 | 宇宙回应 + 逐字浮现 |
| `/universe` | 情绪星图 | 3D 星球公转 + 点击详情 |
| `/mood` | 情绪日记 | 心情打卡 + 趋势图 |
| `/assessment` | 心理测评 | PHQ-9 / GAD-7 / 人格测试 |
| `/community` | 社区广场 | 匿名发帖 + 评论 |
| `/night` | 深夜小智 | 深夜模式专属对话 |
| `/growth` | 自助成长 | 呼吸练习 / 冥想引导 |
| `/memories` | 记忆碎片 | 个人日记 CRUD |
| `/login` | 登录 | JWT 认证 |
| `/register` | 注册 | 昵称 + 邮箱 + 密码 |

---

## 🔐 API 端点

全部在 `/api/v1/` 下，共 7 组 30+ 端点。详见 `backend/app/api/v1/`。

| 模块 | 端点示例 |
|------|---------|
| Auth | `POST /auth/register` `POST /auth/login` |
| Dialogue | `GET /dialogue/conversations` `POST /dialogue/send` (SSE 流式) |
| Mood | `POST /mood/checkin` `GET /mood/trends` `GET /mood/calendar` |
| Assessment | `GET /assessments/scales` `POST /assessments/submit` |
| Community | `GET/POST /community/posts` `POST /community/posts/:id/comments` |
| Memories | `CRUD /memories` |
| Night | `POST /night/echo` |

---

## 🧠 AI 架构

```
用户消息 → Safety Pipeline (内容过滤+规则引擎+升级)
         → Orchestrator (意图路由+情感分析+危机检测)
         → Agent (emotional_support / crisis / assessment)
         → LLM Client (DeepSeek API, OpenAI 兼容, httpx 连接池)
         → 流式 SSE 响应 → 前端逐 token 渲染
```

---

*MindWell — 不是工具，是陪伴。*
