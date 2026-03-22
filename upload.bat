@echo off
echo ========================================
echo Forever Client - Upload to GitHub
echo ========================================
echo.

REM Проверяем установлен ли git
where git >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Git не установлен!
    echo.
    echo Скачай и установи Git:
    echo https://git-scm.com/download/win
    echo.
    echo После установки перезапусти этот файл.
    pause
    exit /b 1
)

echo [1/5] Инициализация Git...
git init

echo [2/5] Добавление файлов...
git add .

echo [3/5] Создание коммита...
git commit -m "Initial commit: Forever Client website"

echo [4/5] Настройка удаленного репозитория...
echo.
echo ВАЖНО: Замени Gn1u5GG на свой GitHub username!
echo Твой репозиторий: https://github.com/Gn1u5GG/forever-Project.git
echo.
set /p username="Введи свой GitHub username: "

git branch -M main
git remote add origin https://github.com/%username%/forever-Project.git

echo [5/5] Загрузка на GitHub...
echo.
echo Сейчас откроется окно для ввода логина и пароля GitHub
echo (или Personal Access Token)
echo.
git push -u origin main

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo [SUCCESS] Файлы успешно загружены!
    echo ========================================
    echo.
    echo Теперь:
    echo 1. Зайди на https://github.com/%username%/forever-Project
    echo 2. Нажми Settings
    echo 3. Найди Pages в левом меню
    echo 4. В Source выбери "main" и нажми Save
    echo 5. Подожди 1-2 минуты
    echo.
    echo Твой сайт будет доступен по адресу:
    echo https://%username%.github.io/forever-Project/
    echo.
) else (
    echo.
    echo [ERROR] Ошибка при загрузке!
    echo Проверь:
    echo - Правильно ли введен username
    echo - Есть ли доступ к интернету
    echo - Правильно ли введен пароль/token
    echo.
)

pause
