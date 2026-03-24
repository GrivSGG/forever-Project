@echo off
chcp 65001 >nul
echo ========================================
echo Firebase интеграция - загрузка на GitHub
echo ========================================
echo.

cd /d "%~dp0"

echo [1/4] Добавление файлов...
git add .

echo [2/4] Создание коммита...
git commit -m "Firebase интеграция - автоматическая синхронизация"

echo [3/4] Отправка на GitHub...
git push origin main

echo [4/4] Готово!
echo.
echo ========================================
echo ✅ Файлы загружены на GitHub!
echo ========================================
echo.
echo Подождите 1-2 минуты для обновления сайта
echo.
echo Сайт: https://grivsgg.github.io/forever-Project/
echo Helper: https://grivsgg.github.io/forever-Project/helper/dashboard.html
echo.
echo ВАЖНО: Настройте правила Firestore!
echo Откройте: FIRESTORE_RULES.txt
echo.
pause
