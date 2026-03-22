// Личный кабинет Forever Client

// Проверка авторизации
window.addEventListener('load', () => {
    const session = auth.checkSession();
    
    if (!session) {
        auth.showNotification('Необходимо войти в аккаунт', 'warning');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);
        return;
    }
    
    loadUserData(session.username);
});

// Загрузка данных пользователя
function loadUserData(username) {
    const users = auth.loadUsers();
    const user = users[username];
    
    if (!user) {
        auth.showNotification('Ошибка загрузки данных пользователя', 'error');
        return;
    }
    
    // Отображение информации
    document.getElementById('username').textContent = username;
    document.getElementById('userLogin').textContent = username;
    document.getElementById('userEmail').textContent = user.email;
    document.getElementById('userDate').textContent = new Date(user.createdAt).toLocaleDateString('ru-RU');
    
    if (user.hwid) {
        document.getElementById('userHWID').textContent = user.hwid.substring(0, 16) + '...';
    }
    
    // Загрузка лицензий
    loadLicenses(user);
}

// Загрузка лицензий
function loadLicenses(user) {
    const container = document.getElementById('licensesContainer');
    
    if (!user.licenses || user.licenses.length === 0) {
        // Показываем сообщение "нет лицензий"
        return;
    }
    
    container.innerHTML = '';
    
    user.licenses.forEach(license => {
        const card = document.createElement('div');
        card.className = 'license-card';
        
        const typeNames = {
            '30': '30 дней',
            '90': '90 дней',
            'lifetime': 'Навсегда',
            'beta': 'Бета доступ'
        };
        
        const isActive = license.expiryDate ? new Date(license.expiryDate) > new Date() : true;
        const statusClass = isActive ? 'active' : 'expired';
        const statusText = isActive ? 'Активна' : 'Истекла';
        
        let expiryText = 'Бессрочно';
        if (license.expiryDate && license.type !== 'lifetime') {
            const daysLeft = Math.ceil((new Date(license.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
            expiryText = daysLeft > 0 ? `${daysLeft} дней` : 'Истекла';
        }
        
        card.innerHTML = `
            <div class="license-header">
                <div class="license-type">${typeNames[license.type] || license.type}</div>
                <div class="license-status ${statusClass}">${statusText}</div>
            </div>
            <div class="license-details">
                <div class="license-detail">
                    <label>Ключ</label>
                    <value><code>${license.key}</code></value>
                </div>
                <div class="license-detail">
                    <label>Дата активации</label>
                    <value>${new Date(license.activationDate).toLocaleDateString('ru-RU')}</value>
                </div>
                <div class="license-detail">
                    <label>Осталось</label>
                    <value>${expiryText}</value>
                </div>
                <div class="license-detail">
                    <label>HWID</label>
                    <value>${license.hwid ? license.hwid.substring(0, 12) + '...' : 'Не привязан'}</value>
                </div>
            </div>
        `;
        
        container.appendChild(card);
    });
}

// Активация лицензии
function activateLicense() {
    document.getElementById('activateModal').classList.add('show');
}

function closeActivateModal() {
    document.getElementById('activateModal').classList.remove('show');
}

function handleActivation(event) {
    event.preventDefault();
    
    const key = document.getElementById('licenseKey').value.trim().toUpperCase();
    const session = auth.checkSession();
    
    if (!session) {
        auth.showNotification('Ошибка сессии', 'error');
        return false;
    }
    
    // Проверка формата ключа
    if (!key.match(/^FC(30|90|LT|BT)-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/)) {
        auth.showNotification('Неверный формат ключа', 'error');
        return false;
    }
    
    // Проверка что ключ не использован
    const users = auth.loadUsers();
    for (const username in users) {
        const user = users[username];
        if (user.licenses) {
            for (const license of user.licenses) {
                if (license.key === key) {
                    auth.showNotification('Этот ключ уже активирован', 'error');
                    return false;
                }
            }
        }
    }
    
    // Определение типа лицензии
    const prefix = key.substring(0, 4);
    let type, days;
    
    switch (prefix) {
        case 'FC30':
            type = '30';
            days = 30;
            break;
        case 'FC90':
            type = '90';
            days = 90;
            break;
        case 'FCLT':
            type = 'lifetime';
            days = -1;
            break;
        case 'FCBT':
            type = 'beta';
            days = -1;
            break;
        default:
            auth.showNotification('Неверный тип лицензии', 'error');
            return false;
    }
    
    // Генерация HWID (симуляция)
    const hwid = generateHWID();
    
    // Создание лицензии
    const license = {
        key: key,
        type: type,
        hwid: hwid,
        activationDate: new Date().toISOString(),
        expiryDate: days > 0 ? new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString() : null
    };
    
    // Сохранение лицензии
    const user = users[session.username];
    if (!user.licenses) {
        user.licenses = [];
    }
    user.licenses.push(license);
    user.hwid = hwid;
    
    localStorage.setItem('forever_users', JSON.stringify(users));
    
    auth.showNotification('Лицензия успешно активирована!', 'success');
    closeActivateModal();
    
    // Перезагрузка данных
    setTimeout(() => {
        loadUserData(session.username);
    }, 1000);
    
    return false;
}

// Генерация HWID (симуляция)
function generateHWID() {
    const chars = 'ABCDEF0123456789';
    let hwid = '';
    for (let i = 0; i < 32; i++) {
        hwid += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return hwid;
}

// Скачивание клиента
function downloadClient() {
    const session = auth.checkSession();
    if (!session) {
        auth.showNotification('Необходимо войти в аккаунт', 'warning');
        return;
    }
    
    const users = auth.loadUsers();
    const user = users[session.username];
    
    if (!user.licenses || user.licenses.length === 0) {
        auth.showNotification('Сначала активируйте лицензию', 'warning');
        return;
    }
    
    // Проверка активных лицензий
    const hasActiveLicense = user.licenses.some(license => {
        if (!license.expiryDate) return true;
        return new Date(license.expiryDate) > new Date();
    });
    
    if (!hasActiveLicense) {
        auth.showNotification('У вас нет активных лицензий', 'error');
        return;
    }
    
    auth.showNotification('Начинается загрузка Forever Client...', 'success');
    
    // Здесь будет ссылка на реальный файл
    setTimeout(() => {
        auth.showNotification('Функция загрузки в разработке. Свяжитесь с поддержкой.', 'info');
    }, 2000);
}

// Стили для code
const codeStyle = document.createElement('style');
codeStyle.textContent = `
    code {
        background: rgba(255, 255, 255, 0.1);
        padding: 4px 8px;
        border-radius: 4px;
        font-family: 'Courier New', monospace;
        color: var(--primary);
        font-size: 14px;
    }
`;
document.head.appendChild(codeStyle);
