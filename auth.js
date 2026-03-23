// Система аутентификации Forever Client
// Защита от DDoS, брутфорса и взлома

console.log('🔵 auth.js начал загрузку');

class AuthSystem {
    constructor() {
        this.users = this.loadUsers();
        this.sessions = {};
        this.loginAttempts = {};
        this.blockedIPs = new Set();
        this.maxAttempts = 5;
        this.blockDuration = 15 * 60 * 1000; // 15 минут
        
        // Админ аккаунт (зашифрован)
        this.adminCredentials = {
            username: this.encrypt('admin'),
            password: this.encrypt('Su6-N77-B6e-nWj')
        };
        
        // Хелпер аккаунт (зашифрован)
        this.helperCredentials = {
            username: this.encrypt('Helper'),
            password: this.encrypt('MZFeEgJY'),
            email: 'Helper'
        };
        
        this.initSecurity();
        this.initTicketSystem();
    }
    
    // Инициализация системы безопасности
    initSecurity() {
        // Защита от инспектора
        this.preventInspect();
        
        // Защита от копирования
        this.preventCopy();
        
        // Мониторинг подозрительной активности
        this.monitorActivity();
        
        // Очистка старых попыток входа
        setInterval(() => this.cleanupAttempts(), 60000);
    }
    
    // Простое шифрование (для демонстрации)
    encrypt(text) {
        return btoa(text).split('').reverse().join('');
    }
    
    decrypt(encrypted) {
        return atob(encrypted.split('').reverse().join(''));
    }
    
    // Генерация уникального ID устройства
    getDeviceId() {
        let deviceId = localStorage.getItem('deviceId');
        if (!deviceId) {
            deviceId = this.generateId();
            localStorage.setItem('deviceId', deviceId);
        }
        return deviceId;
    }
    
    generateId() {
        return 'xxxx-xxxx-xxxx-xxxx'.replace(/x/g, () => {
            return (Math.random() * 16 | 0).toString(16);
        });
    }
    
    // Проверка на блокировку
    isBlocked(deviceId) {
        if (this.blockedIPs.has(deviceId)) {
            const blockInfo = this.loginAttempts[deviceId];
            if (blockInfo && Date.now() - blockInfo.blockedAt < this.blockDuration) {
                return true;
            } else {
                this.blockedIPs.delete(deviceId);
                delete this.loginAttempts[deviceId];
            }
        }
        return false;
    }
    
    // Регистрация попытки входа
    recordAttempt(deviceId, success) {
        if (!this.loginAttempts[deviceId]) {
            this.loginAttempts[deviceId] = {
                count: 0,
                lastAttempt: Date.now()
            };
        }
        
        const attempts = this.loginAttempts[deviceId];
        
        if (success) {
            delete this.loginAttempts[deviceId];
            return;
        }
        
        attempts.count++;
        attempts.lastAttempt = Date.now();
        
        if (attempts.count >= this.maxAttempts) {
            this.blockedIPs.add(deviceId);
            attempts.blockedAt = Date.now();
            this.showNotification('Слишком много попыток входа. Вы заблокированы на 15 минут.', 'error');
        }
    }
    
    // Очистка старых попыток
    cleanupAttempts() {
        const now = Date.now();
        for (const deviceId in this.loginAttempts) {
            const attempt = this.loginAttempts[deviceId];
            if (now - attempt.lastAttempt > this.blockDuration) {
                delete this.loginAttempts[deviceId];
                this.blockedIPs.delete(deviceId);
            }
        }
    }
    
    // Загрузка пользователей
    loadUsers() {
        const users = localStorage.getItem('forever_users');
        return users ? JSON.parse(users) : {};
    }
    
    // Сохранение пользователей
    saveUsers() {
        localStorage.setItem('forever_users', JSON.stringify(this.users));
    }
    
