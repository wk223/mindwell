#!/bin/bash
# MindWell 数据库备份脚本
# 用法: crontab -e 添加 0 3 * * * /home/ubuntu/mindwell/scripts/backup-db.sh
set -e

BACKUP_DIR="${BACKUP_DIR:-/home/ubuntu/backups/mindwell}"
RETENTION_DAYS="${RETENTION_DAYS:-7}"
CONTAINER="${CONTAINER:-mindwell-postgres-1}"
DB_USER="${DB_USER:-mindwell}"
DB_NAME="${DB_NAME:-mindwell}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/mindwell_${TIMESTAMP}.sql.gz"

mkdir -p "$BACKUP_DIR"

echo "[$(date)] Starting backup..."
docker exec "$CONTAINER" pg_dump -U "$DB_USER" "$DB_NAME" | gzip > "$BACKUP_FILE"

echo "[$(date)] Backup saved: $BACKUP_FILE ($(du -h "$BACKUP_FILE" | cut -f1))"

# 清理旧备份
find "$BACKUP_DIR" -name "mindwell_*.sql.gz" -mtime "+${RETENTION_DAYS}" -delete
echo "[$(date)] Cleaned backups older than ${RETENTION_DAYS} days"
echo "[$(date)] Current backups: $(ls "$BACKUP_DIR" | wc -l) files"
