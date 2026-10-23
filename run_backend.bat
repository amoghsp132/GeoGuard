@echo off
echo Starting Django Daphne ASGI Server (Port 8000)...
cd backend
..\venv\Scripts\daphne.exe -b 127.0.0.1 -p 8000 core_backend.asgi:application
