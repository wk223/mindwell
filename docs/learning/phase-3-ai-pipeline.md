# Phase 3 — AI 对话管线

> 目标：理解从用户发消息到 AI 回复的完整链路。
> 预计时间：5-6 小时（项目最复杂的部分）

---

## 3.1 全景：一条消息的旅程

当用户在聊天框输入"我今天心情不太好"并点发送，会发生什么：

```
用户输入
    ↓
ChatInput.sendMessage("我今天心情不太好")
    ↓
useDialogueStore.sendMessage() → SSE 请求 → POST /api/v1/dialogue/send
    ↓
[后端] dialogue.py → DialogueService.process_message()
    ↓
① SafetyPipeline → 安全吗？
    ↓ 安全
② AgentOrchestrator → 该用哪个 Agent？
    ↓ 选 emotional_support
③ LLMClient.chat() → 调用 DeepSeek API
    ↓ 流式返回 token
④ 逐 token 包装为 SSE 事件 → 发回前端
```

---

## 3.2 入口：dialogue.py

```python
@router.post("/send")
async def send_message(
    body: DialogueSendRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    redis: Redis = Depends(get_redis),
):
```

**参数注入**：
- `body` — 用户发送的 JSON（`{message: "我今天心情不太好", stream: true}`）
- `user` — 通过 JWT 验证的 User 对象（`Depends(get_current_user)` 自动完成）
- `db` — 数据库会话
- `redis` — Redis 连接

```python
    llm = get_llm_client()             # 获取 LLM 客户端（全局单例）
    rule_engine = get_rule_engine()    # 获取规则引擎（全局单例）
    safety = SafetyPipeline(redis, rule_engine)  # 安全管线（依赖 Redis + 规则引擎）
    orchestrator = AgentOrchestrator(llm, safety) # 编排器（依赖 LLM + 安全）
    service = DialogueService(orchestrator, safety, db, redis)
```

**关键理解**：`get_llm_client()` 和 `get_rule_engine()` 返回的是**进程级单例**——整个应用生命周期内只创建一次，所有请求共享。这避免了每次对话都创建新的 HTTP 连接池。

```python
    if body.stream:
        # 流式模式：返回 SSE (Server-Sent Events)
        return StreamingResponse(
            service.process_message_stream(str(user.id), body.conversation_id, body.message),
            media_type="text/event-stream",
        )
    else:
        # 非流式模式（测试用）
        result = await service.process_message(...)
        return DialogueResponse(...)
```

---

## 3.3 安全管线：SafetyPipeline

位置：`core/safety/safety_pipeline.py`

```python
class SafetyPipeline:
    def __init__(self, redis: Redis, rule_engine: RuleEngine):
        self.redis = redis
        self.rule_engine = rule_engine

    async def check(self, user_id: str, message: str) -> list[SafetyFlag]:
        # 第一步：内容过滤（PII、仇恨言论）
        filtered = ContentFilter().filter(message)

        # 第二步：规则引擎检测（自杀、自残、暴力）
        flags = self.rule_engine.detect(filtered)

        # 第三步：频率检查（同一用户短时间内反复触发危机词？）
        if flags:
            recent = await self.redis.get(f"crisis:{user_id}")
            if recent:
                flags.append(SafetyFlag("crisis_repeat", "high"))

        return flags
```

**为什么分两步？**
1. `ContentFilter` 做**字符串替换**（脱敏手机号、邮箱），纯字符串操作，极快
2. `RuleEngine` 做**关键词 + 正则匹配**（"自杀"、"不想活"、"自残"……），纯内存，极快

两步都不依赖 AI——所以安全检测几乎是瞬时的（< 5ms）。

---

## 3.4 规则引擎：RuleEngine

位置：`core/safety/rule_engine.py`

```python
RULES = [
    SafetyRule(
        rule_id="suicide_imminent",
        patterns=[r"我要自杀", r"不想活了", r"结束一切"],
        severity="critical",
        response="如果你正在经历危机，请拨打心理援助热线：400-161-9995",
    ),
    SafetyRule(
        rule_id="self_harm_active",
        patterns=[r"自残", r"割腕", r"伤害自己"],
        severity="critical",
    ),
    # ... 更多规则 ...
]
```

每条规则定义：
- `patterns` — 正则表达式列表，命中任一即触发
- `severity` — `"critical"`（危机）/ `"high"`（高风险）/ `"medium"`（关注）
- `response` — 可选，触发后自动回复的文案

```python
def detect(self, text: str) -> list[SafetyFlag]:
    flags = []
    for rule in self.rules:
        for pattern in rule.patterns:
            if re.search(pattern, text):
                flags.append(SafetyFlag(rule.rule_id, rule.severity))
                break  # 每条规则只触发一次
    # Critical 排最前面
    flags.sort(key=lambda f: 0 if f.severity == "critical" else 1)
    return flags
```

---

## 3.5 编排器：AgentOrchestrator

位置：`core/agents/orchestrator.py`

