#!/bin/bash
# ==============================================
#  MindWell 一键部署脚本 (云服务器)
#  用法:
#    chmod +x deploy.sh && ./deploy.sh
#    ./deploy.sh cloud   # 云端模式 (DeepSeek API)
#    ./deploy.sh local   # 自托管模式 (Ollama 本地模型)
# ==============================================
set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

MODE=${1:-cloud}

echo -e "${GREEN}"
echo "  ╔══════════════════════════════════════╗"
echo "  ║      MindWell 心理疗愈平台           ║"
echo "  ║      一键部署脚本 (${MODE} 模式)        ║"
echo "  ╚══════════════════════════════════════╝"
echo -e "${NC}"

# ---- 1. Check prerequisites ----
echo -e "${YELLOW}[1/5] 检查环境...${NC}"

command -v docker >/dev/null 2>&1 || { echo -e "${RED}请先安装 Docker${NC}"; exit 1; }
command -v docker compose >/dev/null 2>&1 || { echo -e "${RED}请安装 Docker Compose v2${NC}"; exit 1; }

echo -e "${GREEN}  Docker $(docker --version | cut -d' ' -f3 | cut -d',' -f1) ✓${NC}"

# ---- 2. Prepare config ----
echo -e "${YELLOW}[2/5] 准备配置...${NC}"

if [ ! -f .env ]; then
    if [ -f .env.production ]; then
        cp .env.production .env
        # Auto-generate secrets
        JWT_SECRET=$(openssl rand -hex 32)
        PG_PASSWORD=$(openssl rand -hex 16)
        sed -i "s/JWT_SECRET=.*/JWT_SECRET=$JWT_SECRET/" .env
        sed -i "s/POSTGRES_PASSWORD=.*/POSTGRES_PASSWORD=$PG_PASSWORD/" .env
        echo -e "${GREEN}  已生成 .env (JWT密钥+数据库密码已自动生成)${NC}"
        echo -e "${YELLOW}  请编辑 .env 填入 LLM_API_KEY${NC}"
    else
        echo -e "${RED}  缺少 .env.production 模板文件${NC}"
        exit 1
    fi
fi

source .env

# Validate required vars
if [ "$MODE" = "cloud" ]; then
    COMPOSE_FILE="docker-compose.cloud.yml"
    if [ "$JWT_SECRET" = "请修改为随机字符串（如 openssl rand -hex 32 的输出）" ]; then
        echo -e "${RED}错误: 请先编辑 .env 中的 JWT_SECRET${NC}"
        exit 1
    fi
    if [ "$POSTGRES_PASSWORD" = "请修改为强密码（如 openssl rand -hex 16 的输出）" ]; then
        echo -e "${RED}错误: 请先编辑 .env 中的 POSTGRES_PASSWORD${NC}"
        exit 1
    fi
else
    COMPOSE_FILE="docker-compose.prod.yml"
fi

# ---- 3. Build & start services ----
echo -e "${YELLOW}[3/5] 构建并启动服务...${NC}"

docker compose -f "$COMPOSE_FILE" up -d --build postgres redis
echo -e "${GREEN}  数据库和缓存已启动${NC}"

echo -e "  等待数据库就绪..."
sleep 5

# Run migrations
echo -e "${YELLOW}[4/5] 数据库迁移...${NC}"
docker compose -f "$COMPOSE_FILE" run --rm \
    -e DATABASE_URL="postgresql+asyncpg://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}" \
    -e DATABASE_URL_SYNC="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}" \
    backend alembic upgrade head || echo -e "${YELLOW}  (迁移命令执行完毕，查看上方输出确认结果)${NC}"
echo -e "${GREEN}  数据库迁移完成 ✓${NC}"

# ---- 5. Start all services ----
echo -e "${YELLOW}[5/5] 启动全部服务...${NC}"
docker compose -f "$COMPOSE_FILE" up -d --build

echo -e ""
echo -e "${GREEN}  ╔══════════════════════════════════════╗${NC}"
echo -e "${GREEN}  ║  部署完成!                          ║${NC}"
echo -e "${GREEN}  ║  访问: http://你的服务器IP           ║${NC}"
echo -e "${GREEN}  ╚══════════════════════════════════════╝${NC}"
echo -e ""
echo -e "  配置 SSL: ${YELLOW}./setup-ssl.sh your-domain.com${NC}"
echo -e "  查看日志: ${YELLOW}docker compose -f $COMPOSE_FILE logs -f${NC}"
echo -e "  停止服务: ${YELLOW}docker compose -f $COMPOSE_FILE down${NC}"
