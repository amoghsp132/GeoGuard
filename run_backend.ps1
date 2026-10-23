# Run Daphne ASGI Server
Set-Location -Path "$PSScriptRoot\backend"
& "$PSScriptRoot\venv\Scripts\daphne.exe" -b 127.0.0.1 -p 8000 core_backend.asgi:application
