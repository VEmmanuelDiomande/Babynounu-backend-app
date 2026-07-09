# Script de redemarrage du backend BabyNounu
# Tue tous les processus sur le port du backend, puis le relance

$backendPort = $env:PORT
if (-not $backendPort) { $backendPort = "3000" }

Write-Host "`n=== Redemarrage du backend BabyNounu (port $backendPort) ===`n" -ForegroundColor Cyan

# 1. Trouver et tuer tous les processus sur le port
Write-Host "Recherche des processus sur le port $backendPort..." -ForegroundColor Yellow

$connections = Get-NetTCPConnection -LocalPort $backendPort -ErrorAction SilentlyContinue
if ($connections) {
    $pids = $connections | Select-Object -ExpandProperty OwningProcess -Unique
    foreach ($procId in $pids) {
        $process = Get-Process -Id $procId -ErrorAction SilentlyContinue
        if ($process) {
            Write-Host "  Kill du processus $($process.ProcessName) (PID: $procId)" -ForegroundColor Red
            Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
        }
    }
    Start-Sleep -Seconds 1
    Write-Host "Tous les processus sur le port $backendPort ont ete arretes.`n" -ForegroundColor Green
} else {
    Write-Host "Aucun processus trouve sur le port $backendPort.`n" -ForegroundColor Green
}

# 2. Relancer le backend
Write-Host "Demarrage du backend..." -ForegroundColor Yellow
npm run dev
