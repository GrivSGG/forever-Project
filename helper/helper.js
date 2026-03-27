// Helper Panel для Forever Client с Firebase синхронизацией
console.log('🔵 helper.js загружается');

class HelperPanel {
    constructor() {
        this.currentSection = 'overview';
        this.users = {};
        this.tickets = [];
        this.licenses = [];
        this.bans = [];
        this.unsubscribers = [];
        
        this.init();
    }
    
    async init() {
        console.log('🔵 Инициализация Helper Panel');
        
        // Ждем инициализации Firebase
        await this.waitForFirebase();
        
        // Подписка на изменения в реальном времени
        this.subscribeToChanges();
        
        // Загрузка начальных данных
        await this.loadAllData();
        
        // Инициализация навигации
        this.initNavigation();
        
        // Показываем обзор
        this.showSection('overview');
        
        console.log('✅ Helper Panel инициализирован');
    }
    
    async waitForFirebase() {
        let attempts = 0;
        while ((!window.firebaseSync || !window.firebaseSync.initialized) && attempts < 50) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        if (!window.firebaseSync || !window.firebaseSync.initialized) {
            console.error('❌ Firebase не инициализирован');
            alert('Ошибка подключения к базе данных. Перезагрузите страницу.');
        } else {
            console.log('✅ Firebase готов');
        }
    }
    
    subscribeToChanges() {
        if (!window.firebaseSync) return;
        
        // Подписка на пользователей
        const usersUnsub = window.firebaseSync.subscribeToUsers(users => {
            this.users = users;
            if (this.currentSection === 'users') {
                this.renderUsers();
            }
            this.updateOverview();
        });
        this.unsubscribers.push(usersUnsub);
        
        // Подписка на тикеты
        const ticketsUnsub = window.firebaseSync.subscribeToTickets(tickets => {
            this.tickets = tickets;
            if (this.currentSection === 'tickets') {
                this.renderTickets();
            }
            this.updateOverview();
        });
        this.unsubscribers.push(ticketsUnsub);
        
        console.log('✅ Подписки на изменения активированы');
    }
    
    async loadAllData() {
        if (!window.firebaseSync) return;
        
        try {
            this.users = await window.firebaseSync.getAllUsers();
            this.tickets = await window.firebaseSync.getAllTickets();
            this.licenses = await window.firebaseSync.getAllLicenses();
            this.bans = await window.firebaseSync.getAllBans();
            
            console.log('✅ Данные загружены:', {
                users: Object.keys(this.users).length,
                tickets: this.tickets.length,
                licenses: this.licenses.length,
                bans: this.bans.length
            });
            
            this.updateOverview();
        } catch (error) {
            console.error('❌ Ошибка загрузки данных:', error);
        }
    }
    
