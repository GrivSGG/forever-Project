// Helper Panel Forever Client - Fixed Version
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
    loadTickets();
    loadBans();
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
    
    // Найти и активировать нужный nav-item
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        if (item.onclick && item.onclick.toString().includes(sectionId)) {
            item.classList.add('active');
        }
    });
    
    // Обновить заголовок
    const titles = {
        'dashboard': 'Панель Хелпера',
        'tickets': 'Управление тикетами',
        'users': 'Пользователи',
        'keygen': 'Генератор ключей',
        'bans': 'Управление банами'
    };
    document.getElementById('pageTitle').textContent = titles[sectionId];
    
    // Загрузить данные для секции
    if (sectionId === 'tickets') {
        loadTickets();
    } else if (sectionId === 'users') {
        loadUsers();
    } else if (sectionId === 'bans') {
        loadBans();
    }
}

// Загрузка данных дашборда
function loadDashboardData() {
    const users = auth.loadUsers();
    const userCount = Object.keys(users).length;
    
    // Подсчет ключей
    const history = JSON.parse(localStorage.getItem('keyHistory') || '[]');
    const totalKeys = history.length;
    
    // Подсчет тикетов - ИСПРАВЛЕНО: используем forever_tickets
    const tickets = JSON.parse(localStorage.getItem('forever_tickets') || '[]');
    const openTickets = tickets.filter(t => t.status !== 'closed').length;
    
    // Подсчет банов
    const bans = JSON.parse(localStorage.getItem('bans') || '[]');
    const activeBans = bans.filter(b => {
        if (b.type === 'permanent') return true;
        return new Date(b.expiresAt) > new Date();
    }).length;
    
    // Обновление статистики
    document.getElementById('totalUsers').textContent = userCount;
    document.getElementById('totalKeys').textContent = totalKeys;
    document.getElementById('openTickets').textContent = openTickets;
    document.getElementById('activeBans').textContent = activeBans;
}

// Загрузка пользователей
function loadUsers() {
    const users = auth.loadUsers();
    const tbody = document.getElementById('usersTable');
    tbody.innerHTML = '';
    
    if (Object.keys(users).length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="no-data">Нет зарегистрированных пользователей</td></tr>';
        return;
    }
    
    let index = 1;
    for (const username in users) {
        const user = users[username];
        const row = document.createElement('tr');
        
        const licenseStatus = user.licenses && user.licenses.length > 0 
            ? `<span style="color: #4CAF50">Активна</span>` 
            : `<span style="color: #F44336">Нет</span>`;
        
        // Симуляция IP адреса
        const fakeIP = `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
        
        row.innerHTML = `
            <td>${index++}</td>
            <td>${username}</td>
            <td>${user.email}</td>
            <td>${fakeIP}</td>
            <td>${new Date(user.createdAt).toLocaleDateString('ru-RU')}</td>
            <td>${licenseStatus}</td>
            <td>
                <button class="btn-action" onclick="viewUser('${username}')">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn-action danger" onclick="banUserFromTable('${username}')">
                    <i class="fas fa-ban"></i>
                </button>
                <button class="btn-action danger" onclick="deleteUser('${username}')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        
        tbody.appendChild(row);
    }
}

// Загрузка тикетов - ИСПРАВЛЕНО: используем forever_tickets
function loadTickets() {
    const tickets = JSON.parse(localStorage.getItem('forever_tickets') || '[]');
    const ticketsList = document.getElementById('ticketsList');
    ticketsList.innerHTML = '';
    
    if (tickets.length === 0) {
        ticketsList.innerHTML = '<div class="no-data">Нет активных тикетов</div>';
        return;
    }
    
    tickets.forEach(ticket => {
        const ticketItem = document.createElement('div');
        ticketItem.className = 'ticket-item';
        
        const statusClass = `status-${ticket.status}`;
        const statusNames = {
            'pending': 'Ожидает',
            'reviewing': 'Рассматривается',
            'waiting_response': 'Ждет ответа',
            'ready': 'Готов',
            'closed': 'Закрыт'
        };
        
        ticketItem.innerHTML = `
            <div class="ticket-header">
                <div class="ticket-title">#${ticket.id} - ${ticket.subject}</div>
                <div class="ticket-status ${statusClass}">${statusNames[ticket.status]}</div>
            </div>
            <div class="ticket-content">
                <strong>От:</strong> ${ticket.username}<br>
                <strong>Дата:</strong> ${new Date(ticket.createdAt).toLocaleString('ru-RU')}<br>
                <strong>Сообщение:</strong> ${ticket.message}
            </div>
            <div class="ticket-actions">
                <select onchange="changeTicketStatus('${ticket.id}', this.value)">
                    <option value="">Изменить статус</option>
                    <option value="pending" ${ticket.status === 'pending' ? 'selected' : ''}>Ожидает</option>
                    <option value="reviewing" ${ticket.status === 'reviewing' ? 'selected' : ''}>Рассматривается</option>
                    <option value="waiting_response" ${ticket.status === 'waiting_response' ? 'selected' : ''}>Ждет ответа</option>
                    <option value="ready" ${ticket.status === 'ready' ? 'selected' : ''}>Готов</option>
                    <option value="closed" ${ticket.status === 'closed' ? 'selected' : ''}>Закрыт</option>
                </select>
                <button class="btn btn-primary" onclick="toggleResponseForm('${ticket.id}')">
                    <i class="fas fa-reply"></i> Ответить
                </button>
            </div>
            <div id="response-${ticket.id}" class="response-form" style="display: none;">
                <textarea id="response-text-${ticket.id}" placeholder="Введите ответ..."></textarea>
                <button class="btn btn-primary" onclick="sendTicketResponse('${ticket.id}')" style="margin-top: 10px;">
                    <i class="fas fa-paper-plane"></i> Отправить ответ
                </button>
            </div>
        `;
        
        ticketsList.appendChild(ticketItem);
    });
}

