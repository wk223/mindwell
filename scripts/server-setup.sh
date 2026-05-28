#!/bin/bash
# ==============================================
#  MindWell — 腾讯云服务器初始化脚本
#  适用: Ubuntu 24.04, 2C2G
#  用法: ssh 登录服务器后运行:
#        bash <(curl -sSL https://...)  或
#        chmod +x server-setup.sh && sudo bash server-setup.sh
# ==============================================
set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

# Must be root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}请用 root 运行: sudo bash server-setup.sh${NC}"
    exit 1
fi

echo -e "${GREEN}"
echo "  ╔══════════════════════════════════════╗"
echo "  ║   MindWell 服务器初始化              ║"
echo "  ║   Ubuntu 24.04 / 2C2G               ║"
echo "  ╚══════════════════════════════════════╝"
echo -e "${NC}"

# ---- 1. Swap (4GB for 2GB RAM server) ----
echo -e "${YELLOW}[1/7] 配置 Swap (4GB)...${NC}"
if swapon --show | grep -q swapfile; then
    echo -e "${GREEN}  Swap 已存在，跳过${NC}"
else
    fallocate -l 4G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
    echo -e "${GREEN}  Swap 4GB 已创建${NC}"
fi
# Optimize: less aggressive swapping
sysctl vm.swappiness=10
echo 'vm.swappiness=10' >> /etc/sysctl.d/99-mindwell.conf
echo 'vm.vfs_cache_pressure=50' >> /etc/sysctl.d/99-mindwell.conf

# ---- 2. System packages ----
echo -e "${YELLOW}[2/7] 更新系统 & 安装基础包...${NC}"
apt-get update -qq && apt-get upgrade -y -qq
apt-get install -y -qq curl wget git ufw fail2ban htop net-tools ca-certificates gnupg lsb-release

# ---- 3. Docker CE ----
echo -e "${YELLOW}[3/7] 安装 Docker CE...${NC}"
if command -v docker &>/dev/null; then
    echo -e "${GREEN}  Docker 已安装: $(docker --version)${NC}"
else
    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    chmod a+r /etc/apt/keyrings/docker.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" > /etc/apt/sources.list.d/docker.list
    apt-get update -qq
    apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    echo -e "${GREEN}  Docker CE 安装完成${NC}"
fi

# ---- 4. Docker daemon config (log rotation, save disk) ----
echo -e "${YELLOW}[4/7] 配置 Docker 守护进程...${NC}"
mkdir -p /etc/docker
cat > /etc/docker/daemon.json <<'DOCKEREOF'
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  },
  "storage-driver": "overlay2"
}
DOCKEREOF
systemctl restart docker
echo -e "${GREEN}  Docker 日志上限 10MB x 3${NC}"

# ---- 5. Firewall ----
echo -e "${YELLOW}[5/7] 配置防火墙 (UFW)...${NC}"
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw --force enable
echo -e "${GREEN}  防火墙已启用: SSH(22) HTTP(80) HTTPS(443)${NC}"

# ---- 6. fail2ban ----
echo -e "${YELLOW}[6/7] 配置 fail2ban...${NC}"
systemctl enable fail2ban --now
echo -e "${GREEN}  fail2ban 已启动${NC}"

# ---- 7. App directory ----
echo -e "${YELLOW}[7/7] 创建应用目录...${NC}"
mkdir -p /opt/mindwell
echo -e "${GREEN}  应用目录: /opt/mindwell${NC}"

# ---- Summary ----
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  服务器初始化完成!                     ${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "  内存: ${CYAN}$(free -m | awk '/Mem:/{print $2}') MB${NC}"
echo -e "  Swap: ${CYAN}$(swapon --show | awk 'NR>1{print $3}')${NC}"
echo -e "  Docker: ${CYAN}$(docker --version)${NC}"
echo -e "  磁盘: ${CYAN}$(df -h / | awk 'NR>1{print $2" 已用 "$3" 可用 "$4}')${NC}"
echo ""
echo -e "  ${YELLOW}下一步:${NC}"
echo -e "  1. 在本地运行: ${CYAN}bash scripts/deploy-cloud.sh${NC}"
echo -e "     (需要先配置 .env.production 里的服务器 IP)"
echo -e "  2. 或者把代码上传到 /opt/mindwell 后手动 docker compose up"
echo ""
echo -e "  ${YELLOW}本地到服务器的文件传输:${NC}"
echo -e "  ${CYAN}rsync -avz --exclude '__pycache__' --exclude 'node_modules' \\"
echo -e "        --exclude '.git' --exclude '*.pyc' \\"
echo -e "        ./ user@你的服务器IP:/opt/mindwell/${NC}"
