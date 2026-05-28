# ==============================================
#  MindWell — 拉取免费大模型 (PowerShell)
#  用法: .\scripts\pull-model.ps1
# ==============================================
Write-Host "========================================" -ForegroundColor Green
Write-Host "  MindWell — 拉取免费开源大模型" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# Check Ollama
$ollama = Get-Command ollama -ErrorAction SilentlyContinue
if (-not $ollama) {
    Write-Host "[ERROR] Ollama 未安装!" -ForegroundColor Red
    Write-Host "请先下载安装: https://ollama.com/download/windows" -ForegroundColor Yellow
    exit 1
}
Write-Host "[OK] Ollama 已安装" -ForegroundColor Green
Write-Host ""

# Model selection
Write-Host "推荐中文心理支持模型:" -ForegroundColor Cyan
Write-Host "  1. qwen2.5:7b   — 通义千问 7B (推荐首选, ~4.7GB, 需8GB RAM)"
Write-Host "  2. qwen2.5:14b  — 通义千问 14B (更强, ~8.5GB, 需16GB RAM)"
Write-Host "  3. deepseek-r1:8b — DeepSeek推理增强 (~4.9GB, 需8GB RAM)"
Write-Host "  4. glm4:9b       — 智谱ChatGLM (~5.5GB, 需8GB RAM)"
Write-Host "  5. 全部下载"
Write-Host ""

$choice = Read-Host "选择模型 (1-5, 默认1)"
if (-not $choice) { $choice = "1" }

$models = @{
    "1" = "qwen2.5:7b"
    "2" = "qwen2.5:14b"
    "3" = "deepseek-r1:8b"
    "4" = "glm4:9b"
}

if ($choice -eq "5") {
    foreach ($m in $models.Values) {
        Write-Host "正在拉取 $m ..." -ForegroundColor Yellow
        ollama pull $m
        Write-Host "$m 下载完成!" -ForegroundColor Green
    }
} elseif ($models.ContainsKey($choice)) {
    $model = $models[$choice]
    Write-Host "正在拉取 $model ..." -ForegroundColor Yellow
    ollama pull $model
    Write-Host "$model 下载完成!" -ForegroundColor Green
} else {
    Write-Host "无效选择" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  模型就绪! 运行:" -ForegroundColor Green
Write-Host "    cd backend && uvicorn app.main:app --reload" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Green
