@echo off
TITLE Project Launcher

:: 1. Run Python script in the root folder
echo Starting Python Backend...
start "Python App" cmd /k "python app.py"

:: 2. Run PHP Artisan Serve in backend folder
echo Starting Laravel Server...
start "Laravel Server" cmd /k "cd backend && php artisan serve"

:: 3. Run PHP Artisan Queue in backend folder
echo Starting Laravel Queue...
start "Laravel Queue" cmd /k "cd backend && php artisan queue:listen"

:: 4. Run NPM Dev in frontend folder
echo Starting Vite/Frontend...
start "Frontend Dev" cmd /k "cd frontend && npm run dev"

:: 5. Run Electron in frontend folder
:: We wait a few seconds to let the dev server start first
echo Waiting for dev server...
timeout /t 5
echo Starting Electron...
start "Electron" cmd /k "cd frontend && npm run electron"

echo All systems launching...
pause