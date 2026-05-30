# 观心 MindWell — 项目总结

## 项目概述
AI 驱动的心理健康陪伴 Web 应用，支持 AI 倾诉、情绪日记、心理测评、ECHO 答案之书、3D 情绪星球等 7 大功能模块，日活用户可通过 Web 端访问。

## 工作内容

### 1. 全栈架构搭建
- **行动**：从零搭建 FastAPI + React + PostgreSQL + Redis + Docker 技术栈
- **成果**：实现 30+ REST API 端点、7 组业务模块、JWT 认证 + RLS 数据隔离 + 速率限制 + 全局异常处理中间件

### 2. AI 对话系统
- **行动**：集成 DeepSeek API，构建 Safety Pipeline（内容过滤→规则引擎→升级）+ Orchestrator 意图路由
- **成果**：支持流式 SSE 响应，危机检测准确率提升，对话支持多轮上下文记忆

### 3. UI/UX 全面重构
- **行动**：设计并实现「月光深夜情绪宇宙」视觉体系，包括 CSS Variables 三层 Token 系统（日间/深夜/情绪反馈）、玻璃拟态组件库、卡片三级层次
- **成果**：纯 CSS 实现月亮/星空/玻璃瓶/呼吸光/意识浮现动画，零贴图零 emoji，覆盖 13 个页面 30+ 组件

### 4. 3D 情绪星球（Three.js）
- **行动**：引入 @react-three/fiber + Three.js，实现深空星场（2000 粒子）、中心炽白核心、6 种程序化星球纹理、公转轨道系统
- **成果**：用户每次倾诉/日记自动生成星球，8 颗 Mock 星球实时公转，支持点击查看详情

### 5. Docker 容器化部署
- **行动**：编写多环境 docker-compose（dev/app/prod/cloud）+ Nginx 反向代理 + SSL 证书自动续期
- **成果**：一键部署至腾讯云服务器，前端/后端/数据库/缓存/ollama 全部容器化管理

### 6. 数据库设计
- **行动**：设计 7 张核心表（用户/对话/消息/情绪/测评/社区/记忆）+ Alembic 迁移 + PostgreSQL RLS 策略
- **成果**：复合索引优化查询性能，用户数据完全隔离，支持 10 万+ 条消息存储

## 量化成果

| 指标 | 数据 |
|------|------|
| 页面数 | 13 个 |
| API 端点 | 30+ |
| 前端组件 | 50+ |
| Zustand Store | 8 个 |
| CSS 变量 | 80+ 个（3 层作用域） |
| 数据库表 | 7 张 |
| Docker 服务 | 7 个容器 |
| 代码行数 | 后端 ~8,000 行 / 前端 ~15,000 行 |
| 3D 粒子数 | 2,000（星场）+ 8（星球） |
| 构建产物体积 | 前端 gzip ~200KB（含 Three.js 懒加载 193KB） |

## 技术栈
React 18 · TypeScript · Vite · Tailwind CSS · Framer Motion · Three.js · R3F · Zustand
FastAPI · SQLAlchemy 2.0 · PostgreSQL 16 · Redis 7 · Alembic · DeepSeek API
Docker · Nginx · GitHub Actions
