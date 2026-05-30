# 🛠️ Sprint Tech Spec — MindWell O 系列运维修复

| 字段 | 值 |
|---|---|
| **Sprint ID** | `OPS-001` |
| **Sprint 名称** | MindWell 运维加固：健康检查 + Redis 持久化 + 启动顺序 |
| **目标** | 消除单服务器无高可用的三大风险：通过完整的 healthcheck 验证 + 自动重启保障服务韧性；开启 Redis AOF 持久化杜绝重启丢数据；优化容器启动顺序消除竞争条件。确认 SSL 及 LLM 配置的正确性。 |
| **时间范围** | 2 天（验证 + 修复 + 部署验证） |
| **参与角色** | 后端/运维工程师 1 人，QA 验证 0.5 天 |
| **基准文件** | `docker-compose.prod.yml` / `docker-compose.cloud.yml` / `frontend/docker-entrypoint.sh` |

---

## 1. 问题分类矩阵

### 🔴 Critical（阻断级，3 项）

| ID | 描述 | 影响范围 | 涉及文件/模块 | 修复策略 |
|---|---|---|---|---|
| **O1-A** | `frontend` 依赖 `backend` 未设置 `condition: service_healthy`，仅 `depends_on: - backend` | 前端 nginx 可能在 backend 未就绪时启动 → 用户 502 / 首页白屏 | `docker-compose.prod.yml` line 110, `docker-compose.cloud.yml` | 补全 `condition: service_healthy` |
| **O1-B** | Redis 无持久化配置 —— 容器重启后 session/cache 全部丢失，用户强制下线 | 全部用户登录态丢失、rate-limit 计数器重置、对话历史缓存失效 | `docker-compose.prod.yml` redis service | 添加 `appendonly yes` + `appendfsync everysec` 到 redis command |
| **O1-C** | `backend` healthcheck 使用 Python 内联脚本，`urllib` 无超时传播；若 GIL/协程阻塞 healthcheck 会 hang 住 | Docker 认为 backend 不健康 → 持续重启容器，影响用户体验 | `docker-compose.prod.yml` backend healthcheck | 改用 `curl -f http://localhost:8000/health` 或确保 timeout 生效 |

### 🟡 Bug（功能错误，2 项）

| ID | 描述 | 影响范围 | 涉及文件/模块 | 修复策略 |
|---|---|---|---|---|
| **O1-D** | `ollama-init` 的 `ollama pull` 命令无重试；网络抖动导致首次拉取失败后容器直接退出 | 本地模型未拉取 → backend 调用 ollama 超时 | `docker-compose.prod.yml` ollama-init command | 添加 shell 重试循环（最多 3 次） |
| **O3-A** | `docker-compose.cloud.yml` 中 Redis 已配 `--save`（RDB）但无 AOF，重启后最近几秒数据丢失 | 写密集型场景（对话流）下极小窗口数据丢失 | `docker-compose.cloud.yml` redis command | 统一对齐为 AOF + RDB 双模式 |

### 🟢 Enhancement（体验改进，1 项）

| ID | 描述 | 影响范围 | 涉及文件/模块 | 修复策略 |
|---|---|---|---|---|
| **O1-E** | `docker-compose.cloud.yml` 和 `docker-compose.prod.yml` healthcheck `interval`/`retries` 参数不一致（prod 30s/3，cloud 10s/10），启动期冗余等待 | 首次部署耗时偏长 | 两个 compose 文件 | 统一为标准值 `interval: 15s, retries: 5` |

---

## 2. ✅ 确认项（O4 / O5）

### O4 — SSL 证书手动管理 → certbot 自动续期 ✓

| 检查点 | 状态 | 依据 |
|---|---|---|
| `docker-compose.ssl.yml` 存在 | ✅ | certbot 容器每 12h 自动续期 |
| nginx 自动检测证书 | ✅ | `docker-entrypoint.sh` 检测 `/etc/nginx/ssl/fullchain.pem` 存在后切换 HTTPS |
| `setup-ssl.sh` 可用 | ✅ | 支持 `./setup-ssl.sh your-domain.com` 首次申请 |
| 443 端口映射 | ✅ | `docker-compose.cloud.yml` frontend `ports: "443:443"` |
| **结论：无需修改** | ✅ |    |

