// Админ панель Forever Client
// Проверка доступа и функционал

// Проверка авторизации при загрузке
window.addEventListener('load', () => {
    const session = auth.checkSession();
    
    if (!session || session.role !== 'helper') {
        auth.showNotification('Доступ запрещен! Требуются права администратора.', 'error');
        setTimeout(() => {
            window.location.href = '../index.html';
        }, 2000);
        return;
    }
    
    // Отображение имени админа
    document.getElementById('adminUsername').textContent = session.username;
    
    // Загрузка данных
    loadDashboardData();
    loadUsers();
    loadLicenses();
    loadHistory();
});

// Переключение секций
function showSection(sectionId) {
    // Скрыть все секции
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Показать выбранную
    document.getElementById(sectionId).classList.add('active');
    
    // Обновить навигацию
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    event.target.closest('.nav-item').classList.add('active');
    
    // Обновить заголовок
    const titles = {
        'dashboard': 'Дашборд',
        'users': 'Пользователи',
        'licenses': 'Лицензии',
        'keygen': 'Генератор ключей',
        'stats': 'Статистика',
        'settings': 'Настройки'
    };
    document.getElementById('pageTitle').textContent = titles[sectionId];
}

// Загрузка данных дашборда
function loadDashboardData() {
    const users = auth.loadUsers();
    const userCount = Object.keys(users).length;
    
    // Подсчет активных лицензий
    let activeLicenses = 0;
    for (const username in users) {
        if (users[username].licenses && users[username].licenses.length > 0) {
            activeLicenses += users[username].licenses.length;
        }
    }
    
    // Обновление статистики
    document.getElementById('totalUsers').textContent = userCount;
    document.getElementById('activeLicenses').textContent = activeLicenses;
    
    // Симуляция данных для демонстрации
    document.getElementById('monthlyRevenue').textContent = (activeLicenses * 450) + '₽';
    document.getElementById('todaySales').textContent = Math.floor(Math.random() * 10);
}

