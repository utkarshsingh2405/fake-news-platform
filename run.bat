@echo off
echo Starting Fake News Detection Platform...

:: Start backend
start "Backend Server" cmd /k "cd backend && venv\Scripts\activate.bat && uvicorn app.main:app --reload"

:: Wait a few seconds for backend to initialize
timeout /t 5 /nobreak > nul

:: Start frontend
start "Frontend Server" cmd /k "cd frontend && npm run dev"

echo Both servers are starting.
echo Backend: http://localhost:8000
echo Frontend: http://localhost:5173
echo.
echo Close the two command windows to stop the servers.