@echo off
title SHIELD AI — Server
color 0A
echo.
echo  ====================================
echo   SHIELD AI — Starting Server...
echo  ====================================
echo.

:: Kill anything already on port 5000
echo [1/3] Freeing port 5000...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5000 "') do (
    taskkill /PID %%a /F >nul 2>&1
)
timeout /t 1 /nobreak >nul

:: Start the server
echo [2/3] Starting server...
cd /d "%~dp0"
start "SHIELD AI Server" cmd /k "npm start"
timeout /t 4 /nobreak >nul

:: Open the browser
echo [3/3] Opening browser...
start "" "http://localhost:5000"

echo.
echo  Server is running at http://localhost:5000
echo  Close the "SHIELD AI Server" window to stop.
echo.
pause
