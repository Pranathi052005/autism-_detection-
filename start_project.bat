@echo off
echo ========================================
echo   Autism Detection Project Startup
echo ========================================
echo.

echo [1/4] Checking Python virtual environment...
if not exist "venv\Scripts\activate.bat" (
    echo ❌ Virtual environment not found!
    echo Please run: python -m venv venv
    pause
    exit /b 1
)

echo [2/4] Activating virtual environment...
call venv\Scripts\activate.bat

echo [3/4] Installing dependencies...
pip install -r requirements.txt > nul 2>&1

echo [4/4] Starting servers...
echo.
echo 🚀 Starting Backend Server (http://localhost:8002)...
start "Backend Server" cmd /k "python -m uvicorn app.main:app --host 0.0.0.0 --port 8002 --reload"

echo 🚀 Starting Frontend Server (http://localhost:5173)...
start "Frontend Server" cmd /k "npm run dev"

echo.
echo ✅ Servers are starting up...
echo.
echo 📱 Frontend: http://localhost:5173
echo 🔧 Backend API: http://localhost:8002
echo 📚 API Docs: http://localhost:8002/docs
echo.
echo 💡 Press any key to open the application in your browser...
pause > nul

echo 🌐 Opening application...
start http://localhost:5173

echo.
echo 🎉 Project is ready! Close this window to stop all servers.
echo.
pause
