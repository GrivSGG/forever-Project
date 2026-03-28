// Система аутентификации Forever Client с Bcrypt
// Все операции через защищенный API

console.log('🔵 auth-bcrypt.js начал загрузку');

const API_URL = 'https://forever-project-production-a2fa.up.railway.app';

class AuthSystemBcrypt {
    constructor() {
        this.sessions = {};
        this.loginAttempts = {};
        this.blockedIPs = new Set();
        this.maxAttempts = 5;
        this.blockDuration = 15 * 60 * 1000; // 15 минут
        
        this.initSecurity();
    }
    
    // Инициализация системы безопасности
    initSecurity() {
        this.preventInspect();
        this.preventCopy();
        this.monitorActivity();
        setInterval(() => this.cleanupAttempts(), 60000);
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
    
    // Регистрация через API
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
        
        try {
            const response = await fetch(`${API_URL}/api/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, email, password })
            });
            
            const data = await response.json();
            
            if (!data.success) {
                if (data.error === 'USER_EXISTS') {
                    throw new Error('Пользователь с таким логином уже существует');
                }
                throw new Error(data.message || 'Ошибка регистрации');
            }
            
            this.showNotification('Регистрация успешна! Теперь вы можете войти.', 'success');
            return true;
            
        } catch (error) {
            console.error('Registration error:', error);
            throw error;
        }
    }
    
    // Вход через API
    async login(username, password) {
        const deviceId = this.getDeviceId();
        
        // Проверка блокировки
        if (this.isBlocked(deviceId)) {
            const attempts = this.loginAttempts[deviceId];
            const timeLeft = Math.ceil((this.blockDuration - (Date.now() - attempts.blockedAt)) / 60000);
            throw new Error(`Вы заблокированы. Попробуйте через ${timeLeft} минут.`);
        }
        
        try {
            const response = await fetch(`${API_URL}/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });
            
            const data = await response.json();
            
            if (!data.success) {
                this.recordAttempt(deviceId, false);
                const attemptsLeft = this.maxAttempts - (this.loginAttempts[deviceId]?.count || 0);
                
                if (data.error === 'USER_NOT_FOUND') {
                    throw new Error(`Пользователь не найден. Осталось попыток: ${attemptsLeft}`);
                } else if (data.error === 'WRONG_PASSWORD') {
                    throw new Error(`Неверный пароль. Осталось попыток: ${attemptsLeft}`);
                } else if (data.error === 'NO_SUBSCRIPTION') {
                    throw new Error('У вас нет активной подписки');
                } else if (data.error === 'BANNED') {
                    throw new Error('Ваш аккаунт заблокирован');
                }
                
                throw new Error(data.message || 'Ошибка входа');
            }
            
            this.recordAttempt(deviceId, true);
            const session = this.createSession(username, data.user.role);
            
            this.showNotification('Вход выполнен успешно!', 'success');
            
            setTimeout(() => {
                if (data.user.role === 'admin') {
                    window.location.href = 'admin/dashboard.html';
                } else if (data.user.role === 'helper') {
                    window.location.href = 'helper/dashboard.html';
                } else {
                    window.location.href = 'dashboard.html';
                }
            }, 1000);
            
            return session;
            
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
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
    
    // Валидация email
    validateEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }
    
    // Защита от инспектора
    preventInspect() {
        document.addEventListener('contextmenu', (e) => e.preventDefault());
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
        document.addEventListener('copy', (e) => e.preventDefault());
        document.addEventListener('cut', (e) => e.preventDefault());
    }
    
    // Мониторинг активности
    monitorActivity() {
        const threshold = 160;
        setInterval(() => {
            if (window.outerWidth - window.innerWidth > threshold ||
                window.outerHeight - window.innerHeight > threshold) {
                console.clear();
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

// Инициализация системы
window.auth = new AuthSystemBcrypt();
console.log('✅ AuthSystemBcrypt создан и доступен глобально');

// Обработчики форм
window.handleLogin = async function(event) {
    event.preventDefault();
    
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;
    
    try {
        await window.auth.login(username, password);
    } catch (error) {
        window.auth.showNotification(error.message, 'error');
    }
    
    return false;
}

window.handleRegister = async function(event) {
    event.preventDefault();
    
    const username = document.getElementById('regUsername').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPassword').value;
    const passwordConfirm = document.getElementById('regPasswordConfirm').value;
    
    if (password !== passwordConfirm) {
        window.auth.showNotification('Пароли не совпадают', 'error');
        return false;
    }
    
    try {
        await window.auth.register(username, email, password);
        closeModal('registerModal');
        showLogin();
    } catch (error) {
        window.auth.showNotification(error.message, 'error');
    }
    
    return false;
}

// Модальные окна
window.showLogin = function() {
    closeModal('registerModal');
    document.getElementById('loginModal').classList.add('show');
}

window.showRegister = function() {
    closeModal('loginModal');
    document.getElementById('registerModal').classList.add('show');
}

window.closeModal = function(modalId) {
    document.getElementById(modalId).classList.remove('show');
}

window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.classList.remove('show');
    }
}

// Проверка сессии при загрузке
window.addEventListener('load', () => {
    const session = window.auth.checkSession();
    if (session) {
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
});
