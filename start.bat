@echo off
echo ====================================
echo GIDAS Explorer - Starter system
echo ====================================
echo.

REM Check if virtual environment exists
if not exist venv\Scripts\activate.bat (
    echo ERROR: Virtual environment ikke fundet!
    echo Koer install.bat foerst for at installere systemet.
    pause
    exit /b 1
)

REM Check if .env exists
if not exist backend\.env (
    echo ADVARSEL: backend\.env fil findes ikke!
    echo Systemet kan ikke koere uden database konfiguration.
    echo.
    echo Opret backend\.env med dine database credentials:
    echo DATABASE_URL=mssql+pyodbc://username:password@server/database?driver=ODBC+Driver+17+for+SQL+Server
    echo API_HOST=0.0.0.0
    echo API_PORT=8000
    echo.
    pause
    exit /b 1
)

REM Check if frontend node_modules exists
if not exist frontend\node_modules (
    echo ERROR: Frontend dependencies ikke fundet!
    echo Koer install.bat foerst for at installere systemet.
    pause
    exit /b 1
)

echo Starter backend server...
echo Backend vil vaere tilgaengelig paa: http://localhost:8000
echo.

REM Start backend in new window
start "GIDAS Explorer - Backend" cmd /k "cd /d %~dp0 && call venv\Scripts\activate.bat && cd backend && uvicorn main:app --reload --port 8000"

REM Wait a bit for backend to start
timeout /t 5 /nobreak >nul

echo Starter frontend server...
echo Frontend vil vaere tilgaengelig paa: http://localhost:5173
echo.

REM Start frontend in new window
start "GIDAS Explorer - Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ====================================
echo Systemet starter op...
echo ====================================
echo.
echo Backend:  http://localhost:8000
echo Frontend: http://localhost:5173
echo API Docs: http://localhost:8000/docs
echo.
echo Luk dette vindue for at afslutte begge servere.
echo Eller luk de individuelle vinduer for at stoppe hver server.
echo.
echo Tryk Ctrl+C for at afslutte...
pause >nul
