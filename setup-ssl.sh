#!/bin/bash
# ==============================================
#  MindWell SSL 证书配置脚本
#  用法: chmod +x setup-ssl.sh && ./setup-ssl.sh your-domain.com
# ==============================================
set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

if [ -z "$1" ]; then
    echo -e "${RED}用法: ./setup-ssl.sh <域名> [邮箱]${NC}"
    echo -e "  示例: ./setup-ssl.sh mindwell.example.com admin@example.com"
    exit 1
fi

DOMAIN=$1
EMAIL=${2:-"admin@$DOMAIN"}
SSL_DIR="./ssl"
CERTBOT_WWW="./certbot/www"

echo -e "${GREEN}"
echo "  ╔══════════════════════════════════════╗"
echo "  ║      MindWell SSL 证书配置            ║"
echo "  ║      域名: $DOMAIN                    ║"
echo "  ╚══════════════════════════════════════╝"
echo -e "${NC}"

# ---- 1. Create directories ----
mkdir -p "$SSL_DIR" "$CERTBOT_WWW"

# ---- 2. Check docker ----
command -v docker >/dev/null 2>&1 || { echo -e "${RED}请先安装 Docker${NC}"; exit 1; }

# ---- 3. Pull certbot image ----
# 如果配置了国内镜像源导致拉取失败，临时从 Docker Hub 直接拉:
#   docker pull docker.io/certbot/certbot:latest
CERTBOT_IMAGE="certbot/certbot:latest"
echo -e "${YELLOW}[1/4] 拉取 certbot 镜像...${NC}"
if ! docker pull "$CERTBOT_IMAGE" 2>/dev/null; then
    echo -e "${YELLOW}  默认源失败，尝试从 Docker Hub 直接拉取...${NC}"
    docker pull docker.io/certbot/certbot:latest || {
        echo -e "${RED}  certbot 镜像拉取失败。请检查 Docker 镜像源配置${NC}"
        echo -e "  或者手动: docker pull docker.io/certbot/certbot:latest"
        exit 1
    }
    CERTBOT_IMAGE="docker.io/certbot/certbot:latest"
fi

# ---- 4. Obtain certificate ----
echo -e "${YELLOW}[2/4] 申请 Let's Encrypt 证书...${NC}"
echo -e "  域名: $DOMAIN"

docker run --rm \
    -v "$(pwd)/$SSL_DIR:/etc/letsencrypt" \
    -v "$(pwd)/$CERTBOT_WWW:/var/www/certbot" \
    "$CERTBOT_IMAGE" \
    certonly --webroot \
    -w /var/www/certbot \
    -d "$DOMAIN" \
    --email "$EMAIL" \
    --agree-tos \
    --non-interactive

# ---- 5. Copy certs for nginx ----
echo -e "${YELLOW}[3/4] 配置证书...${NC}"

CERT_LIVE_DIR="$SSL_DIR/live/$DOMAIN"
if [ -f "$CERT_LIVE_DIR/fullchain.pem" ]; then
    cp "$CERT_LIVE_DIR/fullchain.pem" "$SSL_DIR/fullchain.pem"
    cp "$CERT_LIVE_DIR/privkey.pem" "$SSL_DIR/privkey.pem"
    chmod 600 "$SSL_DIR/privkey.pem"
    echo -e "${GREEN}  证书已复制到 $SSL_DIR/ ✓${NC}"
else
    echo -e "${RED}  证书获取失败，请检查域名 DNS 是否指向本服务器${NC}"
    exit 1
fi

# ---- 6. Done ----
echo -e "${YELLOW}[4/4] 完成!${NC}"

echo -e ""
echo -e "${GREEN}  ╔══════════════════════════════════════╗${NC}"
echo -e "${GREEN}  ║  SSL 证书配置完成!                   ║${NC}"
echo -e "${GREEN}  ║  证书将自动续期 (certbot 容器)        ║${NC}"
echo -e "${GREEN}  ╚══════════════════════════════════════╝${NC}"
echo -e ""
echo -e "  启动服务: ${YELLOW}docker compose -f docker-compose.cloud.yml up -d${NC}"
echo -e "  访问:     ${YELLOW}https://$DOMAIN${NC}"
