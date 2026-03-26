# 🔒 Безопасность Forever Client

## ⚠️ ВАЖНО: Защита данных

### 1. Firebase Security Rules

**КРИТИЧЕСКИ ВАЖНО!** Ваши текущие правила Firebase открыты для всех:

```javascript
// ❌ НЕБЕЗОПАСНО - ТЕКУЩИЕ ПРАВИЛА
allow read, write: if true;
```

**Необходимо изменить на:**

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Пользователи - только свои данные
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.token.email_verified;
      allow delete: if request.auth != null && 
                      (get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
    }
    
    // Лицензии - только чтение для всех, запись только для админов
    match /licenses/{licenseId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
                     (get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin' ||
                      get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'helper');
    }
    
    // Тикеты - только свои
    match /tickets/{ticketId} {
      allow read: if request.auth != null && 
                    (resource.data.username == request.auth.uid ||
                     get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin', 'helper']);
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && 
                              (get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin', 'helper']);
    }
    
    // Баны - только админы и хелперы
    match /bans/{banId} {
      allow read, write: if request.auth != null && 
                           (get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin', 'helper']);
    }
  }
}
```

### 2. Firebase Authentication

**Сейчас:** Аутентификация через localStorage (небезопасно)

**Рекомендуется:** Включить Firebase Authentication:

1. Откройте Firebase Console
2. Перейдите в Authentication
3. Включите Email/Password провайдер
4. Обновите код для использования Firebase Auth

### 3. Защита API ключей

**ПРОБЛЕМА:** Firebase API ключ виден в коде

**Решение:**
- API ключ Firebase можно оставить публичным (это нормально)
- Безопасность обеспечивается через Firestore Rules
- НО обязательно настройте правильные Rules!

### 4. Защита от несанкционированного доступа

**Текущая защита:**
- ✅ Проверка роли пользователя для админ панели
- ✅ Проверка роли пользователя для хелпер панели
- ✅ Редирект на главную при отсутствии доступа

**Дополнительно рекомендуется:**
- Включить Firebase Authentication
- Настроить Firestore Security Rules
- Добавить rate limiting для API запросов

### 5. Защита от кражи кода

**GitHub Pages:**
- ⚠️ Весь код публичен на GitHub
- ⚠️ Любой может посмотреть исходники

**Решения:**

#### Вариант 1: Private Repository (Рекомендуется)
```bash
# Сделать репозиторий приватным
1. Откройте https://github.com/GrivSGG/forever-Project/settings
2. Прокрутите вниз до "Danger Zone"
3. Нажмите "Change visibility" → "Make private"
```

**НО:** GitHub Pages не работает с приватными репозиториями на бесплатном плане!

#### Вариант 2: Использовать Backend
- Переместить логику на сервер (Node.js, Python, PHP)
- Клиент только отправляет запросы
- Код на сервере скрыт

#### Вариант 3: Обфускация кода
- Использовать JavaScript obfuscator
- Минификация кода
- Но это не 100% защита

### 6. Рекомендуемая архитектура

```
┌─────────────────┐
│   Пользователь  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  GitHub Pages   │ ← Только HTML/CSS/JS (публичный)
│  (Frontend)     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│    Firebase     │ ← Защищен Security Rules
│   (Database)    │
└─────────────────┘
```

### 7. Что делать СЕЙЧАС

**Приоритет 1 - КРИТИЧНО:**
1. Настройте Firebase Security Rules (см. выше)
2. Включите Firebase Authentication
3. Обновите код для использования Firebase Auth

**Приоритет 2 - Важно:**
1. Создайте отдельные роли: admin, helper, user
2. Храните роли в Firebase
3. Проверяйте роли на сервере (Firebase Rules)

**Приоритет 3 - Желательно:**
1. Добавьте rate limiting
2. Логирование всех действий
3. Мониторинг подозрительной активности

### 8. Текущие уязвимости

⚠️ **Критические:**
- Firebase открыт для всех (любой может читать/писать)
- Нет реальной аутентификации
- API ключи в открытом коде

⚠️ **Средние:**
- Весь код виден на GitHub
- Нет rate limiting
- Нет логирования действий

⚠️ **Низкие:**
- Пароли хранятся в localStorage (но хешированы)
- Нет двухфакторной аутентификации

### 9. Контакты для помощи

Если нужна помощь с настройкой безопасности:
- Firebase Documentation: https://firebase.google.com/docs/rules
- Firebase Auth: https://firebase.google.com/docs/auth

## Дата создания
26 марта 2026
