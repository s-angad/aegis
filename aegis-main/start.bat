@echo off
echo ============================================================
echo  AEGIS AI -- Autonomous Disaster Command Center
echo  Starting backend + frontend...
echo ============================================================

:: Start backend in new window
start "AEGIS Backend" cmd /k "cd /d %~dp0backend && python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"

:: Wait 3 seconds for backend to start
timeout /t 3 /nobreak >nul

:: Start frontend in new window
start "AEGIS Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo  Backend:  http://localhost:8000
echo  Frontend: http://localhost:3000
echo  API Docs: http://localhost:8000/docs
echo.
echo  Open http://localhost:3000 in your browser
echo  Then click "INITIALIZE FLOOD RESPONSE SIMULATION"
echo ============================================================
pause
