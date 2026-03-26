# 🔥 СРОЧНО: Исправление Firebase Rules

## Проблема
Helper панель показывает белый экран с ошибкой "Missing or insufficient permissions"

## Причина
Firebase Firestore Rules блокируют доступ к данным

## Решение (5 минут)

### Шаг 1: Откройте Firebase Console
1. Перейдите: https://console.firebase.google.com/
2. Выберите проект "forever-client"
3. В левом меню найдите "Firestore Database"
4. Нажмите на вкладку "Rules" (Правила)

### Шаг 2: Замените правила
Удалите все что там есть и вставьте это:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

### Шаг 3: Опубликуйте
1. Нажмите кнопку "Publish" (Опубликовать)
2. Подождите 10-20 секунд

### Шаг 4: Проверьте
1. Обновите helper панель (Ctrl + Shift + R)
2. Должна загрузиться без ошибок

## Альтернатива: Простая панель

Если не хотите менять правила сейчас, используйте упрощенную версию:

**URL:** https://grivsgg.github.io/forever-Project/helper/panel-simple.html

Эта версия работает с любыми правилами.

## Важно

⚠️ Правило `allow read, write: if true` открывает базу для всех. Это временное решение для тестирования.

После того как все заработает, можно настроить более безопасные правила.

## Дата
26 марта 2026
