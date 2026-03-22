# Пошаговая инструкция по загрузке сайта на GitHub

## Шаг 1: Установи Git (если еще не установлен)

1. Скачай Git с https://git-scm.com/download/win
2. Установи с настройками по умолчанию
3. Перезапусти терминал

## Шаг 2: Создай репозиторий на GitHub

1. Зайди на https://github.com
2. Войди в свой аккаунт (или создай новый)
3. Нажми зеленую кнопку "New" (или "New repository")
4. Заполни:
   - Repository name: `forever-client`
   - Description: `Official website for Forever Client`
   - Public (обязательно!)
   - НЕ ставь галочки на "Add README" и другие файлы
5. Нажми "Create repository"

## Шаг 3: Загрузи файлы

Открой PowerShell или CMD в папке `forever-website` и выполни команды:

```bash
# Инициализируй git
git init

# Добавь все файлы
git add .

# Сделай первый коммит
git commit -m "Initial commit: Forever Client website"

# Переименуй ветку в main
git branch -M main

# Добавь удаленный репозиторий (замени YOUR_USERNAME на свой)
git remote add origin https://github.com/YOUR_USERNAME/forever-client.git

# Загрузи файлы
git push -u origin main
```

**ВАЖНО:** Замени `YOUR_USERNAME` на свой GitHub username!

Пример:
```bash
git remote add origin https://github.com/ihavi/forever-client.git
```

## Шаг 4: Включи GitHub Pages

1. Зайди в свой репозиторий на GitHub
2. Нажми "Settings" (вверху справа)
3. В левом меню найди "Pages"
4. В разделе "Source":
   - Branch: выбери `main`
   - Folder: оставь `/ (root)`
5. Нажми "Save"
6. Подожди 1-2 минуты

Твой сайт будет доступен по адресу:
```
https://YOUR_USERNAME.github.io/forever-client/
```

## Шаг 5: (Опционально) Добавь свой домен

### Бесплатный домен через Freenom:

1. Зайди на https://www.freenom.com
2. Найди свободный домен (например: `foreverclient.tk`, `foreverclient.ml`)
3. Нажми "Get it now!" и "Checkout"
4. Выбери период: 12 Months @ FREE
5. Зарегистрируйся и подтверди email
6. В "My Domains" → "Manage Domain" → "Management Tools" → "Nameservers"
7. Выбери "Use custom nameservers" и добавь:
   ```
   ns1.github.com
   ns2.github.com
   ns3.github.com
   ns4.github.com
   ```
8. В настройках GitHub Pages добавь свой домен в поле "Custom domain"
9. Подожди 24 часа для распространения DNS

### Альтернатива - используй поддомен GitHub:
Твой сайт уже доступен по адресу: `YOUR_USERNAME.github.io/forever-client`

## Как обновить сайт

Когда захочешь изменить сайт:

1. Измени файлы (index.html, style.css, script.js)
2. Открой терминал в папке `forever-website`
3. Выполни:
```bash
git add .
git commit -m "Описание изменений"
git push
```

Изменения появятся на сайте через 1-2 минуты.

## Полезные команды Git

```bash
# Проверить статус
git status

# Посмотреть историю
git log

# Отменить изменения
git checkout -- filename

# Клонировать репозиторий на другой компьютер
git clone https://github.com/YOUR_USERNAME/forever-client.git
```

## Что дальше?

### Добавь скриншоты:
1. Создай папку `images` в `forever-website`
2. Добавь туда скриншоты: `screenshot1.png`, `screenshot2.png`, `screenshot3.png`
3. В `index.html` замени `.screenshot-placeholder` на:
```html
<img src="images/screenshot1.png" alt="Forever Client ClickGUI">
```

### Добавь ссылку на скачивание:
1. Создай Release на GitHub с файлом чита
2. Скопируй ссылку на файл
3. В `index.html` замени `href="#"` на реальную ссылку

### Добавь Discord сервер:
1. Создай Discord сервер
2. Создай приглашение без срока действия
3. В `index.html` замени ссылку Discord

## Проблемы?

### Git не найден
- Установи Git: https://git-scm.com/download/win
- Перезапусти терминал

### Permission denied
- Проверь что ты залогинен в GitHub
- Используй Personal Access Token вместо пароля

### Сайт не обновляется
- Подожди 2-3 минуты
- Очисти кэш браузера (Ctrl+F5)
- Проверь что GitHub Pages включен в настройках

## Контакты

Если нужна помощь - пиши!
