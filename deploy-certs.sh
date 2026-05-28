#!/bin/bash
# ==============================================
#  MindWell SSL 证书部署脚本
#  用法:
#    1. 先将证书文件 scp 到服务器:
#       scp fullchain.pem ubuntu@your-server:~/mindwell/ssl/
#       scp privkey.pem  ubuntu@your-server:~/mindwell/ssl/
#    2. 在服务器上运行:
#       chmod +x deploy-certs.sh && ./deploy-certs.sh
# ==============================================
set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

COMPOSE_FILE="docker-compose.cloud.yml"

echo -e "${GREEN}=== MindWell SSL 证书部署 ===${NC}"

# ---- 1. Check cert files exist ----
echo -e "${YELLOW}[1/4] 检查证书文件...${NC}"

if [ ! -f ssl/fullchain.pem ]; then
    echo -e "${RED}错误: ssl/fullchain.pem 未找到${NC}"
    echo "请先 scp 证书文件到 ~/mindwell/ssl/"
    exit 1
fi

if [ ! -f ssl/privkey.pem ]; then
    echo -e "${RED}错误: ssl/privkey.pem 未找到${NC}"
    echo "请先 scp 私钥文件到 ~/mindwell/ssl/"
    exit 1
fi

FULLCHAIN_SIZE=$(wc -c < ssl/fullchain.pem)
PRIVKEY_SIZE=$(wc -c < ssl/privkey.pem)

if [ "$FULLCHAIN_SIZE" -lt 100 ]; then
    echo -e "${RED}错误: fullchain.pem 内容过短 (${FULLCHAIN_SIZE} bytes)${NC}"
    exit 1
fi

if [ "$PRIVKEY_SIZE" -lt 100 ]; then
    echo -e "${RED}错误: privkey.pem 内容过短 (${PRIVKEY_SIZE} bytes)${NC}"
    exit 1
fi

echo -e "${GREEN}  fullchain.pem: ${FULLCHAIN_SIZE} bytes ✓${NC}"
echo -e "${GREEN}  privkey.pem:   ${PRIVKEY_SIZE} bytes ✓${NC}"

# ---- 2. Set permissions ----
echo -e "${YELLOW}[2/4] 设置权限...${NC}"
chmod 644 ssl/fullchain.pem
chmod 600 ssl/privkey.pem
echo -e "${GREEN}  权限设置完成 ✓${NC}"

# ---- 3. Restart frontend ----
echo -e "${YELLOW}[3/4] 重启前端容器...${NC}"
sudo docker compose -f "$COMPOSE_FILE" up -d --force-recreate frontend
echo -e "${GREEN}  前端已重启 ✓${NC}"

# ---- 4. Verify ----
echo -e "${YELLOW}[4/4] 等待健康检查...${NC}"
sleep 5

if sudo docker compose -f "$COMPOSE_FILE" ps frontend | grep -q "Up"; then
    echo -e "${GREEN}  前端容器运行正常 ✓${NC}"
else
    echo -e "${RED}  前端容器可能异常，请检查日志${NC}"
    sudo docker compose -f "$COMPOSE_FILE" logs --tail=20 frontend
    exit 1
fi

echo ""
echo -e "${GREEN}  ╔══════════════════════════════════════╗${NC}"
echo -e "${GREEN}  ║  SSL 证书部署完成!                  ║${NC}"
echo -e "${GREEN}  ║  访问: https://你的域名              ║${NC}"
echo -e "${GREEN}  ╚══════════════════════════════════════╝${NC}"
echo ""
echo -e "  证书到期时间:"
openssl x509 -in ssl/fullchain.pem -noout -enddate 2>/dev/null || echo "  (无法解析证书日期)"
