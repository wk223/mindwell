#!/bin/bash
# ==============================================
#  MindWell — Pull free open-source LLM models
#  Usage: bash scripts/pull-model.sh
# ==============================================
set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  MindWell — Pull Free LLM Models${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Check Ollama
if ! command -v ollama &>/dev/null; then
    echo -e "${RED}[ERROR] Ollama not installed!${NC}"
    echo -e "${YELLOW}Install: curl -fsSL https://ollama.com/install.sh | sh${NC}"
    exit 1
fi
echo -e "${GREEN}[OK] Ollama installed${NC}"
echo ""

echo -e "${CYAN}Recommended models for Chinese mental health:${NC}"
echo "  1. qwen2.5:7b   — Qwen 7B (recommended, ~4.7GB, needs 8GB RAM)"
echo "  2. qwen2.5:14b  — Qwen 14B (stronger, ~8.5GB, needs 16GB RAM)"
echo "  3. deepseek-r1:8b — DeepSeek R1 (~4.9GB, needs 8GB RAM)"
echo "  4. glm4:9b       — ChatGLM (~5.5GB, needs 8GB RAM)"
echo "  5. All of above"
echo ""

read -p "Select model (1-5, default 1): " choice
choice=${choice:-1}

declare -A models=(
    [1]="qwen2.5:7b"
    [2]="qwen2.5:14b"
    [3]="deepseek-r1:8b"
    [4]="glm4:9b"
)

pull_model() {
    echo -e "${YELLOW}Pulling $1 ...${NC}"
    ollama pull "$1"
    echo -e "${GREEN}$1 ready!${NC}"
}

if [ "$choice" = "5" ]; then
    for m in "${models[@]}"; do
        pull_model "$m"
    done
elif [ -n "${models[$choice]}" ]; then
    pull_model "${models[$choice]}"
else
    echo -e "${RED}Invalid choice${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Models ready! Start backend:${NC}"
echo -e "${YELLOW}  cd backend && uvicorn app.main:app --reload${NC}"
echo -e "${GREEN}========================================${NC}"
