// Helper Panel JavaScript - Forever Client
console.log('🔵 panel.js загружается');

// Create animated background
function createBackground() {
    const container = document.getElementById('bgAnimation');
    if (!container) return;
    
    const particleCount = 50;
    
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 15 + 's';
        particle.style.animationDuration = (Math.random() * 10 + 10) + 's';
        container.appendChild(particle);
    }
}

// Select license type
function selectLicenseType(type) {
    // Remove active class from all buttons
    document.querySelectorAll('.license-type-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Add active class to selected button
    const btn = document.querySelector(`[data-type="${type}"]`);
    if (btn) btn.classList.add('active');
    
    // Update hidden input
    const input = document.getElementById('keyType');
    if (input) input.value = type;
}

// Firebase initialization
let db;
let usersData = {};
let ticketsData = [];
let licensesData = [];
let bansData = [];

// Initialize Firebase with error handling
function initFirebase() {
    try {
        console.log('🔵 Инициализация Firebase...');
        
        if (typeof firebase === 'undefined') {
            console.error('❌ Firebase SDK не загружен!');
            showNotification('Ошибка: Firebase SDK не загружен', 'error');
            return false;
        }
        
        if (!window.firebaseConfig) {
            console.error('❌ Firebase config не найден!');
            showNotification('Ошибка: Firebase config не найден', 'error');
            return false;
        }
        
        console.log('🔵 Firebase config:', window.firebaseConfig);
        
        firebase.initializeApp(window.firebaseConfig);
        db = firebase.firestore();
        
        console.log('✅ Firebase инициализирован успешно');
        return true;
        
    } catch (error) {
        console.error('❌ Ошибка инициализации Firebase:', error);
        showNotification('Ошибка инициализации Firebase: ' + error.message, 'error');
        return false;
    }
}

// Load all data
async function loadAllData() {
    try {
        console.log('🔵 Загрузка данных из Firebase...');
        
        // Show loading
        const loadingIndicator = document.getElementById('loadingIndicator');
        if (loadingIndicator) {
            loadingIndicator.style.display = 'flex';
        }
        
        // Load users
        console.log('🔵 Загрузка пользователей...');
        const usersSnapshot = await db.collection('users').get();
        usersData = {};
        usersSnapshot.forEach(doc => {
            usersData[doc.id] = doc.data();
        });
        console.log('✅ Пользователей загружено:', Object.keys(usersData).length);
        
        // Load tickets
        console.log('🔵 Загрузка тикетов...');
        const ticketsSnapshot = await db.collection('tickets').get();
        ticketsData = [];
        ticketsSnapshot.forEach(doc => {
            ticketsData.push({ id: doc.id, ...doc.data() });
        });
        console.log('✅ Тикетов загружено:', ticketsData.length);
        
        // Load licenses
        console.log('🔵 Загрузка лицензий...');
        const licensesSnapshot = await db.collection('licenses').get();
        licensesData = [];
        licensesSnapshot.forEach(doc => {
            licensesData.push({ key: doc.id, ...doc.data() });
        });
        console.log('✅ Лицензий загружено:', licensesData.length);
        
        // Load bans
        console.log('🔵 Загрузка банов...');
        const bansSnapshot = await db.collection('bans').get();
        bansData = [];
        bansSnapshot.forEach(doc => {
            bansData.push({ id: doc.id, ...doc.data() });
        });
        console.log('✅ Банов загружено:', bansData.length);
        
        console.log('✅ Все данные загружены');
        
        updateStats();
        renderUsers();
        renderTickets();
        renderBans();
        renderAllKeys();
        
        // Hide loading indicator
        if (loadingIndicator) {
            loadingIndicator.style.display = 'none';
        }
        
        showNotification('Данные успешно загружены', 'success');
        
    } catch (error) {
        console.error('❌ Ошибка загрузки данных:', error);
        console.error('❌ Error details:', error.code, error.message);
        
        // Hide loading indicator
        const loadingIndicator = document.getElementById('loadingIndicator');
        if (loadingIndicator) {
            loadingIndicator.style.display = 'none';
        }
        
        showNotification('Ошибка загрузки данных: ' + error.message, 'error');
        showErrorScreen('Ошибка загрузки данных: ' + error.message + '<br><br>Проверьте Firebase Rules в консоли.');
    }
}

// Update statistics
function updateStats() {
    document.getElementById('totalUsers').textContent = Object.keys(usersData).length;
    document.getElementById('totalTickets').textContent = ticketsData.length;
    document.getElementById('totalLicenses').textContent = licensesData.length;
    document.getElementById('totalBans').textContent = bansData.length;
}

// Render users
function renderUsers() {
    const container = document.getElementById('usersContainer');
    
    if (Object.keys(usersData).length === 0) {
        container.innerHTML = '<p style="color: rgba(255,255,255,0.6);">Пользователей пока нет</p>';
        return;
    }
    
    container.innerHTML = '';
    
    for (const [username, user] of Object.entries(usersData)) {
        const card = document.createElement('div');
        card.className = 'user-card';
        card.innerHTML = `
            <div class="user-header">
                <div class="user-name">${username}</div>
                <div class="user-role">${user.role || 'user'}</div>
            </div>
            <div class="user-info">
                <div><strong>Email:</strong> ${user.email}</div>
                <div><strong>IP:</strong> ${user.ip || 'Не определен'}</div>
                <div><strong>Регистрация:</strong> ${new Date(user.createdAt).toLocaleString('ru-RU')}</div>
                <div><strong>HWID:</strong> ${user.hwid || 'Не привязан'}</div>
                <div><strong>Лицензий:</strong> ${user.licenses ? user.licenses.length : 0}</div>
            </div>
            ${user.banned ? `
                <div style="margin-top: 15px; padding: 10px; background: rgba(244, 67, 54, 0.2); border: 1px solid #F44336; border-radius: 8px; color: #F44336; text-align: center;">
                    ⛔ Заблокирован ${user.bannedUntil ? 'до ' + new Date(user.bannedUntil).toLocaleString('ru-RU') : 'навсегда'}
                </div>
            ` : ''}
            <div style="margin-top: 15px;">
                <button class="btn btn-danger" onclick="deleteUser('${username}')" style="width: 100%;">
                    <i class="fas fa-trash"></i> Удалить аккаунт
                </button>
            </div>
        `;
        container.appendChild(card);
    }
}

// Render tickets
function renderTickets() {
    const container = document.getElementById('ticketsContainer');
    
    if (ticketsData.length === 0) {
        container.innerHTML = '<p style="color: rgba(255,255,255,0.6);">Тикетов пока нет</p>';
        return;
    }
    
    const statusNames = {
        'pending': 'В ожидании',
        'reviewing': 'Рассматривается',
        'waiting_response': 'Ожидание ответа',
        'ready': 'Готово',
        'closed': 'Закрыт'
    };
    
    container.innerHTML = '';
    
    ticketsData.forEach(ticket => {
        const card = document.createElement('div');
        card.className = 'ticket-card';
        card.innerHTML = `
            <div class="ticket-header">
                <div class="ticket-title">${ticket.subject}</div>
                <select class="ticket-status" onchange="changeTicketStatus('${ticket.id}', this.value)">
                    ${Object.entries(statusNames).map(([value, label]) => 
                        `<option value="${value}" ${ticket.status === value ? 'selected' : ''}>${label}</option>`
                    ).join('')}
                </select>
            </div>
            <div class="user-info">
                <div><strong>От:</strong> ${ticket.username}</div>
                <div><strong>Создан:</strong> ${new Date(ticket.createdAt).toLocaleString('ru-RU')}</div>
            </div>
            <div class="ticket-message">${ticket.message}</div>
            ${ticket.responses && ticket.responses.length > 0 ? `
                <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid rgba(255,255,255,0.1);">
                    <strong>Ответы:</strong>
                    ${ticket.responses.map(r => `
                        <div style="margin-top: 10px; padding: 10px; background: rgba(255,255,255,0.05); border-radius: 8px;">
                            <div style="color: #00d4ff; font-weight: 600;">${r.from}</div>
                            <div style="color: rgba(255,255,255,0.8);">${r.message}</div>
                            <div style="color: rgba(255,255,255,0.5); font-size: 12px; margin-top: 5px;">${new Date(r.date).toLocaleString('ru-RU')}</div>
                        </div>
                    `).join('')}
                </div>
            ` : ''}
            <div class="ticket-actions">
                <input type="text" id="response_${ticket.id}" class="response-input" placeholder="Ваш ответ...">
                <button class="btn" onclick="respondToTicket('${ticket.id}')">Ответить</button>
            </div>
            <div style="margin-top: 15px;">
                <button class="btn btn-danger" onclick="deleteTicket('${ticket.id}')" style="width: 100%;">
                    <i class="fas fa-trash"></i> Удалить тикет
                </button>
            </div>
        `;
        container.appendChild(card);
    });
}

// Change ticket status
async function changeTicketStatus(ticketId, newStatus) {
    try {
        await db.collection('tickets').doc(ticketId).update({
            status: newStatus,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        showNotification('Статус тикета обновлен', 'success');
        await loadAllData();
    } catch (error) {
        console.error('❌ Ошибка обновления статуса:', error);
        showNotification('Ошибка обновления статуса', 'error');
    }
}

// Respond to ticket
async function respondToTicket(ticketId) {
    const input = document.getElementById(`response_${ticketId}`);
    const message = input.value.trim();
    
    if (!message) {
        showNotification('Введите ответ', 'error');
        return;
    }
    
    const response = {
        from: 'Helper',
        message: message,
        date: new Date().toISOString()
    };
    
    try {
        await db.collection('tickets').doc(ticketId).update({
            responses: firebase.firestore.FieldValue.arrayUnion(response),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        input.value = '';
        showNotification('Ответ отправлен', 'success');
        await loadAllData();
    } catch (error) {
        console.error('❌ Ошибка отправки ответа:', error);
        showNotification('Ошибка отправки ответа', 'error');
    }
}

// Generate keys
async function generateKeys() {
    const type = document.getElementById('keyType').value;
    const count = parseInt(document.getElementById('keyCount').value);
    
    if (count < 1 || count > 100) {
        showNotification('Количество должно быть от 1 до 100', 'error');
        return;
    }
    
    const keys = [];
    
    for (let i = 0; i < count; i++) {
        const key = generateLicenseKey();
        const licenseData = {
            key: key,
            type: type,
            used: false,
            createdAt: new Date().toISOString(),
            createdBy: 'Helper'
        };
        
        keys.push(key);
        
        try {
            await db.collection('licenses').doc(key).set(licenseData);
        } catch (error) {
            console.error('❌ Ошибка сохранения ключа:', error);
        }
    }
    
    const container = document.getElementById('generatedKeysContainer');
    container.innerHTML = `
        <div class="generated-keys">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <strong style="color: #4CAF50;">✅ Сгенерировано ключей: ${count}</strong>
                <button class="btn" onclick="copyKeys(\`${keys.join('\\n')}\`)">Копировать все</button>
            </div>
            ${keys.map(key => `<div class="key-item">${key}</div>`).join('')}
        </div>
    `;
    
    showNotification(`Сгенерировано ${count} ключей`, 'success');
    await loadAllData();
}

// Generate license key
function generateLicenseKey() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const segments = 4;
    const segmentLength = 4;
    
    let key = '';
    for (let i = 0; i < segments; i++) {
        if (i > 0) key += '-';
        for (let j = 0; j < segmentLength; j++) {
            key += chars.charAt(Math.floor(Math.random() * chars.length));
        }
    }
    return key;
}

// Copy keys to clipboard
function copyKeys(text) {
    navigator.clipboard.writeText(text).then(() => {
        showNotification('Ключи скопированы', 'success');
    });
}

// Ban user
async function banUser() {
    const username = document.getElementById('banUsername').value.trim();
    const duration = document.getElementById('banDuration').value;
    const reason = document.getElementById('banReason').value.trim();
    
    if (!username || !reason) {
        showNotification('Заполните все поля', 'error');
        return;
    }
    
    if (!usersData[username]) {
        showNotification('Пользователь не найден', 'error');
        return;
    }
    
    const banUntil = duration === 'permanent' ? 'permanent' : 
        new Date(Date.now() + parseInt(duration) * 60 * 60 * 1000).toISOString();
    
    try {
        // Update user
        await db.collection('users').doc(username).update({
            banned: true,
            bannedUntil: banUntil,
            banReason: reason
        });
        
        // Save ban record
        const banId = 'ban_' + Date.now();
        await db.collection('bans').doc(banId).set({
            type: 'username',
            value: username,
            reason: reason,
            until: banUntil,
            createdAt: new Date().toISOString(),
            createdBy: 'Helper'
        });
        
        document.getElementById('banUsername').value = '';
        document.getElementById('banReason').value = '';
        
        showNotification('Пользователь забанен', 'success');
        await loadAllData();
    } catch (error) {
        console.error('❌ Ошибка бана:', error);
        showNotification('Ошибка бана', 'error');
    }
}

// Ban IP
async function banIP() {
    const ip = document.getElementById('banIP').value.trim();
    const reason = document.getElementById('banIPReason').value.trim();
    
    if (!ip || !reason) {
        showNotification('Заполните все поля', 'error');
        return;
    }
    
    try {
        const banId = 'ban_ip_' + Date.now();
        await db.collection('bans').doc(banId).set({
            type: 'ip',
            value: ip,
            reason: reason,
            until: 'permanent',
            createdAt: new Date().toISOString(),
            createdBy: 'Helper'
        });
        
        document.getElementById('banIP').value = '';
        document.getElementById('banIPReason').value = '';
        
        showNotification('IP забанен', 'success');
        await loadAllData();
    } catch (error) {
        console.error('❌ Ошибка бана IP:', error);
        showNotification('Ошибка бана IP', 'error');
    }
}

// Render bans
function renderBans() {
    const container = document.getElementById('bansContainer');
    
    if (bansData.length === 0) {
        container.innerHTML = '<p style="color: rgba(255,255,255,0.6);">Активных банов нет</p>';
        return;
    }
    
    container.innerHTML = '<h3 style="margin-bottom: 20px;">Активные баны</h3>';
    
    bansData.forEach(ban => {
        const card = document.createElement('div');
        card.style.cssText = 'display: flex; justify-content: space-between; align-items: center; padding: 20px; background: rgba(255,255,255,0.03); border-radius: 12px; margin-bottom: 15px;';
        card.innerHTML = `
            <div>
                <div><strong>${ban.type === 'username' ? 'Логин' : 'IP'}:</strong> ${ban.value}</div>
                <div><strong>Причина:</strong> ${ban.reason}</div>
                <div><strong>До:</strong> ${ban.until === 'permanent' ? 'Навсегда' : new Date(ban.until).toLocaleString('ru-RU')}</div>
                <div><strong>Создан:</strong> ${new Date(ban.createdAt).toLocaleString('ru-RU')}</div>
            </div>
            <button class="btn" style="background: #4CAF50;" onclick="unban('${ban.id}')">Разбанить</button>
        `;
        container.appendChild(card);
    });
}

// Unban
async function unban(banId) {
    try {
        await db.collection('bans').doc(banId).delete();
        showNotification('Бан снят', 'success');
        await loadAllData();
    } catch (error) {
        console.error('❌ Ошибка снятия бана:', error);
        showNotification('Ошибка снятия бана', 'error');
    }
}

// Show section
function showSection(sectionName) {
    // Hide all sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Show target section
    document.getElementById(sectionName).classList.add('active');
    
    // Update nav
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    event.target.closest('.nav-item').classList.add('active');
}

// Show notification
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

console.log('✅ panel.js загружен');


// Delete user
async function deleteUser(username) {
    if (!confirm(`Вы уверены что хотите удалить пользователя ${username}?`)) {
        return;
    }
    
    try {
        // Delete from Firebase
        await db.collection('users').doc(username).delete();
        
        // Remove from local data
        delete usersData[username];
        
        // Re-render
        renderUsers();
        updateStats();
        
        showNotification('Пользователь удален из базы данных', 'success');
    } catch (error) {
        console.error('❌ Ошибка удаления пользователя:', error);
        showNotification('Ошибка удаления: ' + error.message, 'error');
    }
}

// Delete ticket
async function deleteTicket(ticketId) {
    if (!confirm('Удалить этот тикет? Он будет удален из базы данных.')) {
        return;
    }
    
    try {
        // Delete from Firebase
        await db.collection('tickets').doc(ticketId).delete();
        
        // Remove from local array
        ticketsData = ticketsData.filter(t => t.id !== ticketId);
        
        // Re-render
        renderTickets();
        updateStats();
        
        showNotification('Тикет удален из базы данных', 'success');
    } catch (error) {
        console.error('❌ Ошибка удаления тикета:', error);
        showNotification('Ошибка удаления: ' + error.message, 'error');
    }
}

// Render all keys
function renderAllKeys() {
    const container = document.getElementById('keysContainer');
    
    if (licensesData.length === 0) {
        container.innerHTML = '<p style="color: rgba(255,255,255,0.6);">Ключей пока нет</p>';
        return;
    }
    
    const typeNames = {
        '1day': '1 день',
        '7days': '7 дней',
        '30days': '30 дней',
        '90days': '90 дней',
        'beta': 'Бета доступ',
        'lifetime': 'Навсегда'
    };
    
    container.innerHTML = '<div style="display: grid; gap: 15px;">';
    
    licensesData.forEach(license => {
        const card = document.createElement('div');
        card.style.cssText = 'background: rgba(255,255,255,0.05); padding: 20px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1);';
        card.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <div style="font-family: 'Courier New', monospace; font-size: 18px; font-weight: 600; color: #4A90E2;">
                    ${license.key}
                </div>
                <div style="padding: 5px 12px; background: ${license.used ? 'rgba(76, 175, 80, 0.2)' : 'rgba(255, 152, 0, 0.2)'}; color: ${license.used ? '#4CAF50' : '#FF9800'}; border-radius: 20px; font-size: 12px; font-weight: 600;">
                    ${license.used ? 'Активирован' : 'Не активирован'}
                </div>
            </div>
            <div style="display: flex; flex-direction: column; gap: 5px; color: rgba(255,255,255,0.7); font-size: 14px;">
                <div><strong>Тип:</strong> ${typeNames[license.type] || license.type}</div>
                <div><strong>Создан:</strong> ${new Date(license.createdAt).toLocaleString('ru-RU')}</div>
                ${license.used ? `
                    <div><strong>Активирован:</strong> ${license.activatedBy || 'Неизвестно'}</div>
                    <div><strong>Дата активации:</strong> ${license.activatedAt ? new Date(license.activatedAt).toLocaleString('ru-RU') : 'Неизвестно'}</div>
                ` : ''}
            </div>
        `;
        container.appendChild(card);
    });
}

// Initialize background on load
window.addEventListener('load', async () => {
    console.log('✅ Страница загружена');
    createBackground();
    
    try {
        // Initialize Firebase first
        console.log('🔵 Инициализация Firebase...');
        if (!initFirebase()) {
            showErrorScreen('Не удалось подключиться к Firebase');
            return;
        }
        
        console.log('✅ Firebase инициализирован');
        
        // Wait for Firebase to be ready
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Simple access check - just check if logged in
        const sessionData = localStorage.getItem('forever_session');
        if (!sessionData) {
            console.log('❌ Нет сессии, редирект на главную');
            window.location.href = '../index.html';
            return;
        }
        
        const session = JSON.parse(sessionData);
        console.log('✅ Пользователь:', session.username);
        
        // Check if user is admin or Helper
        if (session.username !== 'admin' && session.username !== 'Helper') {
            console.log('❌ Доступ запрещен для:', session.username);
            alert('⛔ Доступ запрещен! Эта панель только для админов и хелперов.');
            window.location.href = '../index.html';
            return;
        }
        
        console.log('✅ Доступ разрешен');
        
        // Load data
        console.log('🔵 Загрузка данных...');
        await loadAllData();
        
    } catch (error) {
        console.error('❌ Ошибка загрузки:', error);
        showErrorScreen('Ошибка загрузки: ' + error.message);
    }
});

function showErrorScreen(message) {
    const loadingIndicator = document.getElementById('loadingIndicator');
    if (loadingIndicator) {
        loadingIndicator.style.display = 'none';
    }
    
    document.body.innerHTML += `
        <div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); 
             background: rgba(244, 67, 54, 0.9); padding: 30px; border-radius: 15px; 
             color: white; text-align: center; z-index: 10000; max-width: 500px;">
            <h2 style="margin-bottom: 15px;">❌ Ошибка загрузки</h2>
            <p>${message}</p>
            <button onclick="location.reload()" style="margin-top: 20px; padding: 10px 20px; 
                    background: white; color: #F44336; border: none; border-radius: 8px; 
                    cursor: pointer; font-weight: 600;">
                Перезагрузить страницу
            </button>
        </div>
    `;
}
