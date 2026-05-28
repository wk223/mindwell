#!/bin/bash
# ==============================================
#  MindWell 服务器初始化脚本 (首次部署前运行)
#  用法: chmod +x init-server.sh && ./init-server.sh
# ==============================================
set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}  ╔══════════════════════════════════════╗"
echo -e "  ║      MindWell 服务器初始化            ║"
echo -e "  ╚══════════════════════════════════════╝${NC}"

# ---- Install Docker (Ubuntu/Debian) ----
if ! command -v docker &> /dev/null; then
    echo -e "${YELLOW}[1/4] 安装 Docker...${NC}"
    curl -fsSL https://get.docker.com | bash
    systemctl enable docker
    echo -e "${GREEN}  Docker 安装完成 ✓${NC}"
else
    echo -e "${GREEN}[1/4] Docker 已安装 ✓${NC}"
fi

# ---- Create .env ----
echo -e "${YELLOW}[2/4] 生成配置文件...${NC}"
if [ ! -f .env ]; then
    cp .env.production .env
    JWT_SECRET=$(openssl rand -hex 32)
    PG_PASSWORD=$(openssl rand -hex 16)
    sed -i "s/JWT_SECRET=.*/JWT_SECRET=$JWT_SECRET/" .env
    sed -i "s/POSTGRES_PASSWORD=.*/POSTGRES_PASSWORD=$PG_PASSWORD/" .env
    echo -e "${GREEN}  .env 已生成 ✓${NC}"
    echo -e "${YELLOW}  ⚠ 请编辑 .env 填入 LLM_API_KEY 后重新运行 deploy.sh${NC}"
else
    echo -e "${GREEN}  .env 已存在 ✓${NC}"
fi

# ---- Create SSL dir (empty — nginx auto-detects and uses HTTP-only) ----
echo -e "${YELLOW}[3/4] 创建 SSL 目录...${NC}"
mkdir -p ssl certbot/www
echo -e "${GREEN}  SSL 目录已创建 (DNS 就绪后运行 ./setup-ssl.sh your-domain.com) ✓${NC}"

# ---- Set up firewall ----
echo -e "${YELLOW}[4/4] 配置防火墙...${NC}"
if command -v ufw &> /dev/null; then
    ufw allow 80/tcp  2>/dev/null || true
    ufw allow 443/tcp 2>/dev/null || true
    ufw allow 22/tcp  2>/dev/null || true
    echo -e "${GREEN}  防火墙规则已更新 (80, 443, 22) ✓${NC}"
elif command -v firewall-cmd &> /dev/null; then
    firewall-cmd --permanent --add-service=http  2>/dev/null || true
    firewall-cmd --permanent --add-service=https 2>/dev/null || true
    firewall-cmd --reload 2>/dev/null || true
    echo -e "${GREEN}  firewalld 规则已更新 ✓${NC}"
else
    echo -e "${YELLOW}  (跳过 — 未检测到 ufw/firewalld，请手动放行 80/443 端口)${NC}"
fi

echo ""
echo -e "${GREEN}  ╔══════════════════════════════════════╗${NC}"
echo -e "${GREEN}  ║  服务器初始化完成!                   ║${NC}"
echo -e "${GREEN}  ╚══════════════════════════════════════╝${NC}"
echo ""
echo -e "  下一步:"
echo -e "  1. 编辑 .env: ${YELLOW}vim .env${NC}  (填入 LLM_API_KEY)"
echo -e "  2. 启动服务: ${YELLOW}./deploy.sh${NC}"
echo -e "  3. DNS 就绪后: ${YELLOW}./setup-ssl.sh your-domain.com${NC}"
