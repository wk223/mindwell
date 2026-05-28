#!/bin/bash
# ==============================================
#  MindWell 数据库恢复脚本
#  用法:
#    ./restore.sh                    # 自动选择最新备份
#    ./restore.sh backups/mindwell_20260526_030000.sql.gz  # 指定备份文件
# ==============================================
set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

COMPOSE_FILE="docker-compose.cloud.yml"
BACKUP_DIR="./backups"

echo -e "${GREEN}  ╔══════════════════════════════════════╗"
echo -e "  ║      MindWell 数据库恢复              ║"
echo -e "  ╚══════════════════════════════════════╝${NC}"

# ---- Source env ----
if [ -f .env ]; then
    source .env
else
    echo -e "${RED}缺少 .env 文件${NC}"
    exit 1
fi

# ---- Determine backup file ----
if [ -z "$1" ]; then
    if [ ! -d "$BACKUP_DIR" ]; then
        echo -e "${RED}备份目录 $BACKUP_DIR 不存在${NC}"
        exit 1
    fi
    BACKUP_FILE=$(ls -1t "$BACKUP_DIR"/*.sql.gz 2>/dev/null | head -1)
    if [ -z "$BACKUP_FILE" ]; then
        echo -e "${RED}没有找到备份文件${NC}"
        exit 1
    fi
    echo -e "${YELLOW}自动选择最新备份: $(basename "$BACKUP_FILE")${NC}"
else
    BACKUP_FILE="$1"
fi

if [ ! -f "$BACKUP_FILE" ]; then
    echo -e "${RED}备份文件不存在: $BACKUP_FILE${NC}"
    exit 1
fi

# ---- Confirm ----
echo -e ""
echo -e "${RED}⚠ 警告: 此操作将覆盖当前数据库!${NC}"
echo -e "  备份文件: ${YELLOW}$BACKUP_FILE${NC}"
echo -e "  数据库:   ${YELLOW}${POSTGRES_DB:-mindwell}@postgres:5432${NC}"
echo -e ""
read -rp "  确认恢复? (输入 yes 继续): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "  已取消"
    exit 0
fi

# ---- Verify postgres is running ----
if ! docker compose -f "$COMPOSE_FILE" ps postgres 2>/dev/null | grep -q "Up"; then
    echo -e "${RED}PostgreSQL 容器未运行，请先启动服务${NC}"
    exit 1
fi

# ---- Drop and recreate ----
echo -e "${YELLOW}[1/3] 断开数据库连接...${NC}"
docker compose -f "$COMPOSE_FILE" exec -T postgres psql -U "${POSTGRES_USER:-mindwell}" -c "
    SELECT pg_terminate_backend(pg_stat_activity.pid)
    FROM pg_stat_activity
    WHERE pg_stat_activity.datname = '${POSTGRES_DB:-mindwell}'
      AND pid <> pg_backend_pid();
" 2>/dev/null || true

echo -e "${YELLOW}[2/3] 删除并重建数据库...${NC}"
docker compose -f "$COMPOSE_FILE" exec -T postgres psql -U "${POSTGRES_USER:-mindwell}" -c "
    DROP DATABASE IF EXISTS \"${POSTGRES_DB:-mindwell}\";
    CREATE DATABASE \"${POSTGRES_DB:-mindwell}\" OWNER \"${POSTGRES_USER:-mindwell}\";
"

# ---- Restore ----
echo -e "${YELLOW}[3/3] 恢复数据...${NC}"
gunzip -c "$BACKUP_FILE" | docker compose -f "$COMPOSE_FILE" exec -T postgres psql -U "${POSTGRES_USER:-mindwell}" -d "${POSTGRES_DB:-mindwell}" 2>&1 | tail -5

echo -e ""
echo -e "${GREEN}  ╔══════════════════════════════════════╗${NC}"
echo -e "${GREEN}  ║  数据恢复完成!                       ║${NC}"
echo -e "${GREEN}  ╚══════════════════════════════════════╝${NC}"
echo -e ""
echo -e "  重启后端以重新建立连接: ${YELLOW}docker compose -f $COMPOSE_FILE restart backend${NC}"