// Загрузка пользователей
function loadUsers() {
    const users = auth.loadUsers();
    const tbody = document.getElementById('usersTable');
    tbody.innerHTML = '';
    
    if (Object.keys(users).length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="no-data">Нет зарегистрированных пользователей</td></tr>';
        return;
    }
    
    let index = 1;
    for (const username in users) {
        const user = users[username];
        const row = document.createElement('tr');
        
        const licenseStatus = user.licenses && user.licenses.length > 0 
            ? `<span style="color: #4CAF50">Активна</span>` 
            : `<span style="color: #F44336">Нет</span>`;
        
        row.innerHTML = `
            <td>${index++}</td>
            <td>${username}</td>
            <td>${user.email}</td>
            <td>${new Date(user.createdAt).toLocaleDateString('ru-RU')}</td>
            <td>${licenseStatus}</td>
            <td>
                <button class="btn-action" onclick="viewUser('${username}')">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn-action danger" onclick="deleteUser('${username}')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        
        tbody.appendChild(row);
    }
}

// Загрузка лицензий
function loadLicenses() {
    const history = JSON.parse(localStorage.getItem('keyHistory') || '[]');
    const tbody = document.getElementById('licensesTable');
    tbody.innerHTML = '';
    
    if (history.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="no-data">Нет сгенерированных ключей</td></tr>';
        return;
    }
    
    history.reverse().forEach((item, index) => {
        const row = document.createElement('tr');
        const typeNames = {
            '30': '30 дней',
            '90': '90 дней',
            'lifetime': 'Навсегда',
            'hwid': 'Сброс HWID',
            'beta': 'Бета доступ'
        };
        
        row.innerHTML = `
            <td><code>${item.key}</code></td>
            <td>${typeNames[item.type]}</td>
            <td>${item.username || 'Не указан'}</td>
            <td>${new Date(item.date).toLocaleString('ru-RU')}</td>
            <td><span style="color: #4CAF50">Активен</span></td>
            <td>
                <button class="btn-action" onclick="copyKey('${item.key}')">
                    <i class="fas fa-copy"></i>
                </button>
                <button class="btn-action danger" onclick="revokeKey('${item.key}')">
                    <i class="fas fa-ban"></i>
                </button>
            </td>
        `;
        
        tbody.appendChild(row);
    });
}

// Генерация ключей
function generateKeys() {
    const type = document.getElementById('keygenType').value;
    const count = parseInt(document.getElementById('keygenCount').value);
    const comment = document.getElementById('keygenComment').value;
    
    if (count < 1 || count > 100) {
        auth.showNotification('Количество ключей должно быть от 1 до 100', 'error');
        return;
    }
    
    const keys = [];
    const prefix = {
        '30': 'FC30',
        '90': 'FC90',
        'lifetime': 'FCLT',
        'hwid': 'FCHW',
        'beta': 'FCBT'
    }[type];
    
    for (let i = 0; i < count; i++) {
        const randomPart = generateRandomString(16);
        const key = `${prefix}-${randomPart}`;
        keys.push(key);
        
        // Сохранение в историю
        saveKeyToHistory(key, type, comment);
    }
    
    // Отображение сгенерированных ключей
    const keysList = document.getElementById('keysList');
    keysList.innerHTML = '';
    
    keys.forEach(key => {
        const keyItem = document.createElement('div');
        keyItem.className = 'key-item';
        keyItem.innerHTML = `
            <code>${key}</code>
            <button class="btn-copy" onclick="copyKey('${key}')">
                <i class="fas fa-copy"></i> Копировать
            </button>
        `;
        keysList.appendChild(keyItem);
    });
    
    document.getElementById('generatedKeys').style.display = 'block';
    auth.showNotification(`Сгенерировано ${count} ключей`, 'success');
    
    // Обновить историю
    loadHistory();
    loadLicenses();
}

function generateRandomString(length) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        if (i > 0 && i % 4 === 0) result += '-';
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

function saveKeyToHistory(key, type, username) {
    const history = JSON.parse(localStorage.getItem('keyHistory') || '[]');
    history.push({
        key: key,
        type: type,
        username: username,
        date: new Date().toISOString()
    });
    localStorage.setItem('keyHistory', JSON.stringify(history));
}

// Загрузка истории
function loadHistory() {
    const history = JSON.parse(localStorage.getItem('keyHistory') || '[]');
    const historyList = document.getElementById('historyList');
    historyList.innerHTML = '';
    
    if (history.length === 0) {
        historyList.innerHTML = '<p class="no-data">История пуста</p>';
        return;
    }
    
    const typeNames = {
        '30': '30 дней',
        '90': '90 дней',
        'lifetime': 'Навсегда',
        'hwid': 'Сброс HWID',
        'beta': 'Бета доступ'
    };
    
    history.slice(-10).reverse().forEach(item => {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        historyItem.innerHTML = `
            <div>
                <strong>${typeNames[item.type]}</strong>
                ${item.username ? `<br><small>Для: ${item.username}</small>` : ''}
            </div>
            <div style="text-align: right;">
                <small>${new Date(item.date).toLocaleString('ru-RU')}</small>
            </div>
        `;
        historyList.appendChild(historyItem);
    });
}

// Копирование ключа
function copyKey(key) {
    navigator.clipboard.writeText(key).then(() => {
        auth.showNotification('Ключ скопирован в буфер обмена', 'success');
    });
}

// Копирование всех ключей
function copyAllKeys() {
    const keys = Array.from(document.querySelectorAll('.key-item code'))
        .map(el => el.textContent)
        .join('\n');
    
    navigator.clipboard.writeText(keys).then(() => {
        auth.showNotification('Все ключи скопированы', 'success');
    });
}

// Просмотр пользователя
function viewUser(username) {
    const users = auth.loadUsers();
    const user = users[username];
    
    if (!user) return;
    
    const info = `
        Логин: ${username}
        Email: ${user.email}
        Дата регистрации: ${new Date(user.createdAt).toLocaleString('ru-RU')}
        Лицензий: ${user.licenses ? user.licenses.length : 0}
        HWID: ${user.hwid || 'Не привязан'}
    `;
    
    alert(info);
}

// Удаление пользователя
function deleteUser(username) {
    if (!confirm(`Вы уверены, что хотите удалить пользователя ${username}?`)) {
        return;
    }
    
    const users = auth.loadUsers();
    delete users[username];
    localStorage.setItem('forever_users', JSON.stringify(users));
    
    auth.showNotification('Пользователь удален', 'success');
    loadUsers();
    loadDashboardData();
}

// Отзыв ключа
function revokeKey(key) {
    if (!confirm(`Вы уверены, что хотите отозвать ключ ${key}?`)) {
        return;
    }
    
    // Здесь будет логика отзыва ключа
    auth.showNotification('Ключ отозван', 'success');
}

// Фильтрация статистики
function filterStats(period) {
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    auth.showNotification(`Статистика за ${period === 'week' ? 'неделю' : period === 'month' ? 'месяц' : 'год'}`, 'info');
}

// Выход
function logout() {
    if (confirm('Вы уверены, что хотите выйти?')) {
        auth.logout();
    }
}

// Добавление стилей для кнопок действий
const actionStyles = document.createElement('style');
actionStyles.textContent = `
    .btn-action {
        padding: 8px 12px;
        background: rgba(74, 144, 226, 0.2);
        border: 1px solid var(--primary);
        color: var(--primary);
        border-radius: 5px;
        cursor: pointer;
        transition: all 0.3s;
        margin-right: 5px;
    }
    
    .btn-action:hover {
        background: var(--primary);
        color: white;
    }
    
    .btn-action.danger {
        background: rgba(244, 67, 54, 0.2);
        border-color: #F44336;
        color: #F44336;
    }
    
    .btn-action.danger:hover {
        background: #F44336;
        color: white;
    }
    
    code {
        background: rgba(255, 255, 255, 0.1);
        padding: 4px 8px;
        border-radius: 4px;
        font-family: 'Courier New', monospace;
        color: var(--primary);
    }
`;
document.head.appendChild(actionStyles);

// Защита админ-панели
(function() {
    // Дополнительная проверка каждые 30 секунд
    setInterval(() => {
        const session = auth.checkSession();
        if (!session || session.role !== 'helper') {
            auth.showNotification('Сессия истекла', 'error');
            setTimeout(() => {
                window.location.href = '../index.html';
            }, 1000);
        }
    }, 30000);
    
    // Логирование действий
    const originalFetch = window.fetch;
    window.fetch = function(...args) {
        console.log('[Admin Action]', args);
        return originalFetch.apply(this, args);
    };
})();
