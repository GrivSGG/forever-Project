// Простая версия auth для тестирования
console.log('✅ auth-simple.js загружен!');

window.auth = {
    login: async function(username, password) {
        console.log('Попытка входа:', username);
        
        // Простая проверка админа
        if (username === 'admin' && password === 'Su6-N77-B6e-nWj') {
            alert('Вход успешен! (Простая версия)');
            window.location.href = 'admin/dashboard.html';
            return true;
        }
        
        alert('Неверный логин или пароль');
        return false;
    },
    
    register: async function(username, email, password) {
        console.log('Регистрация:', username, email);
        alert('Регистрация успешна! (Простая версия)');
        return true;
    },
    
    showNotification: function(message, type) {
        alert(message);
    },
    
    checkSession: function() {
        return null;
    },
    
    updateStatistics: function() {
        console.log('Статистика обновлена');
    }
};

console.log('✅ window.auth создан (простая версия)');
