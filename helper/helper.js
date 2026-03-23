// Панель хелпера Forever Client
console.log('�� helper.js загружается...');

class HelperPanel {
    constructor() {
        this.auth = window.auth;
        this.tickets = [];
        this.users = {};
        this.bannedUsers = [];
        this.blockedIPs = [];
        this.generatedKeys = [];
        
        this.init();
    }
    
    init() {
        const session = this.auth.checkSession();
        if (!session || session.role !== 'helper') {
            alert('Доступ запрещен! Только для хелперов.');
            window.location.href = '../index.html';
            return;
        }
        
        document.getElementById('helperName').textContent = session.username;
        
        this.loadData();
        this.updateStatistics();
        
        console.log('✅ Панель хелпера инициализирована');
    }
    
    loadData() {
        this.users = this.auth.loadUsers();
        this.tickets = this.loadTickets();
        this.bannedUsers = this.loadBannedUsers();
        this.blockedIPs = this.loadBlockedIPs();
        this.generatedKeys = this.loadGeneratedKeys();
        
        this.renderUsers();
        this.renderTickets();
        this.renderBannedUsers();
        this.renderBlockedIPs();
    }
    
    loadTickets() {
        const tickets = localStorage.getItem('forever_tickets');
        return tickets ? JSON.parse(tickets) : [];
    }
    
    saveTickets() {
        localStorage.setItem('forever_tickets', JSON.stringify(this.tickets));
    }
    
    loadBannedUsers() {
        const banned = [];
        for (const username in this.users) {
            const user = this.users[username];
            if (user.banned) {
                banned.push({
                    username: username,
                    reason: user.banReason || 'Не указана',
                    bannedAt: user.bannedAt || new Date().toISOString(),
                    bannedUntil: user.bannedUntil
                });
            }
        }
        return banned;
    }
    
    loadBlockedIPs() {
        const blocked = localStorage.getItem('forever_blocked_ips');
        return blocked ? JSON.parse(blocked) : [];
    }
    
    saveBlockedIPs() {
        localStorage.setItem('forever_blocked_ips', JSON.stringify(this.blockedIPs));
    }
    
    loadGeneratedKeys() {
        const keys = localStorage.getItem('forever_generated_keys');
        return keys ? JSON.parse(keys) : [];
    }
    
    saveGeneratedKeys() {
        localStorage.setItem('forever_generated_keys', JSON.stringify(this.generatedKeys));
    }
    
    updateStatistics() {
        document.getElementById('totalKeys').textContent = this.generatedKeys.length;
        
        const openTickets = this.tickets.filter(t => t.status === 'open').length;
        document.getElementById('openTickets').textContent = openTickets;
        
        const totalUsers = Object.keys(this.users).length;
        document.getElementById('totalUsers').textContent = totalUsers;
        
        document.getElementById('bannedUsers').textContent = this.bannedUsers.length;
        document.getElementById('blockedIPs').textContent = this.blockedIPs.length;
    }