### O5 — Ollama / DeepSeek 混用 → compose 已修复 ✓

| 检查点 | 状态 | 依据 |
|---|---|---|
| 本地模式（prod.yml） | ✅ | 含 `ollama` + `ollama-init` 服务，`LLM_BASE_URL` 指向本地 |
| 云端模式（cloud.yml） | ✅ | 无 ollama 服务，`LLM_BASE_URL=https://api.deepseek.com/v1` |
| `deploy.sh` 模式选择 | ✅ | `./deploy.sh cloud` vs `./deploy.sh local` 分别使用对应 compose |
| 环境变量隔离 | ✅ | 两套 compose 的 `LLM_*` 变量各自独立 |
| **结论：无需修改** | ✅ |    |

---

## 3. Story 拆分

---

### Story `OPS-001-01`：补齐 frontend 启动依赖

- **标题**：frontend 容器加入 `condition: service_healthy` 依赖
- **描述**：当前 frontend 仅写 `depends_on: - backend`，无 health 条件。backend 启动需要完成 `init_db` + `alembic upgrade` + uvicorn bind，约 5–20s。这期间 frontend 的 nginx 已启动，`/api/` 代理会返回 502。
- **验收标准**：
  1. `docker-compose.prod.yml` 中 frontend 的 `depends_on` 包含 `backend: condition: service_healthy`
  2. `docker-compose.cloud.yml` 中作同样修改
  3. 手动验证：启动后 `docker compose ps` 显示 frontend 在 backend healthy 后才变为 `healthy`
  4. `docker compose logs frontend` 无 502 错误
- **预估工作量**：1 Story Point
- **依赖关系**：无
- **优先级**：🔴 Critical

---

### Story `OPS-001-02`：统一并加固后端 healthcheck

- **标题**：backend healthcheck 改用 curl 并统一间隔参数
- **描述**：当前 prod.yml healthcheck 用 Python 内联 `urllib`，cloud.yml 也一样。若协程池耗尽或 GIL 阻塞，healthcheck 可能 hang 住。改为 Alpine 内置的 `wget -qO-` 或安装 `curl`（backend Dockerfile 基于 python:3.12-slim，无 curl，安装仅 2MB）。
- **验收标准**：
  1. backend Dockerfile 添加 `RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*`
  2. 所有 compose 文件的 backend healthcheck 改为 `curl -f http://localhost:8000/health`
  3. 统一 `interval: 15s, timeout: 5s, retries: 5`
  4. 验证：healthcheck 失败时 `docker inspect` 显示 `"Health": "unhealthy"`，然后自动重启
- **预估工作量**：2 Story Points
- **依赖关系**：无
- **优先级**：🔴 Critical

---

### Story `OPS-001-03`：开启 Redis AOF 持久化

- **标题**：Redis 追加 AOF 持久化配置，杜绝重启丢数据
- **描述**：当前 `docker-compose.prod.yml` 的 Redis 仅挂载了 `redis_data:/data` 卷，但未传任何 `--save` 或 `--appendonly` 参数。默认 Redis Alpine 镜像以无持久化模式启动，重启后所有数据（session、rate-limit 计数、缓存）消失。需添加 AOF (append-only file) 模式，每秒钟 fsync。
- **验收标准**：
  1. `docker-compose.prod.yml` 中 Redis 加入 `command: redis-server --appendonly yes --appendfsync everysec --save 900 1 --save 300 10 --maxmemory 128mb --maxmemory-policy allkeys-lru`
  2. `docker-compose.cloud.yml` 中同样更新（当前仅有 `--save`，补上 `--appendonly`）
  3. 启动后进入容器验证：`redis-cli CONFIG GET appendonly` 返回 `yes`
  4. 写入 key → `docker compose restart redis` → key 仍存在