    initNavigation() {
        const navItems = document.querySelectorAll('[data-section]');
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const section = item.getAttribute('data-section');
                this.showSection(section);
            });
        });
    }
    
    showSection(sectionName) {
        this.currentSection = sectionName;
        
        // Скрываем все секции
        document.querySelectorAll('.content-section').forEach(section => {
            section.style.display = 'none';
        });
        
        // Показываем нужную секцию
        const targetSection = document.getElementById(sectionName + 'Section');
        if (targetSection) {
            targetSection.style.display = 'block';
        }
        
        // Обновляем активный пункт меню
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        const activeItem = document.querySelector(`[data-section="${sectionName}"]`);
        if (activeItem) {
            activeItem.classList.add('active');
        }
        
        // Рендерим содержимое секции
        switch(sectionName) {
            case 'overview':
                this.updateOverview();
                break;
            case 'users':
                this.renderUsers();
                break;
            case 'tickets':
                this.renderTickets();
                break;
            case 'keys':
                this.renderKeys();
                break;
            case 'bans':
                this.renderBans();
                break;
        }
    }
    
    updateOverview() {
        const totalUsers = Object.keys(this.users).length;
        const totalTickets = this.tickets.length;
        const pendingTickets = this.tickets.filter(t => t.status === 'pending').length;
        const totalLicenses = this.licenses.length;
        
        document.getElementById('totalUsers').textContent = totalUsers;
        document.getElementById('totalTickets').textContent = totalTickets;
        document.getElementById('pendingTickets').textContent = pendingTickets;
        document.getElementById('totalLicenses').textContent = totalLicenses;
    }
    
    renderUsers() {
        const container = document.getElementById('usersContainer');
        if (!container) return;
        
        const usersList = Object.entries(this.users);
        
        if (usersList.length === 0) {
            container.innerHTML = '<p style="color: rgba(255,255,255,0.6);">Пользователей пока нет</p>';
            return;
        }
        
        container.innerHTML = usersList.map(([username, user]) => `
            <div class="user-card">
                <div class="user-header">
                    <div class="user-name">${username}</div>
                    <div class="user-role">${user.role || 'user'}</div>
                </div>
                <div class="user-info">
                    <div><strong>Email:</strong> ${user.email}</div>
                    <div><strong>Регистрация:</strong> ${new Date(user.createdAt).toLocaleString('ru-RU')}</div>
                    <div><strong>HWID:</strong> ${user.hwid || 'Не привязан'}</div>
                    <div><strong>Лицензий:</strong> ${user.licenses ? user.licenses.length : 0}</div>
                </div>
                ${user.banned ? `
                    <div class="ban-info">
                        ⛔ Заблокирован ${user.bannedUntil ? 'до ' + new Date(user.bannedUntil).toLocaleString('ru-RU') : 'навсегда'}
                    </div>
                ` : ''}
            </div>
        `).join('');
    }
    
    renderTickets() {
        const container = document.getElementById('ticketsContainer');
        if (!container) return;
        
        if (this.tickets.length === 0) {
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
        
        container.innerHTML = this.tickets.map(ticket => `
            <div class="ticket-card">
                <div class="ticket-header">
                    <div class="ticket-title">${ticket.subject}</div>
                    <select class="ticket-status-select" onchange="helperPanel.changeTicketStatus('${ticket.id}', this.value)">
                        ${Object.entries(statusNames).map(([value, label]) => 
                            `<option value="${value}" ${ticket.status === value ? 'selected' : ''}>${label}</option>`
                        ).join('')}
                    </select>
                </div>
                <div class="ticket-info">
                    <div><strong>От:</strong> ${ticket.username}</div>
                    <div><strong>Создан:</strong> ${new Date(ticket.createdAt).toLocaleString('ru-RU')}</div>
                </div>
                <div class="ticket-message">${ticket.message}</div>
                ${ticket.responses && ticket.responses.length > 0 ? `
                    <div class="ticket-responses">
                        <strong>Ответы:</strong>
                        ${ticket.responses.map(r => `
                            <div class="response-item">
                                <div class="response-from">${r.from}</div>
                                <div class="response-message">${r.message}</div>
                                <div class="response-date">${new Date(r.date).toLocaleString('ru-RU')}</div>
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
                <div class="ticket-actions">
                    <input type="text" id="response_${ticket.id}" placeholder="Ваш ответ..." class="response-input">
                    <button onclick="helperPanel.respondToTicket('${ticket.id}')" class="btn-respond">Ответить</button>
                </div>
            </div>
        `).join('');
    }
    
    async changeTicketStatus(ticketId, newStatus) {
        try {
            await window.firebaseSync.updateTicketStatus(ticketId, newStatus);
            this.showNotification('Статус тикета обновлен', 'success');
        } catch (error) {
            console.error('❌ Ошибка обновления статуса:', error);
            this.showNotification('Ошибка обновления статуса', 'error');
        }
    }
    
    async respondToTicket(ticketId) {
        const input = document.getElementById(`response_${ticketId}`);
        const message = input.value.trim();
        
        if (!message) {
            this.showNotification('Введите ответ', 'warning');
            return;
        }
        
        const response = {
            from: 'Helper',
            message: message,
            date: new Date().toISOString()
        };
        
        try {
            await window.firebaseSync.addTicketResponse(ticketId, response);
            input.value = '';
            this.showNotification('Ответ отправлен', 'success');
        } catch (error) {
            console.error('❌ Ошибка отправки ответа:', error);
            this.showNotification('Ошибка отправки ответа', 'error');
        }
    }
    
    renderKeys() {
        const container = document.getElementById('keysContainer');
        if (!container) return;
        
        container.innerHTML = `
            <div class="key-generator">
                <h3>Генератор ключей</h3>
                <div class="form-group">
                    <label>Тип лицензии:</label>
                    <select id="keyType">
                        <option value="1day">1 день</option>
                        <option value="7days">7 дней</option>
                        <option value="30days">30 дней</option>
                        <option value="lifetime">Навсегда</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Количество (1-100):</label>
                    <input type="number" id="keyCount" min="1" max="100" value="1">
                </div>
                <button onclick="helperPanel.generateKeys()" class="btn-generate">Сгенерировать</button>
                
                <div id="generatedKeys" class="generated-keys"></div>
            </div>
            
            <div class="keys-history">
                <h3>История ключей</h3>
                <div id="keysHistoryList">
                    ${this.licenses.length === 0 ? 
                        '<p style="color: rgba(255,255,255,0.6);">Ключей пока нет</p>' :
                        this.licenses.map(license => `
                            <div class="key-item">
                                <div class="key-value">${license.key}</div>
                                <div class="key-info">
                                    <span>Тип: ${license.type}</span>
                                    <span>Создан: ${new Date(license.createdAt).toLocaleString('ru-RU')}</span>
                                    <span>Статус: ${license.used ? 'Использован' : 'Не использован'}</span>
                                </div>
                            </div>
                        `).join('')
                    }
                </div>
            </div>
        `;
    }
    
    async generateKeys() {
        const type = document.getElementById('keyType').value;
        const count = parseInt(document.getElementById('keyCount').value);
        
        if (count < 1 || count > 100) {
            this.showNotification('Количество должно быть от 1 до 100', 'warning');
            return;
        }
        
        const keys = [];
        for (let i = 0; i < count; i++) {
            const key = this.generateLicenseKey();
            const licenseData = {
                key: key,
                type: type,
                used: false,
                createdAt: new Date().toISOString(),
                createdBy: 'Helper'
            };
            
            keys.push(key);
            await window.firebaseSync.saveLicense(key, licenseData);
        }
        
        this.licenses = await window.firebaseSync.getAllLicenses();
        
        const container = document.getElementById('generatedKeys');
        container.innerHTML = `
            <div class="success-message">
                ✅ Сгенерировано ключей: ${count}
                <button onclick="helperPanel.copyKeys(\`${keys.join('\\n')}\`)" class="btn-copy">Копировать все</button>
            </div>
            <div class="keys-list">
                ${keys.map(key => `<div class="key-item-new">${key}</div>`).join('')}
            </div>
        `;
        
        this.showNotification(`Сгенерировано ${count} ключей`, 'success');
        this.renderKeys();
    }
    
    generateLicenseKey() {
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
    
    copyKeys(text) {
        navigator.clipboard.writeText(text).then(() => {
            this.showNotification('Ключи скопированы', 'success');
        });
    }
    
    renderBans() {
        const container = document.getElementById('bansContainer');
        if (!container) return;
        
        container.innerHTML = `
            <div class="ban-forms">
                <div class="ban-form">
                    <h3>Бан по логину</h3>
                    <input type="text" id="banUsername" placeholder="Логин пользователя">
                    <select id="banDuration">
                        <option value="1">1 час</option>
                        <option value="24">1 день</option>
                        <option value="168">7 дней</option>
                        <option value="720">30 дней</option>
                        <option value="permanent">Навсегда</option>
                    </select>
                    <input type="text" id="banReason" placeholder="Причина бана">
                    <button onclick="helperPanel.banUser()" class="btn-ban">Забанить</button>
                </div>
                
                <div class="ban-form">
                    <h3>Бан по IP</h3>
                    <input type="text" id="banIP" placeholder="IP адрес">
                    <input type="text" id="banIPReason" placeholder="Причина бана">
                    <button onclick="helperPanel.banIP()" class="btn-ban">Забанить IP</button>
                </div>
            </div>
            
            <div class="bans-list">
                <h3>Активные баны</h3>
                ${this.bans.length === 0 ?
                    '<p style="color: rgba(255,255,255,0.6);">Активных банов нет</p>' :
                    this.bans.map(ban => `
                        <div class="ban-item">
                            <div class="ban-info">
                                <div><strong>${ban.type === 'username' ? 'Логин' : 'IP'}:</strong> ${ban.value}</div>
                                <div><strong>Причина:</strong> ${ban.reason}</div>
                                <div><strong>До:</strong> ${ban.until === 'permanent' ? 'Навсегда' : new Date(ban.until).toLocaleString('ru-RU')}</div>
                                <div><strong>Создан:</strong> ${new Date(ban.createdAt).toLocaleString('ru-RU')}</div>
                            </div>
                            <button onclick="helperPanel.unban('${ban.id}')" class="btn-unban">Разбанить</button>
                        </div>
                    `).join('')
                }
            </div>
        `;
    }
    
    async banUser() {
        const username = document.getElementById('banUsername').value.trim();
        const duration = document.getElementById('banDuration').value;
        const reason = document.getElementById('banReason').value.trim();
        
        if (!username || !reason) {
            this.showNotification('Заполните все поля', 'warning');
            return;
        }
        
        if (!this.users[username]) {
            this.showNotification('Пользователь не найден', 'error');
            return;
        }
        
        const banUntil = duration === 'permanent' ? 'permanent' : 
            new Date(Date.now() + parseInt(duration) * 60 * 60 * 1000).toISOString();
        
        // Обновляем пользователя
        this.users[username].banned = true;
        this.users[username].bannedUntil = banUntil;
        await window.firebaseSync.saveUser(username, this.users[username]);
        
        // Сохраняем бан
        const banId = 'ban_' + Date.now();
        const banData = {
            type: 'username',
            value: username,
            reason: reason,
            until: banUntil,
            createdAt: new Date().toISOString(),
            createdBy: 'Helper'
        };
        await window.firebaseSync.saveBan(banId, banData);
        
        this.bans = await window.firebaseSync.getAllBans();
        this.showNotification('Пользователь забанен', 'success');
        this.renderBans();
    }
    
    async banIP() {
        const ip = document.getElementById('banIP').value.trim();
        const reason = document.getElementById('banIPReason').value.trim();
        
        if (!ip || !reason) {
            this.showNotification('Заполните все поля', 'warning');
            return;
        }
        
        const banId = 'ban_ip_' + Date.now();
        const banData = {
            type: 'ip',
            value: ip,
            reason: reason,
            until: 'permanent',
            createdAt: new Date().toISOString(),
            createdBy: 'Helper'
        };
        
        await window.firebaseSync.saveBan(banId, banData);
        this.bans = await window.firebaseSync.getAllBans();
        this.showNotification('IP забанен', 'success');
        this.renderBans();
    }
    
    async unban(banId) {
        await window.firebaseSync.removeBan(banId);
        this.bans = await window.firebaseSync.getAllBans();
        this.showNotification('Бан снят', 'success');
        this.renderBans();
    }
    
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

// Инициализация при загрузке
let helperPanel;
window.addEventListener('load', () => {
    helperPanel = new HelperPanel();
    window.helperPanel = helperPanel;
});

console.log('✅ helper.js загружен');
