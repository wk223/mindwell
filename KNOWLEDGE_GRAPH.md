# MindWell 项目知识图谱

> 自动生成于 2025-07-17 · 基于代码静态分析

---

## 1. 后端 API 全景

### 路由总览（7 模块 / 30+ 端点）

| 模块 | 前缀 | 端点 | 文件 |
|------|------|------|------|
| Auth | `/auth` | 2 (register, login) | `api/v1/auth.py` |
| Dialogue | `/dialogue` | 4 (CRUD + SSE送信) | `api/v1/dialogue.py` |
| Mood | `/mood` | 6 (打卡/今日/趋势/日历/统计) | `api/v1/mood.py` |
| Assessment | `/assessments` | 5 (量表/提交/历史) | `api/v1/assessment.py` |
| Community | `/community` | 6 (帖子/评论/举报) | `api/v1/community.py` |
| Memories | `/memories` | 5 (CRUD + 清空) | `api/v1/memories.py` |
| Night | `/night` | 1 (ECHO答案) | `api/v1/night.py` |

### 数据库模型（7 表）

```
User ──┬── Conversation ──┬── Message
       │                  └── SafetyEvent
       ├── MoodEntry
       ├── Assessment
       ├── Post ── Comment
       └── UserMemory
```

### 中间件链

```
Request → RequestID → RequestLog → RateLimit → CORS → Route
                                                       ↓
                                                  ExceptionHandler
```

---

## 2. 前端组件全景

### 页面（13 个）

| 路由 | 页面 | 主要功能 |
|------|------|---------|
| `/home` | HomePage | 情绪场景卡 + 三级卡片 + 日夜切换 |
| `/chat` | ChatPage | AI 流式对话 + 危机检测 |
| `/echo` | EchoPage | ECHO 答案之书 + 意识浮现动画 |
| `/universe` | UniversePage | 3D 情绪星球 + Three.js |
| `/mood` | MoodPage | 情绪日记 + 情绪球打分 |
| `/assessment` | AssessmentPage | 心理测评 PHQ-9/GAD-7/16人格 |
| `/community` | CommunityPage | 匿名社区 |
| `/growth` | GrowthPage | 呼吸练习 + 心情追踪 |
| `/night` | LateNightPage | 深夜陪伴 |
| `/memories` | MemoryPage | 记忆碎片 CRUD |
| `/login` | LoginPage | 登录 |
| `/register` | RegisterPage | 注册 |

### Zustand Store（8 个）

| Store | 核心状态 |
|-------|---------|
| useAuthStore | user, isAuthenticated, login/register/logout |
| useDialogueStore | conversations, messages, sendMessage (SSE) |
| useMoodStore | todayEntry, trends, submitCheckin |
| useThemeStore | mode (day/night), toggle, resetToAuto |
| useUniverseStore | planets, selectedPlanetId |
| useLayoutStore | isMobile |
| useAssessmentStore | scales, answers, results |
| useCommunityStore | posts, comments |

### Hooks（2 个）

| Hook | 返回值 |
|------|--------|
| useDayNight | mode, greeting, toggle, resetToAuto, isManualOverride |
| useMoodTheme | theme (anxious/calm/happy), todayEntry |

---

## 3. 核心数据流

### AI 对话流程
```
ChatInput → useDialogueStore.sendMessage()
  → api/dialogue.ts (SSE fetch + Bearer token)
  → POST /api/v1/dialogue/send
  → DialogueService.process_message()
    → SafetyPipeline (content filter → rule engine → escalation)
    → AgentOrchestrator (intent routing → agent selection)
    → LLMClient.chat() (DeepSeek API)
  ← SSE stream: token → safety_event → done
  → useDialogueStore 逐 token 更新 UI
```

### 情绪打卡流程
```
MoodPage → submitCheckin(score, label, text, tags)
  → POST /api/v1/mood/checkin
  → MoodService.checkin() → MoodEntry(recorded_at=beijing_today)
  → useMoodTheme() 读取 todayEntry → 更新 html class (.mood-anxious/calm/happy)
  → CSS Variables 全页面即时切换
```

---

## 4. UI 视觉系统

### 三层 CSS Token

```
:root (日间)  →  .night-theme (深夜)  →  .mood-{anxious|calm|happy} (情绪)
   暖绿色调          深蓝紫色调              冷蓝雨天/月光/暖金
```

### 天气特效

| 情绪 | CSS class | 叠加层 | 粒子 |
|------|-----------|--------|------|
| 1-3 焦虑 | mood-anxious | RainOverlay(4层雨线) + FogOverlay(2层雾气) | 0.4x |
| 4-6 平静 | mood-calm | 无 | 1.0x |
| 7-10 幸福 | mood-happy | 无 | 1.3x |

---

## 5. 部署架构

```
Nginx (:80) → Frontend (React SPA, 静态文件)
            → /api/* → Backend (:8000, FastAPI)
                          → PostgreSQL (:5432)
                          → Redis (:6379)
                          → DeepSeek API (https://api.deepseek.com)
```

### Docker 服务（6 容器）

| 服务 | 镜像 | 健康检查 |
|------|------|---------|
| frontend | mindwell-frontend | depends_on backend healthy |
| backend | mindwell-backend | curl /health, 15s interval |
| postgres | postgres:16-alpine | pg_isready |
| redis | redis:7-alpine | redis-cli ping, AOF+RDB |
| ollama | ollama/ollama | ollama list |
| ollama-init | ollama/ollama | 3x retry model pull |