- **预估工作量**：2 Story Points
- **依赖关系**：无
- **优先级**：🔴 Critical

---

### Story `OPS-001-04`：ollama-init 拉取重试

- **标题**：ollama-init 添加 shell 重试循环，防止网络抖动导致模型拉取失败
- **描述**：当前 `ollama-init` 的 `ollama pull` 无重试。若首次拉取因 DNS/网络超时失败，容器立即退出，本地模型未就绪，backend 调用 ollama 会持续超时。添加最多 3 次重试，每次间隔 5s。
- **验收标准**：
  1. `ollama-init` 的 command 使用循环：`for i in 1 2 3; do ollama pull ${LLM_MODEL} && break || sleep 5; done`
  2. 若 3 次均失败，exit 1（显示错误消息）
  3. 测试：模拟网络断开后恢复，ollama-init 能完成拉取
- **预估工作量**：1 Story Point
- **依赖关系**：无
- **优先级**：🟡 Bug

---

### Story `OPS-001-05`：部署脚本验证 + 回归检查

- **标题**：验证 `deploy.sh` 在新配置下正常工作
- **描述**：修改后的 compose 文件需在 `deploy.sh` 的 cloud/local 两种模式下均通过集成测试。验证 SSL 证书自动载入、Redis 持久化生效、健康检查正确。
- **验收标准**：
  1. `./deploy.sh cloud` 完整流程通过（构建 → 启动 → 健康检查全部通过）
  2. 访问 `http://<ip>/health` 返回 `{"status":"ok"}`
  3. API 调用（登录 + 对话）成功
  4. `docker compose ps` 所有服务状态 `healthy`（或 `running`）
- **预估工作量**：2 Story Points
- **依赖关系**：依赖 OPS-001-01 ~ OPS-001-04 全部合并
- **优先级**：🟢 Enhancement

---

## 4. Sprint 时间线

### 总天数：2 天（建议：7月18日–7月19日）

```
Day 1 (7/18) — 代码修复
├── 上午
│   ├── OPS-001-01  frontend depends_on 补全  [1 SP]
│   ├── OPS-001-02  backend Dockerfile + healthcheck 统一  [2 SP]
│   └── OPS-001-03  Redis AOF 配置  [2 SP]
├── 下午
│   ├── OPS-001-04  ollama-init 重试  [1 SP]
│   └── 本地测试验证 (docker compose up)
│
Day 2 (7/19) — 部署验证
├── 上午
│   ├── OPS-001-05  部署脚本回归  [2 SP]
│   ├── 上传到测试服务器验证
│   └── 滚动更新到生产
└── 下午
    ├── 监控 2h 确认无异常
    └── 输出验证报告
```

### 里程碑节点

| 时间 | 里程碑 | 验收方式 |
|---|---|---|
| Day 1 18:00 | 所有 compose 修改合并到 `main` 分支 | Git commit + PR review |
| Day 2 10:00 | 测试环境部署验证通过 | `docker compose up` + curl health + 登录测试 |
| Day 2 16:00 | 生产环境滚动更新完成 + 监控稳定 | Grafana / 日志无 error |

---

## 5. 风险与缓解措施

| # | 风险 | 等级 | 概率 | 影响 | 缓解措施 |
|---|---|---|---|---|---|
| R1 | Redis AOF 文件随时间增长，磁盘写放大 | 🟡 中 | 中 | 磁盘 IO 增加；`/data` 卷膨胀 | 设置 `auto-aof-rewrite-percentage 100` + `auto-aof-rewrite-min-size 64mb`（Redis 默认已开启自动 rewrite），无需额外配置 |
| R2 | 统一 healthcheck interval 从 10s→15s 后，启动检测延迟增大 | 🟢 低 | 低 | 服务就绪判断慢 5s | 仅拉长了 5s，首次部署总时间仍 < 60s，可接受 |
| R3 | curl 安装增加镜像层体积约 2MB | 🟢 低 | 确定 | 镜像增大 | 2MB 可忽略，且 `--no-install-recommends` 最小化依赖 |
| R4 | ollama-init 重试导致首次部署时间延长（最长 15s × 3 = 45s） | 🟢 低 | 仅网络差时 | 部署整体变慢 | `ollama pull` 本身已耗时 1–5min，额外 45s 可接受 |

