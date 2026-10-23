@echo off
echo ==============================================================================
echo GPS-Based Restricted Area Warning & Violation Detection System for Vehicles
echo SDM College of Engineering & Technology, Dharwad - Dept of CSE
echo Guide: Dr. S. B. Kulkarni
echo Team: Amogh S Patil, Aryan Shetty, Dharesh Dodmani, Neha B Hunshikatti
echo ==============================================================================

start "Django Daphne ASGI Backend" cmd /k "run_backend.bat"
timeout /t 3 /nobreak > nul
start "React Leaflet Frontend" cmd /k "run_frontend.bat"

echo System services launched!
echo Backend API & WebSockets: http://localhost:8000/api/
echo Security Dashboard & Driver HUD: http://localhost:5173/
