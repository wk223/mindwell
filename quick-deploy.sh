#!/bin/bash
# MindWell 智能部署 — 只重建有变更的服务
# 用法: ./deploy.sh

set -e
cd "$(dirname "$0")"

echo "=== 拉取最新代码 ==="
git pull origin master

# 检查哪些目录有变更
CHANGED=$(git diff --name-only HEAD~1 HEAD 2>/dev/null || echo "")

REBUILD_FRONTEND=false
REBUILD_BACKEND=false

if echo "$CHANGED" | grep -q "^frontend/"; then
    REBUILD_FRONTEND=true
fi
if echo "$CHANGED" | grep -q "^backend/"; then
    REBUILD_BACKEND=true
fi

# 如果 compose 文件或 Dockerfile 变了，也重建
if echo "$CHANGED" | grep -qE "docker-compose|Dockerfile"; then
    REBUILD_FRONTEND=true
    REBUILD_BACKEND=true
fi

echo ""
echo "=== 变更检测 ==="
echo "前端: $($REBUILD_FRONTEND && echo '🔨 需重建' || echo '✅ 跳过')"
echo "后端: $($REBUILD_BACKEND && echo '🔨 需重建' || echo '✅ 跳过')"
echo ""

BUILD_FLAGS=""
if $REBUILD_FRONTEND; then BUILD_FLAGS="$BUILD_FLAGS frontend"; fi
if $REBUILD_BACKEND; then BUILD_FLAGS="$BUILD_FLAGS backend"; fi

if [ -z "$BUILD_FLAGS" ]; then
    echo "✅ 无变更，仅重启..."
    docker compose -f docker-compose.prod.yml up -d
else
    echo "🔨 正在重建: $BUILD_FLAGS"
    docker compose -f docker-compose.prod.yml build $BUILD_FLAGS
    docker compose -f docker-compose.prod.yml up -d
fi

echo ""
echo "=== 状态 ==="
docker compose -f docker-compose.prod.yml ps --format "table {{.Name}}\t{{.Status}}"