---

## 6. 具体配置变更（可复制粘贴）

### 6.1 `docker-compose.prod.yml`

```yaml
# === Redis 变更 ===
  redis:
    image: redis:7-alpine
    restart: always
    command: redis-server --appendonly yes --appendfsync everysec --save 900 1 --save 300 10 --maxmemory 128mb --maxmemory-policy allkeys-lru
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 15s
      timeout: 5s
      retries: 5
    networks:
      - mindwell

# === Backend 变更 ===
  backend:
    build: ./backend
    restart: always
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 15s
      timeout: 5s
      retries: 5

# === Frontend 变更 ===
  frontend:
    build: ./frontend
    restart: always
    depends_on:
      backend:
        condition: service_healthy
    ports:
      - "80:80"
    networks:
      - mindwell

# === ollama-init 变更 ===
  ollama-init:
    image: ollama/ollama:latest
    depends_on:
      ollama:
        condition: service_healthy
    entrypoint: ["/bin/sh", "-c"]
    command:
      - |
        echo "Pulling model ${LLM_MODEL:-qwen2.5:7b}..."
        for i in 1 2 3; do
          ollama pull ${LLM_MODEL:-qwen2.5:7b} && echo "Model ready." && exit 0
          echo "Attempt $i failed, retrying in 5s..."
          sleep 5
        done
        echo "FATAL: Failed to pull model after 3 attempts" && exit 1
    environment:
      - OLLAMA_HOST=ollama:11434
    networks:
      - mindwell
```

### 6.2 `docker-compose.cloud.yml`

```yaml
# === Redis 变更 ===
  redis:
    image: redis:7-alpine
    restart: always
    command: redis-server --appendonly yes --appendfsync everysec --save 900 1 --save 300 10 --maxmemory 64mb --maxmemory-policy allkeys-lru
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 15s
      timeout: 5s
      retries: 5
    deploy:
      resources:
        limits:
          memory: 96M

# === Backend healthcheck 变更 ===
  backend:
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 15s
      timeout: 5s
      retries: 5

# === Frontend 变更 ===
  frontend:
    depends_on:
      backend:
        condition: service_healthy
```

### 6.3 `backend/Dockerfile` 追加一行

```dockerfile
# 在 COPY . . 之前或之后，安装 curl（用于容器 healthcheck）
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*
```

---

## 7. 服务器验证命令清单

```bash
# 1. 本地构建测试
cd C:/Users/21699/Desktop/mindwell-new
docker compose -f docker-compose.cloud.yml up -d --build

# 2. 检查所有服务状态
docker compose -f docker-compose.cloud.yml ps

# 3. 验证 Redis AOF
docker compose -f docker-compose.cloud.yml exec redis redis-cli CONFIG GET appendonly
# 预期: 1) "appendonly" 2) "yes"

# 4. 验证持久化（写入 → 重启 → 读取）
docker compose -f docker-compose.cloud.yml exec redis redis-cli SET test_persistence "hello_ops"
docker compose -f docker-compose.cloud.yml restart redis
sleep 3
docker compose -f docker-compose.cloud.yml exec redis redis-cli GET test_persistence
# 预期: "hello_ops"

# 5. 验证 healthcheck
docker inspect --format='{{json .State.Health}}' $(docker compose -f docker-compose.cloud.yml ps -q backend)
# 预期: Status 为 "healthy"

# 6. 验证 frontend 依赖顺序（查看启动日志时序）
docker compose -f docker-compose.cloud.yml logs frontend | head -20
# 确认 nginx 启动时间在 backend healthy 之后

# 7. API 集成测试
curl -s http://localhost:80/health
# 预期: {"status":"ok","version":"0.1.0"}

# 8. 清理测试 key
docker compose -f docker-compose.cloud.yml exec redis redis-cli DEL test_persistence
```
