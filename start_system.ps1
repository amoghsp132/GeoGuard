# Start both Backend and Frontend in separate powershell windows
Write-Host "Launching GPS-Based Restricted Area Warning & Violation Detection System..." -ForegroundColor Cyan

Start-Process powershell -ArgumentList "-NoExit", "-ExecutionPolicy", "Bypass", "-File", "$PSScriptRoot\run_backend.ps1"
Start-Sleep -Seconds 3
Start-Process powershell -ArgumentList "-NoExit", "-ExecutionPolicy", "Bypass", "-File", "$PSScriptRoot\run_frontend.ps1"

Write-Host "System launched!" -ForegroundColor Green
Write-Host "Dashboard: http://localhost:5173" -ForegroundColor Yellow
Write-Host "Backend API: http://localhost:8000/api/" -ForegroundColor Yellow
