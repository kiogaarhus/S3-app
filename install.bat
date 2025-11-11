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

echo [4/5] Tjekker backend .env fil...
if not exist .env (
    if exist .env.example (
        echo Kopierer .env.example til .env...
        copy .env.example .env
        echo.
        echo VIGTIGT: Tjek .env filen og opdater database credentials hvis noedvendigt!
        echo.
    ) else (
        echo.
        echo ADVARSEL: .env fil findes ikke!
        echo Du skal oprette .env med dine database credentials.
        echo.
        echo Eksempel:
        echo GIDAS_DB_URL=mssql+pyodbc://srvsql29/Envidan_Gidas_SpvPlanDyn?driver=ODBC+Driver+18+for+SQL+Server^&trusted_connection=yes^&TrustServerCertificate=yes
        echo.
    )
) else (
    echo Backend .env fil fundet - springer over.
)

echo [5/5] Tjekker frontend .env fil...
if not exist frontend\.env (
    if exist frontend\.env.example (
        echo Kopierer frontend\.env.example til frontend\.env...
        copy frontend\.env.example frontend\.env
        echo Frontend .env fil oprettet.
    ) else (
        echo.
        echo ADVARSEL: frontend\.env.example fil findes ikke!
        echo Frontend vil maaske ikke kunne forbinde til backend korrekt.
        echo.
    )
) else (
    echo Frontend .env fil fundet - springer over.
)

echo.
echo ====================================
echo Installation komplet!
echo ====================================
echo.
echo Naeste skridt:
echo 1. Tjek .env fil og opdater database credentials hvis noedvendigt
echo 2. Koer start.bat for at starte applikationen
echo.
pause
