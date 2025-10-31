@echo off
echo ====================================
echo GIDAS Explorer - Installation
echo ====================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python er ikke installeret eller ikke i PATH!
    echo Download Python fra https://www.python.org/downloads/
    pause
    exit /b 1
)

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js er ikke installeret eller ikke i PATH!
    echo Download Node.js fra https://nodejs.org/
    pause
    exit /b 1
)

echo [1/4] Opretter Python virtual environment...
python -m venv venv
if errorlevel 1 (
    echo ERROR: Kunne ikke oprette virtual environment!
    pause
    exit /b 1
)

echo [2/4] Aktiverer virtual environment og installerer Python dependencies...
call venv\Scripts\activate.bat
pip install -r requirements.txt
if errorlevel 1 (
    echo ERROR: Kunne ikke installere Python dependencies!
    pause
    exit /b 1
)

echo [3/4] Installerer frontend dependencies...
cd frontend
call npm install
if errorlevel 1 (
    echo ERROR: Kunne ikke installere Node.js dependencies!
    cd ..
    pause
    exit /b 1
)
cd ..

echo [4/4] Tjekker .env fil...
if not exist backend\.env (
    echo.
    echo ADVARSEL: .env fil findes ikke i backend mappen!
    echo Du skal oprette backend\.env med dine database credentials.
    echo.
    echo Eksempel:
    echo DATABASE_URL=mssql+pyodbc://username:password@server/database?driver=ODBC+Driver+17+for+SQL+Server
    echo API_HOST=0.0.0.0
    echo API_PORT=8000
    echo.
)

echo.
echo ====================================
echo Installation komplet!
echo ====================================
echo.
echo Naeste skridt:
echo 1. Opret backend\.env fil med dine database credentials
echo 2. Koer start.bat for at starte applikationen
echo.
pause
