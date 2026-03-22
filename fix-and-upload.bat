@echo off
chcp 65001 >nul
echo ========================================
echo Forever Client - Исправление и загрузка
echo ========================================
echo.

echo [1/6] Настройка Git...
git config --global user.email "your@email.com"
git config --global user.name "Gn1u5GG"

echo [2/6] Добавление файлов...
git add .

echo [3/6] Создание коммита...
git commit -m "Initial commit: Forever Client website"

echo [4/6] Переименование ветки...
git branch -M main

echo [5/6] Проверка удаленного репозитория...
git remote remove origin 2>nul
git remote add origin https://github.com/Gn1u5GG/forever-Project.git

echo [6/6] Загрузка на GitHub...
echo.
echo Сейчас откроется окно для ввода логина и пароля GitHub
echo.
git push -u origin main

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo [SUCCESS] Файлы успешно загружены!
    echo ========================================
    echo.
    echo Теперь:
    echo 1. Зайди на https://github.com/Gn1u5GG/forever-Project
    echo 2. Нажми Settings
    echo 3. Найди Pages в левом меню
    echo 4. В Source выбери "main" и нажми Save
    echo.
    echo Твой сайт будет доступен по адресу:
    echo https://Gn1u5GG.github.io/forever-Project/
    echo.
) else (
    echo.
    echo [ERROR] Ошибка при загрузке!
    echo.
)

pause
