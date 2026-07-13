@echo off
cd /d "%~dp0"
echo Starting Levi's Analytics on http://localhost:3000
echo.
call npm run dev -- -p 3000
echo.
echo The development server stopped. Check the message above for details.
pause