```python
class AgentOrchestrator:
    def __init__(self, llm: LLMClient, safety: SafetyPipeline):
        self.llm = llm
        self.safety = safety
        self.agents = {
            "emotional_support": EmotionalSupportAgent(llm),
            "crisis": CrisisAgent(llm),
            "assessment": AssessmentAgent(llm),
        }

    async def route(self, user_id: str, message: str, history: list) -> Agent:
        # 先安全检查
        flags = await self.safety.check(user_id, message)

        # 如果有 critical 标记 → 危机 Agent
        if any(f.severity == "critical" for f in flags):
            return self.agents["crisis"], flags

        # 如果消息包含评估关键词 → 评估 Agent
        if any(kw in message for kw in ["测评", "测试", "量表"]):
            return self.agents["assessment"], flags

        # 默认 → 情感支持 Agent
        return self.agents["emotional_support"], flags
```

**为什么需要编排器？** 不同的消息需要不同的回复风格：
- 普通倾诉 → 温暖、共情（EmotionalSupportAgent）
- 危机信号 → 冷静、给出热线、即刻引导（CrisisAgent）
- 想做测评 → 引导到量表页面（AssessmentAgent）

---

## 3.6 LLM 客户端：LLMClient

位置：`core/llm/client.py`

```python
class LLMClient:
    def __init__(self, settings: Settings):
        self._client = httpx.AsyncClient(
            base_url=settings.llm_base_url,           # https://api.deepseek.com/v1
            headers={
                "Authorization": f"Bearer {settings.llm_api_key.get_secret_value()}",
                "Content-Type": "application/json",
            },
            timeout=httpx.Timeout(10.0, read=90.0),  # 连接10秒超时，读取90秒超时
            limits=httpx.Limits(max_keepalive_connections=20, max_connections=50),
        )

    async def chat(self, model: str, messages: list, stream: bool = True):
        response = await self._client.send(
            self._client.build_request(
                "POST",
                "/chat/completions",    # OpenAI 兼容的端点
                json={
                    "model": model,
                    "messages": messages,
                    "stream": stream,
                    "max_tokens": 1024,
                    "temperature": 0.7,
                },
            ),
            stream=stream,
        )
```

**关键参数**：
- `timeout(10.0, read=90.0)` — 连接 10 秒超时（连不上就报错），读取 90 秒超时（AI 思考可以慢，但别超过 90 秒）
- `stream=True` — 关键！不等待完整响应，而是逐 token 接收
- `limits(max_keepalive_connections=20)` — HTTP 连接池保持 20 个长连接，复用减少握手开销

```python
@lru_cache
def get_llm_client() -> LLMClient:
    return LLMClient(get_settings())
```

`@lru_cache` 确保全局只有一个 LLMClient 实例——所有请求共享同一个 HTTP 连接池。在并发场景下，这意味着 50 个同时对话的用户共用同一个连接池，而不是每人创建新的。

---

## 3.7 流式响应：SSE (Server-Sent Events)

这是整个系统最精妙的部分。

**为什么不用 WebSocket？** SSE 更简单——它是单向的（服务器→客户端），不需要双向通信。AI 对话天然是"用户发一句，AI 回一串"，SSE 完美匹配。

```python
async def process_message_stream(self, user_id, conversation_id, message):
    # 1. 安全检查
    flags = await self.safety.check(user_id, message)
    if flags:
        yield f"data: {json.dumps({'type': 'safety', 'flags': [...]})}\n\n"
        if any(f.severity == "critical" for f in flags):
            return  # 危机消息不传给 AI

    # 2. 保存用户消息到数据库
    await self.save_message(conv_id, "user", message)

    # 3. 路由到合适的 Agent
    agent, _ = await self.orchestrator.route(user_id, message, history)

    # 4. 逐 token 流式返回
    async for token in agent.stream(message, history):
        yield f"data: {json.dumps({'type': 'token', 'content': token})}\n\n"

    # 5. 完成信号
    yield f"data: {json.dumps({'type': 'done'})}\n\n"
```

**SSE 格式**：
```
data: {"type": "token", "content": "我"}

data: {"type": "token", "content": "听到"}

data: {"type": "token", "content": "你"}

data: {"type": "done"}
```

前端通过 `EventSource` 或 `fetch` + `ReadableStream` 逐行解析 `data:` 行，实时更新 UI。

---

## 3.8 完整调用链（时序图）

```
用户          前端            Nginx         FastAPI       Safety      Orchestrator   LLMClient    DeepSeek
 │             │               │              │             │             │             │            │
 │  输入消息   │               │              │             │             │             │            │
 │───────────→│               │              │             │             │             │            │
 │            │  POST /send   │              │             │             │             │            │
 │            │──────────────→│  proxy_pass  │             │             │             │            │
 │            │               │─────────────→│             │             │             │            │
 │            │               │              │  check()    │             │             │            │
 │            │               │              │────────────→│             │             │            │
 │            │               │              │←────────────│             │             │            │
 │            │               │              │  route()    │             │             │            │
 │            │               │              │─────────────────────────→│             │            │
 │            │               │              │←─────────────────────────│             │            │
 │            │               │              │  chat()     │             │             │            │
 │            │               │              │─────────────────────────────────────→│            │
 │            │               │              │             │             │             │  POST /v1  │
 │            │               │              │             │             │             │───────────→│
 │            │               │              │             │             │             │←─ token ───│
 │            │               │              │←── token ──────────────────────────────│            │
 │            │  SSE: token   │              │             │             │             │            │
 │            │←──────────────│              │             │             │             │            │
 │  逐字显示  │               │              │             │             │             │            │
 │←───────────│               │              │             │             │             │            │
```

---

*Phase 3 完。下一章：[Phase 4 — 前端骨架](./phase-4-frontend.md)*
