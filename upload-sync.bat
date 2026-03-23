@echo off
chcp 65001 >nul
echo ========================================
echo Загрузка файлов синхронизации на GitHub
echo ========================================
echo.

cd /d "%~dp0"

echo Добавление файлов...
git add sync-system.js
git add helper/helper.js
git add СИНХРОНИЗАЦИЯ.md
git add ГОТОВО_СИНХРОНИЗАЦИЯ.md
git add upload-sync.bat

echo.
echo Создание коммита...
git commit -m "Добавлена система синхронизации через GitHub Gist API"

echo.
echo Отправка на GitHub...
git push origin main

echo.
echo ========================================
echo ✅ Готово! Файлы загружены на GitHub
echo ========================================
echo.
echo Теперь откройте сайт и настройте синхронизацию:
echo 1. Откройте https://grivsgg.github.io/forever-Project/
echo 2. Нажмите F12 (консоль)
echo 3. Выполните: await window.syncSystem.configure('ВАШ_ТОКЕН');
echo.
echo Инструкция: СИНХРОНИЗАЦИЯ.md
echo.
pause
