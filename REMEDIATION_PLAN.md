# 观心 MindWell — 审查修复方案

> 基于 RISK_ASSESSMENT.md 的 P0/P1 风险 | 2025-07-17

---

## P0-1：补充自动化测试 (T1)

**现状**：项目零测试。

**方案**：
```
backend/tests/
├── test_auth.py          # 注册/登录/Token过期
├── test_dialogue.py      # 发送消息/流式响应/安全标记
├── test_mood.py          # 打卡/趋势/日历
└── conftest.py           # async test client + test DB fixture
```

**执行**：
```bash
# 后端用 pytest + httpx AsyncClient
cd backend
pip install pytest pytest-asyncio httpx
pytest tests/ -v
```

**工时**：2 天。优先补 auth + dialogue（核心流程）。

---

## P0-2：单服务器健康检查 (O1)

**现状**：Docker 已有 `restart: always` + healthcheck，需验证。

**验证**：
```bash
# 模拟 crash
docker compose -f docker-compose.prod.yml kill backend
sleep 5
docker compose -f docker-compose.prod.yml ps backend
# 应该显示 Up (healthy)，Docker 自动重启
```

**补充**：如未自动重启→检查 `restart: always` 是否配置。已配置则无需额外操作。**工时**：0.5 天。

---

## P0-3：危机检测可配置阈值 (P2)

**现状**：Safety Pipeline 硬编码关键词规则，误判率高。

**方案**：在 `backend/.env` 中增加可配置参数：
```bash
CRISIS_THRESHOLD_SCORE=4        # 低于此分触发危机
CRISIS_KEYWORDS=自杀,不想活,结束生命,自残
CRISIS_COOLDOWN_MINUTES=30      # 同用户冷却时间
```

修改 `backend/app/core/safety/rule_engine.py`：从 `config.py` 读取阈值而非硬编码。

**工时**：1 天。

---

## P1-1：Token 加密存储 (S1)

**现状**：JWT 明文存在 localStorage。

**方案**（短期，最小改动）：
```typescript
// frontend/src/api/client.ts
const TOKEN_KEY = "mindwell_token";
const ENC_PREFIX = "mw_";

function obfuscate(s: string) { return ENC_PREFIX + btoa(s); }
function deobfuscate(s: string) { return atob(s.replace(ENC_PREFIX, "")); }

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, obfuscate(token));
}
export function getToken(): string | null {
  const raw = localStorage.getItem(TOKEN_KEY);
  return raw ? deobfuscate(raw) : null;
}
```

**说明**：Base64 非加密，只是防止直接复制。XSS 仍可读取。真正的安全需要 httpOnly cookie（需改后端）。作为短期缓解。

**工时**：0.5 天。

---

## P1-2：数据库定时备份 (T4)

**方案**：在服务器 crontab 添加：
```bash
# 每天凌晨 3 点备份
0 3 * * * docker exec mindwell-postgres-1 pg_dump -U mindwell mindwell > /backup/mindwell_$(date +\%Y\%m\%d).sql
# 保留最近 7 天
0 4 * * * find /backup -name "mindwell_*.sql" -mtime +7 -delete
```

创建 `/backup` 目录并挂载到 postgres 容器。

**工时**：0.5 天。

---

## P1-3：前端错误监控 (T3)

**方案**：接入 Sentry 免费版（5000 errors/month 免费）。

```bash
cd frontend
npm install @sentry/react
```

```typescript
// frontend/src/main.tsx
import * as Sentry from "@sentry/react";
Sentry.init({ dsn: "https://xxx@sentry.io/xxx", environment: import.meta.env.PROD ? "production" : "development" });
```

**工时**：1 天。

---

## 执行计划

| 顺序 | 编号 | 内容 | 工时 | 累计 |
|------|------|------|------|------|
| 1 | P0-2 | 健康检查验证 | 0.5d | 0.5d |
| 2 | P0-3 | 危机检测可配置 | 1d | 1.5d |
| 3 | P1-1 | Token 混淆存储 | 0.5d | 2d |
| 4 | P1-2 | 数据库备份 | 0.5d | 2.5d |
| 5 | P1-3 | Sentry 接入 | 1d | 3.5d |
| 6 | P0-1 | 自动化测试 | 2d | 5.5d |

**总计**：5.5 个工作日，建议分 2 个 Sprint 执行。

---

*先做哪一项？*
