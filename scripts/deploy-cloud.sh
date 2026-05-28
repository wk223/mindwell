#!/bin/bash
# ==============================================
#  MindWell — 云服务器一键部署
#  用法:
#    1. 先配置 .env.production (填好密钥 + API Key)
#    2. bash scripts/deploy-cloud.sh
#
#  部署方式:
#    方式A (推荐): 本地构建镜像 → rsync 到服务器 → 启动
#    方式B: 代码上传服务器后，在服务器上构建
# ==============================================
set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_DIR"

echo -e "${GREEN}"
echo "  ╔══════════════════════════════════════╗"
echo "  ║   MindWell 云服务器部署              ║"
echo "  ║   LLM: DeepSeek API (云端)          ║"
echo "  ╚══════════════════════════════════════╝"
echo -e "${NC}"

# ---- 读取配置 ----
ENV_FILE=".env"
if [ ! -f "$ENV_FILE" ]; then
    if [ -f .env.production ]; then
        echo -e "${YELLOW}未找到 .env，从 .env.production 生成...${NC}"
        cp .env.production .env

        # 自动生成 JWT Secret
        JWT_SECRET=$(openssl rand -hex 32 2>/dev/null || python3 -c "import secrets;print(secrets.token_hex(32))")
        if [ "$(uname)" = "Darwin" ]; then
            sed -i '' "s/JWT_SECRET=.*/JWT_SECRET=$JWT_SECRET/" .env
        else
            sed -i "s/JWT_SECRET=.*/JWT_SECRET=$JWT_SECRET/" .env
        fi
        echo -e "${GREEN}  JWT_SECRET 已自动生成${NC}"
    else
        echo -e "${RED}缺少 .env.production 文件${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}.env 已存在${NC}"
fi

# Load env vars
set -a; source .env; set +a

# ---- 检查必要配置 ----
echo -e "${YELLOW}检查配置...${NC}"

MISSING=""
[ -z "$LLM_API_KEY" ] || [ "$LLM_API_KEY" = "你的DeepSeek-API-Key" ] && MISSING="$MISSING  LLM_API_KEY (DeepSeek API Key)"
[ -z "$POSTGRES_PASSWORD" ] || [ "$POSTGRES_PASSWORD" = "请修改为强密码" ] && MISSING="$MISSING  POSTGRES_PASSWORD"
[ -z "$JWT_SECRET" ] || [ "$JWT_SECRET" = "请修改为随机字符串" ] && MISSING="$MISSING  JWT_SECRET"

if [ -n "$MISSING" ]; then
    echo -e "${RED}以下配置需要填写 (编辑 .env):${NC}"
    echo "$MISSING"
    echo ""
    echo -e "  DeepSeek API Key 获取: ${CYAN}https://platform.deepseek.com/api_keys${NC}"
    exit 1
fi

echo -e "${GREEN}  配置检查通过 ✓${NC}"
echo -e "  LLM: ${CYAN}$LLM_MODEL${NC}"
echo -e "  API: ${CYAN}$LLM_BASE_URL${NC}"

# ---- 选择部署方式 ----
echo ""
echo -e "${YELLOW}部署方式:${NC}"
echo "  [1] 本地构建镜像 + 启动 (本地开发测试)"
echo "  [2] 服务器远程部署 (需要 SSH 访问)"

SERVER_IP=${SERVER_IP:-}
if [ -z "$SERVER_IP" ]; then
    read -p "服务器 IP (方式1可跳过): " SERVER_IP
fi

if [ -n "$SERVER_IP" ]; then
    DEPLOY_MODE="remote"
    SERVER_USER="${SERVER_USER:-root}"
    SERVER_PATH="${SERVER_PATH:-/opt/mindwell}"
    echo -e "  目标: ${CYAN}$SERVER_USER@$SERVER_IP:$SERVER_PATH${NC}"
    echo ""
    read -p "开始部署? (y/N): " confirm
    [ "$confirm" != "y" ] && [ "$confirm" != "Y" ] && exit 0
else
    DEPLOY_MODE="local"
    echo -e "  本地部署模式"
fi

# ---- 拉取最新代码 (local mode = already local) ----

# ---- 准备工作 ----
mkdir -p backups

# ---- 部署 ----
if [ "$DEPLOY_MODE" = "remote" ]; then
    echo -e "${YELLOW}[1/4] 同步代码到服务器...${NC}"
    rsync -avz --delete \
        --exclude '__pycache__' --exclude '*.pyc' \
        --exclude 'node_modules' --exclude '.git' \
        --exclude '*.db' --exclude 'backups/' \
        -e "ssh -o StrictHostKeyChecking=no" \
        ./ "$SERVER_USER@$SERVER_IP:$SERVER_PATH/"
    echo -e "${GREEN}  代码同步完成 ✓${NC}"

    echo -e "${YELLOW}[2/4] 在服务器上构建镜像...${NC}"
    ssh "$SERVER_USER@$SERVER_IP" "cd $SERVER_PATH && docker compose -f docker-compose.cloud.yml build --parallel"

    echo -e "${YELLOW}[3/4] 启动服务...${NC}"
    ssh "$SERVER_USER@$SERVER_IP" "cd $SERVER_PATH && docker compose -f docker-compose.cloud.yml up -d"

    echo -e "${YELLOW}[4/4] 初始化数据库...${NC}"
    ssh "$SERVER_USER@$SERVER_IP" "cd $SERVER_PATH && docker compose -f docker-compose.cloud.yml exec -T backend python -m app.db.init_db || echo '已初始化，跳过'"

    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}  部署完成!                            ${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo -e "  访问: ${CYAN}http://$SERVER_IP${NC}"
    echo -e "  查看日志: ${CYAN}ssh $SERVER_USER@$SERVER_IP 'cd $SERVER_PATH && docker compose -f docker-compose.cloud.yml logs -f'${NC}"
    echo -e "  停止: ${CYAN}ssh $SERVER_USER@$SERVER_IP 'cd $SERVER_PATH && docker compose -f docker-compose.cloud.yml down'${NC}"
else
    echo -e "${YELLOW}[1/3] 构建镜像...${NC}"
    docker compose -f docker-compose.cloud.yml build --parallel

    echo -e "${YELLOW}[2/3] 启动服务...${NC}"
    docker compose -f docker-compose.cloud.yml up -d

    echo -e "${YELLOW}[3/3] 初始化数据库...${NC}"
    docker compose -f docker-compose.cloud.yml exec -T backend python -m app.db.init_db || echo "已初始化，跳过"

    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}  本地部署完成!                        ${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo -e "  访问: ${CYAN}http://localhost${NC}"
    echo -e "  查看日志: ${CYAN}docker compose -f docker-compose.cloud.yml logs -f${NC}"
    echo -e "  停止: ${CYAN}docker compose -f docker-compose.cloud.yml down${NC}"
fi

echo ""
echo -e "${YELLOW}提示: 记得在腾讯云控制台开放 80 (HTTP) 和 443 (HTTPS) 端口${NC}"
echo -e "${YELLOW}HTTPS 稍后可以用 Certbot + Let's Encrypt 免费配置${NC}"