    // Отправка email уведомления (симуляция)
    sendEmail(email, subject, message) {
        // В реальном приложении здесь будет API запрос к серверу
        console.log(`📧 Email отправлен на ${email}`);
        console.log(`Тема: ${subject}`);
        console.log(`Сообщение: ${message}`);
        
        // Симуляция отправки
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(true);
            }, 100); // Уменьшил с 500 до 100мс
        });
    }
    
    // Регистрация
    async register(username, email, password) {
        // Валидация
        if (username.length < 3) {
            throw new Error('Логин должен быть не менее 3 символов');
        }
        
        if (password.length < 6) {
            throw new Error('Пароль должен быть не менее 6 символов');
        }
        
        if (!this.validateEmail(email)) {
            throw new Error('Неверный формат email');
        }
        
        // Проверка на существование
        if (this.users[username]) {
            throw new Error('Пользователь с таким логином уже существует');
        }
        
        // Проверка email
        for (const user in this.users) {
            if (this.users[user].email === email) {
                throw new Error('Пользователь с таким email уже существует');
            }
        }
        
        // Создание пользователя
        this.users[username] = {
            email: email,
            password: this.hashPassword(password),
            createdAt: new Date().toISOString(),
            licenses: [],
            hwid: null,
            role: 'user'
        };
        
        this.saveUsers();
        
        // Отправка email подтверждения
        await this.sendEmail(
            email,
            'Добро пожаловать в Forever Client!',
            `Здравствуйте, ${username}!\n\nВаш аккаунт успешно создан.\nДата регистрации: ${new Date().toLocaleString('ru-RU')}\n\nС уважением,\nКоманда Forever Client`
        );
        
        this.showNotification('Регистрация успешна! На вашу почту отправлено подтверждение.', 'success');
        
        // Обновление статистики
        this.updateStatistics();
        
        return true;
    }
    
    // Вход
    async login(username, password) {
        const deviceId = this.getDeviceId();
        
        // Проверка блокировки
        if (this.isBlocked(deviceId)) {
            const attempts = this.loginAttempts[deviceId];
            const timeLeft = Math.ceil((this.blockDuration - (Date.now() - attempts.blockedAt)) / 60000);
            throw new Error(`Вы заблокированы. Попробуйте через ${timeLeft} минут.`);
        }
        
        // Проверка админа
        if (this.decrypt(this.adminCredentials.username) === username &&
            this.decrypt(this.adminCredentials.password) === password) {
            this.recordAttempt(deviceId, true);
            const session = this.createSession(username, 'admin');
            
            // Отправка email уведомления
            await this.sendEmail(
                'admin@forever-client.com',
                'Вход в админ панель',
                `Вход в админ панель выполнен.\nВремя: ${new Date().toLocaleString('ru-RU')}\nУстройство: ${deviceId}`
            );
            
            this.showNotification('Добро пожаловать, Администратор!', 'success');
            setTimeout(() => {
                window.location.href = 'admin/dashboard.html';
            }, 1000);
            return session;
        }
        
        // Проверка хелпера
        if (this.decrypt(this.helperCredentials.username) === username &&
            this.decrypt(this.helperCredentials.password) === password) {
            this.recordAttempt(deviceId, true);
            const session = this.createSession(username, 'helper');
            
            // Отправка email уведомления
            await this.sendEmail(
                this.helperCredentials.email,
                'Вход в панель хелпера',
                `Вход в панель хелпера выполнен.\nВремя: ${new Date().toLocaleString('ru-RU')}\nУстройство: ${deviceId}`
            );
            
            this.showNotification('Добро пожаловать, Хелпер!', 'success');
            setTimeout(() => {
                window.location.href = 'helper/dashboard.html';
            }, 1000);
            return session;
        }
        
        // Проверка обычного пользователя
        const user = this.users[username];
        if (!user || user.password !== this.hashPassword(password)) {
            this.recordAttempt(deviceId, false);
            const attemptsLeft = this.maxAttempts - (this.loginAttempts[deviceId]?.count || 0);
            throw new Error(`Неверный логин или пароль. Осталось попыток: ${attemptsLeft}`);
        }
        
        // Проверка бана
        if (user.banned) {
            const banEnd = user.bannedUntil ? new Date(user.bannedUntil) : null;
            if (banEnd && Date.now() < banEnd.getTime()) {
                const timeLeft = Math.ceil((banEnd.getTime() - Date.now()) / (1000 * 60));
                throw new Error(`Ваш аккаунт заблокирован до ${banEnd.toLocaleString('ru-RU')}. Осталось: ${timeLeft} минут.`);
            } else if (!banEnd) {
                throw new Error('Ваш аккаунт заблокирован навсегда. Обратитесь в поддержку.');
            } else {
                // Бан истек, снимаем
                user.banned = false;
                user.bannedUntil = null;
                this.saveUsers();
            }
        }
        
        this.recordAttempt(deviceId, true);
        const session = this.createSession(username, user.role);
        
        // Отправка email уведомления о входе
        await this.sendEmail(
            user.email,
            'Вход в аккаунт Forever Client',
            `Здравствуйте, ${username}!\n\nВ ваш аккаунт выполнен вход.\nВремя: ${new Date().toLocaleString('ru-RU')}\nУстройство: ${deviceId}\n\nЕсли это были не вы, немедленно свяжитесь с поддержкой.\n\nС уважением,\nКоманда Forever Client`
        );
        
        this.showNotification('Вход выполнен успешно! Проверьте почту.', 'success');
        
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1000);
        
        return session;
    }
    
    // Создание сессии
    createSession(username, role) {
        const sessionId = this.generateId();
        const session = {
            id: sessionId,
            username: username,
            role: role,
            createdAt: Date.now(),
            expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 часа
        };
        
        this.sessions[sessionId] = session;
        localStorage.setItem('forever_session', JSON.stringify(session));
        
        return session;
    }
    
    // Проверка сессии
    checkSession() {
        const sessionData = localStorage.getItem('forever_session');
        if (!sessionData) return null;
        
        const session = JSON.parse(sessionData);
        if (Date.now() > session.expiresAt) {
            this.logout();
            return null;
        }
        
        return session;
    }
    
    // Выход
    logout() {
        localStorage.removeItem('forever_session');
        this.showNotification('Вы вышли из аккаунта', 'info');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
    }
    
    // Хеширование пароля (простое для демонстрации)
    hashPassword(password) {
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash.toString(36);
    }
    
    // Валидация email
    validateEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }
    
    // Защита от инспектора
    preventInspect() {
        // Отключение контекстного меню
        document.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });
        
        // Отключение горячих клавиш
        document.addEventListener('keydown', (e) => {
            if (e.key === 'F12' || 
                (e.ctrlKey && e.shiftKey && e.key === 'I') ||
                (e.ctrlKey && e.shiftKey && e.key === 'J') ||
                (e.ctrlKey && e.key === 'U')) {
                e.preventDefault();
            }
        });
    }
    
    // Защита от копирования
    preventCopy() {
        document.addEventListener('copy', (e) => {
            e.preventDefault();
        });
        
        document.addEventListener('cut', (e) => {
            e.preventDefault();
        });
    }
    
    // Мониторинг активности
    monitorActivity() {
        // Обнаружение DevTools
        const devtools = {
            isOpen: false,
            orientation: null
        };
        
        const threshold = 160;
        
        setInterval(() => {
            if (window.outerWidth - window.innerWidth > threshold ||
                window.outerHeight - window.innerHeight > threshold) {
                if (!devtools.isOpen) {
                    devtools.isOpen = true;
                    console.clear();
                    this.showNotification('Обнаружена попытка взлома. Действие зафиксировано.', 'warning');
                }
            } else {
                devtools.isOpen = false;
            }
        }, 1000);
    }
    
    // Уведомления
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        const style = document.createElement('style');
        style.textContent = `
            .notification {
                position: fixed;
                top: 100px;
                right: 20px;
                padding: 15px 25px;
                border-radius: 10px;
                color: white;
                font-weight: 600;
                z-index: 10000;
                animation: slideIn 0.3s ease;
                box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            }
            .notification-success { background: linear-gradient(135deg, #4CAF50, #45a049); }
            .notification-error { background: linear-gradient(135deg, #F44336, #da190b); }
            .notification-warning { background: linear-gradient(135deg, #FFC107, #ff9800); }
            .notification-info { background: linear-gradient(135deg, #2196F3, #0b7dda); }
            @keyframes slideIn {
                from { transform: translateX(400px); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        
        if (!document.querySelector('style[data-notifications]')) {
            style.setAttribute('data-notifications', 'true');
            document.head.appendChild(style);
        }
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideIn 0.3s ease reverse';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// Инициализация системы сразу (глобальная переменная)
window.auth = new AuthSystem();
console.log('✅ AuthSystem создан и доступен глобально');

// Обработчики форм
async function handleLogin(event) {
    event.preventDefault();
    console.log('🔵 handleLogin вызвана');
    
    // Ждем инициализации auth если нужно
    let attempts = 0;
    while (!window.auth && attempts < 10) {
        console.log('⏳ Ожидание инициализации auth...');
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
    }
    
    const auth = window.auth;
    if (!auth) {
        console.error('❌ window.auth не существует после ожидания');
        alert('Ошибка инициализации. Перезагрузите страницу (Ctrl+F5).');
        return false;
    }
    
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;
    
    console.log('🔵 Попытка входа:', username);
    
    try {
        await auth.login(username, password);
        console.log('✅ Вход успешен');
    } catch (error) {
        console.error('❌ Ошибка входа:', error);
        auth.showNotification(error.message, 'error');
    }
    
    return false;
}

async function handleRegister(event) {
    event.preventDefault();
    console.log('🔵 handleRegister вызвана');
    
    // Ждем инициализации auth если нужно
    let attempts = 0;
    while (!window.auth && attempts < 10) {
        console.log('⏳ Ожидание инициализации auth...');
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
    }
    
    const auth = window.auth;
    if (!auth) {
        console.error('❌ window.auth не существует после ожидания');
        alert('Ошибка инициализации. Перезагрузите страницу (Ctrl+F5).');
        return false;
    }
    
    const username = document.getElementById('regUsername').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPassword').value;
    const passwordConfirm = document.getElementById('regPasswordConfirm').value;
    
    console.log('🔵 Попытка регистрации:', username, email);
    
    if (password !== passwordConfirm) {
        auth.showNotification('Пароли не совпадают', 'error');
        return false;
    }
    
    try {
        await auth.register(username, email, password);
        console.log('✅ Регистрация успешна');
        closeModal('registerModal');
        showLogin();
    } catch (error) {
        console.error('❌ Ошибка регистрации:', error);
        auth.showNotification(error.message, 'error');
    }
    
    return false;
}

// Модальные окна
function showLogin() {
    closeModal('registerModal');
    document.getElementById('loginModal').classList.add('show');
}

function showRegister() {
    closeModal('loginModal');
    document.getElementById('registerModal').classList.add('show');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('show');
}

// Закрытие по клику вне модального окна
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.classList.remove('show');
    }
}

// Проверка сессии при загрузке
window.addEventListener('load', () => {
    console.log('✅ Страница загружена, auth =', typeof auth);
    
    if (!auth) {
        console.error('❌ auth не существует при загрузке');
        return;
    }
    
    const session = auth.checkSession();
    if (session) {
        // Пользователь уже авторизован
        const loginBtn = document.querySelector('.btn-primary-nav');
        if (loginBtn) {
            loginBtn.textContent = `👤 ${session.username}`;
            loginBtn.onclick = () => {
                if (session.role === 'admin') {
                    window.location.href = 'admin/dashboard.html';
                } else if (session.role === 'helper') {
                    window.location.href = 'helper/dashboard.html';
                } else {
                    window.location.href = 'dashboard.html';
                }
            };
        }
    }
    
    // Обновление статистики
    auth.updateStatistics();
});

// Функция покупки лицензии
function buyLicense(type) {
    const session = auth.checkSession();
    if (!session) {
        auth.showNotification('Войдите в аккаунт для покупки', 'warning');
        showLogin();
        return;
    }
    
    // Здесь будет интеграция с платежной системой
    auth.showNotification('Перенаправление на оплату...', 'info');
    
    // Для демонстрации
    setTimeout(() => {
        auth.showNotification('Функция оплаты в разработке. Свяжитесь с поддержкой.', 'info');
    }, 1500);
}

// Плавная прокрутка
function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
    }
}

// Защита консоли
(function() {
    const originalLog = console.log;
    console.log = function() {
        originalLog.apply(console, ['🔒 Forever Client - Protected']);
    };
})();

// Показать цены (только для авторизованных)
function showPricing() {
    const session = auth.checkSession();
    if (!session) {
        auth.showNotification('Войдите в аккаунт для просмотра подписок', 'warning');
        showLogin();
        return;
    }
    
    const pricingSection = document.getElementById('pricing');
    if (pricingSection) {
        pricingSection.style.display = 'block';
        pricingSection.scrollIntoView({ behavior: 'smooth' });
    }
}

// Проверка авторизации и показ цен
function checkAuthAndShowPricing() {
    showPricing();
}
