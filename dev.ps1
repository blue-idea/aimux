$env:WAILS_EXP_USE_WAKE = "1"

# 检查并释放 9245 端口残留进程（如果有）
$portProcess = Get-NetTCPConnection -LocalPort 9245 -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
if ($portProcess) {
    Stop-Process -Id $portProcess -Force -ErrorAction SilentlyContinue
    Start-Sleep -Milliseconds 500
}

wails3 dev