// Изменение статуса тикета - ИСПРАВЛЕНО: используем forever_tickets
function changeTicketStatus(ticketId, newStatus) {
    if (!newStatus) return;
    
    const tickets = JSON.parse(localStorage.getItem('forever_tickets') || '[]');
    const ticket = tickets.find(t => t.id === ticketId);
    
    if (ticket) {
        ticket.status = newStatus;
        ticket.updatedAt = new Date().toISOString();
        localStorage.setItem('forever_tickets', JSON.stringify(tickets));
        
        auth.showNotification(`Статус тикета #${ticketId} изменен`, 'success');
        loadTickets();
        loadDashboardData();
    }
}

// Показать/скрыть форму ответа
function toggleResponseForm(ticketId) {
    const form = document.getElementById(`response-${ticketId}`);
    form.style.display = form.style.display === 'none' ? 'block' : 'none';
}

// Отправить ответ на тикет - ИСПРАВЛЕНО: используем forever_tickets
function sendTicketResponse(ticketId) {
    const responseText = document.getElementById(`response-text-${ticketId}`).value.trim();
    
    if (!responseText) {
        auth.showNotification('Введите текст ответа', 'error');
        return;
    }
    
    const tickets = JSON.parse(localStorage.getItem('forever_tickets') || '[]');
    const ticket = tickets.find(t => t.id === ticketId);
    
    if (ticket) {
        if (!ticket.responses) {
            ticket.responses = [];
        }
        
        ticket.responses.push({
            author: 'Helper',
            message: responseText,
            timestamp: new Date().toISOString()
        });
        
        ticket.status = 'waiting_response';
        ticket.updatedAt = new Date().toISOString();
        
        localStorage.setItem('forever_tickets', JSON.stringify(tickets));
        
        auth.showNotification('Ответ отправлен', 'success');
        loadTickets();
        loadDashboardData();
    }
}

// Остальные функции...
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
    
    // Обновить данные
    loadDashboardData();
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

function copyKey(key) {
    navigator.clipboard.writeText(key).then(() => {
        auth.showNotification('Ключ скопирован в буфер обмена', 'success');
    });
}

function copyAllKeys() {
    const keys = Array.from(document.querySelectorAll('.key-item code'))
        .map(el => el.textContent)
        .join('\n');
    
    navigator.clipboard.writeText(keys).then(() => {
        auth.showNotification('Все ключи скопированы', 'success');
    });
}

function viewUser(username) {
    const users = auth.loadUsers();
    const user = users[username];
    
    if (!user) return;
    
    const info = `Логин: ${username}\nEmail: ${user.email}\nДата регистрации: ${new Date(user.createdAt).toLocaleString('ru-RU')}\nЛицензий: ${user.licenses ? user.licenses.length : 0}\nHWID: ${user.hwid || 'Не привязан'}`;
    
    alert(info);
}

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

function banUserFromTable(username) {
    document.getElementById('banUsername').value = username;
    showSection('bans');
    auth.showNotification(`Пользователь ${username} выбран для бана`, 'info');
}

function banUser() {
    const username = document.getElementById('banUsername').value.trim();
    const duration = document.getElementById('banDuration').value;
    const reason = document.getElementById('banReason').value.trim();
    
    if (!username) {
        auth.showNotification('Введите логин пользователя', 'error');
        return;
    }
    
    if (!reason) {
        auth.showNotification('Введите причину бана', 'error');
        return;
    }
    
    const users = auth.loadUsers();
    if (!users[username]) {
        auth.showNotification('Пользователь не найден', 'error');
        return;
    }
    
    const bans = JSON.parse(localStorage.getItem('bans') || '[]');
    const ban = {
        id: generateId(),
        username: username,
        reason: reason,
        type: duration === 'permanent' ? 'permanent' : 'temporary',
        duration: duration,
        createdAt: new Date().toISOString(),
        createdBy: 'Helper'
    };
    
    if (duration !== 'permanent') {
        const hours = parseInt(duration);
        ban.expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
    }
    
    bans.push(ban);
    localStorage.setItem('bans', JSON.stringify(bans));
    
    users[username].banned = true;
    if (duration !== 'permanent') {
        users[username].bannedUntil = ban.expiresAt;
    }
    users[username].banReason = reason;
    localStorage.setItem('forever_users', JSON.stringify(users));
    
    auth.showNotification(`Пользователь ${username} забанен`, 'success');
    
    document.getElementById('banUsername').value = '';
    document.getElementById('banReason').value = '';
    
    loadBans();
    loadDashboardData();
}

