#!/bin/bash
# MindWell 日志保存脚本
# 用法: ./save-logs.sh [days]
#   days: 导出最近 N 天日志 (默认 1)
set -e

DAYS=${1:-1}
LOG_DIR="${LOG_DIR:-/home/ubuntu/logs/mindwell}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
ARCHIVE="${LOG_DIR}/mindwell_${TIMESTAMP}.tar.gz"

mkdir -p "$LOG_DIR"

echo "[$(date)] 开始导出最近 ${DAYS} 天日志..."

# 导出各服务日志
for svc in backend frontend postgres redis ollama; do
    docker compose -f docker-compose.prod.yml logs --since "${DAYS}d" "$svc" > "${LOG_DIR}/${svc}_${TIMESTAMP}.log" 2>&1 || true
done

# 打包压缩
tar -czf "$ARCHIVE" -C "$LOG_DIR" ./*_${TIMESTAMP}.log
rm -f "$LOG_DIR"/*_${TIMESTAMP}.log

echo "[$(date)] 日志已保存: $ARCHIVE ($(du -h "$ARCHIVE" | cut -f1))"

# 清理旧日志（保留 30 天）
find "$LOG_DIR" -name "mindwell_*.tar.gz" -mtime +30 -delete
echo "[$(date)] 当前归档: $(ls "$LOG_DIR"/*.tar.gz 2>/dev/null | wc -l) 个文件"
