@echo off
chcp 65001 >nul
echo ========================================
echo Forever Client - Загрузка полной системы
echo ========================================
echo.

echo [1/5] Настройка Git...
git config --global user.name "GrivSGG"
git config --global user.email "your@email.com"

echo [2/5] Добавление всех файлов...
git add .

echo [3/5] Создание коммита...
git commit -m "Полная система: сайт + защита + админ-панель + личный кабинет"

echo [4/5] Настройка репозитория...
git remote remove origin 2>nul
git remote add origin https://github.com/GrivSGG/forever-Project.git
git branch -M main

echo [5/5] Загрузка на GitHub...
echo.
echo Сейчас откроется окно для ввода логина и пароля GitHub
echo.
git push -u origin main --force

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo [SUCCESS] Система успешно загружена!
    echo ========================================
    echo.
    echo Ваш сайт будет доступен через 1-2 минуты:
    echo https://GrivSGG.github.io/forever-Project/
    echo.
    echo Админ-панель:
    echo https://GrivSGG.github.io/forever-Project/admin/dashboard.html
    echo Логин: admin
    echo Пароль: Su6-N77-B6e-nWj
    echo.
    echo Личный кабинет:
    echo https://GrivSGG.github.io/forever-Project/dashboard.html
    echo.
    echo Не забудьте:
    echo 1. Включить GitHub Pages в настройках репозитория
    echo 2. Добавить свои контакты Discord/Telegram
    echo 3. Добавить изображения в папку assets
    echo.
) else (
    echo.
    echo [ERROR] Ошибка при загрузке!
    echo Проверьте логин и пароль GitHub
    echo.
)

pause