function banIP() {
    const ip = document.getElementById('banIP').value.trim();
    const reason = document.getElementById('ipBanReason').value.trim();
    
    if (!ip) {
        auth.showNotification('Введите IP адрес', 'error');
        return;
    }
    
    if (!reason) {
        auth.showNotification('Введите причину блокировки', 'error');
        return;
    }
    
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipRegex.test(ip)) {
        auth.showNotification('Неверный формат IP адреса', 'error');
        return;
    }
    
    const bans = JSON.parse(localStorage.getItem('bans') || '[]');
    const ban = {
        id: generateId(),
        ip: ip,
        reason: reason,
        type: 'ip',
        createdAt: new Date().toISOString(),
        createdBy: 'Helper'
    };
    
    bans.push(ban);
    localStorage.setItem('bans', JSON.stringify(bans));
    
    auth.showNotification(`IP ${ip} заблокирован`, 'success');
    
    document.getElementById('banIP').value = '';
    document.getElementById('ipBanReason').value = '';
    
    loadBans();
    loadDashboardData();
}

function loadBans() {
    const bans = JSON.parse(localStorage.getItem('bans') || '[]');
    const bansList = document.getElementById('bansList');
    bansList.innerHTML = '';
    
    if (bans.length === 0) {
        bansList.innerHTML = '<div class="no-data">Нет активных банов</div>';
        return;
    }
    
    const activeBans = bans.filter(ban => {
        if (ban.type === 'permanent' || ban.type === 'ip') return true;
        return new Date(ban.expiresAt) > new Date();
    });
    
    if (activeBans.length === 0) {
        bansList.innerHTML = '<div class="no-data">Нет активных банов</div>';
        return;
    }
    
    activeBans.forEach(ban => {
        const banItem = document.createElement('div');
        banItem.className = 'ticket-item';
        
        let banInfo = '';
        if (ban.type === 'ip') {
            banInfo = `<strong>IP:</strong> ${ban.ip}`;
        } else {
            banInfo = `<strong>Пользователь:</strong> ${ban.username}`;
        }
        
        let expiryInfo = '';
        if (ban.type === 'permanent') {
            expiryInfo = '<span style="color: #e17055;">Навсегда</span>';
        } else if (ban.expiresAt) {
            const expiryDate = new Date(ban.expiresAt);
            expiryInfo = `До ${expiryDate.toLocaleString('ru-RU')}`;
        } else {
            expiryInfo = '<span style="color: #e17055;">Навсегда</span>';
        }
        
        banItem.innerHTML = `
            <div class="ticket-header">
                <div class="ticket-title">Бан #${ban.id}</div>
                <div class="ticket-status status-closed">${ban.type === 'ip' ? 'IP БАН' : 'ПОЛЬЗОВАТЕЛЬ'}</div>
            </div>
            <div class="ticket-content">
                ${banInfo}<br>
                <strong>Причина:</strong> ${ban.reason}<br>
                <strong>Создан:</strong> ${new Date(ban.createdAt).toLocaleString('ru-RU')}<br>
                <strong>Истекает:</strong> ${expiryInfo}<br>
                <strong>Создал:</strong> ${ban.createdBy}
            </div>
            <div class="ticket-actions">
                <button class="btn btn-danger" onclick="removeBan('${ban.id}')">
                    <i class="fas fa-trash"></i> Снять бан
                </button>
            </div>
        `;
        
        bansList.appendChild(banItem);
    });
}

function removeBan(banId) {
    if (!confirm('Вы уверены, что хотите снять этот бан?')) {
        return;
    }
    
    const bans = JSON.parse(localStorage.getItem('bans') || '[]');
    const banIndex = bans.findIndex(b => b.id === banId);
    
    if (banIndex !== -1) {
        const ban = bans[banIndex];
        
        if (ban.username) {
            const users = auth.loadUsers();
            if (users[ban.username]) {
                users[ban.username].banned = false;
                users[ban.username].bannedUntil = null;
                users[ban.username].banReason = null;
                localStorage.setItem('forever_users', JSON.stringify(users));
            }
        }
        
        bans.splice(banIndex, 1);
        localStorage.setItem('bans', JSON.stringify(bans));
        
        auth.showNotification('Бан снят', 'success');
        loadBans();
        loadDashboardData();
    }
}

function generateId() {
    return Math.random().toString(36).substr(2, 9);
}

function logout() {
    if (confirm('Вы уверены, что хотите выйти?')) {
        auth.logout();
    }
}
