// Firebase Sync System для Forever Client
// Автоматическая синхронизация пользователей, тикетов, лицензий

console.log('🔵 firebase-sync.js начал загрузку');

class FirebaseSync {
    constructor() {
        this.db = null;
        this.initialized = false;
        this.listeners = [];
        this.init();
    }
    
    async init() {
        try {
            // Проверка наличия Firebase SDK
            if (typeof firebase === 'undefined') {
                console.error('❌ Firebase SDK не загружен');
                return;
            }
            
            // Инициализация Firebase
            if (!firebase.apps.length) {
                firebase.initializeApp(window.firebaseConfig);
                console.log('✅ Firebase инициализирован');
            }
            
            // Получение Firestore
            this.db = firebase.firestore();
            this.initialized = true;
            
            console.log('✅ Firestore подключен');
            
            // Миграция данных из localStorage в Firestore
            await this.migrateLocalData();
            
        } catch (error) {
            console.error('❌ Ошибка инициализации Firebase:', error);
        }
    }
    
    // Миграция данных из localStorage в Firestore
    async migrateLocalData() {
        try {
            // Миграция пользователей
            const users = localStorage.getItem('forever_users');
            if (users) {
                const usersData = JSON.parse(users);
                for (const username in usersData) {
                    await this.saveUser(username, usersData[username]);
                }
                console.log('✅ Пользователи мигрированы в Firestore');
            }
            
            // Миграция тикетов
            const tickets = localStorage.getItem('forever_tickets');
            if (tickets) {
                const ticketsData = JSON.parse(tickets);
                for (const ticket of ticketsData) {
                    await this.saveTicket(ticket);
                }
                console.log('✅ Тикеты мигрированы в Firestore');
            }
            
        } catch (error) {
            console.error('❌ Ошибка миграции данных:', error);
        }
    }
    
    // Сохранение пользователя
    async saveUser(username, userData) {
        if (!this.initialized) {
            console.warn('⚠️ Firebase не инициализирован');
            return;
        }
        
        try {
            await this.db.collection('users').doc(username).set({
                ...userData,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
            
            console.log('✅ Пользователь сохранен:', username);
        } catch (error) {
            console.error('❌ Ошибка сохранения пользователя:', error);
        }
    }
    
    // Получение всех пользователей
    async getAllUsers() {
        if (!this.initialized) {
            console.warn('⚠️ Firebase не инициализирован');
            return {};
        }
        
        try {
            const snapshot = await this.db.collection('users').get();
            const users = {};
            
            snapshot.forEach(doc => {
                users[doc.id] = doc.data();
            });
            
            console.log('✅ Загружено пользователей:', Object.keys(users).length);
            return users;
        } catch (error) {
            console.error('❌ Ошибка загрузки пользователей:', error);
            return {};
        }
    }
    
    // Подписка на изменения пользователей (реальное время)
    subscribeToUsers(callback) {
        if (!this.initialized) {
            console.warn('⚠️ Firebase не инициализирован');
            return null;
        }
        
        const unsubscribe = this.db.collection('users').onSnapshot(snapshot => {
            const users = {};
            snapshot.forEach(doc => {
                users[doc.id] = doc.data();
            });
            callback(users);
        });
        
        this.listeners.push(unsubscribe);
        return unsubscribe;
    }
    
    // Сохранение тикета
    async saveTicket(ticket) {
        if (!this.initialized) {
            console.warn('⚠️ Firebase не инициализирован');
            return;
        }
        
        try {
            await this.db.collection('tickets').doc(ticket.id).set({
                ...ticket,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
            
            console.log('✅ Тикет сохранен:', ticket.id);
        } catch (error) {
            console.error('❌ Ошибка сохранения тикета:', error);
        }
    }
    
    // Получение всех тикетов
    async getAllTickets() {
        if (!this.initialized) {
            console.warn('⚠️ Firebase не инициализирован');
            return [];
        }
        
        try {
            const snapshot = await this.db.collection('tickets').orderBy('createdAt', 'desc').get();
            const tickets = [];
            
            snapshot.forEach(doc => {
                tickets.push(doc.data());
            });
            
            console.log('✅ Загружено тикетов:', tickets.length);
            return tickets;
        } catch (error) {
            console.error('❌ Ошибка загрузки тикетов:', error);
            return [];
        }
    }
    
    // Подписка на изменения тикетов (реальное время)
    subscribeToTickets(callback) {
        if (!this.initialized) {
            console.warn('⚠️ Firebase не инициализирован');
            return null;
        }
        
        const unsubscribe = this.db.collection('tickets').orderBy('createdAt', 'desc').onSnapshot(snapshot => {
            const tickets = [];
            snapshot.forEach(doc => {
                tickets.push(doc.data());
            });
            callback(tickets);
        });
        
        this.listeners.push(unsubscribe);
        return unsubscribe;
    }
    
    // Обновление статуса тикета
    async updateTicketStatus(ticketId, status) {
        if (!this.initialized) {
            console.warn('⚠️ Firebase не инициализирован');
            return;
        }
        
        try {
            await this.db.collection('tickets').doc(ticketId).update({
                status: status,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            console.log('✅ Статус тикета обновлен:', ticketId, status);
        } catch (error) {
            console.error('❌ Ошибка обновления статуса тикета:', error);
        }
    }
    
    // Добавление ответа к тикету
    async addTicketResponse(ticketId, response) {
        if (!this.initialized) {
            console.warn('⚠️ Firebase не инициализирован');
            return;
        }
        
        try {
            const ticketRef = this.db.collection('tickets').doc(ticketId);
            await ticketRef.update({
                responses: firebase.firestore.FieldValue.arrayUnion(response),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            console.log('✅ Ответ добавлен к тикету:', ticketId);
        } catch (error) {
            console.error('❌ Ошибка добавления ответа:', error);
        }
    }
    
    // Сохранение лицензии
    async saveLicense(licenseKey, licenseData) {
        if (!this.initialized) {
            console.warn('⚠️ Firebase не инициализирован');
            return;
        }
        
        try {
            await this.db.collection('licenses').doc(licenseKey).set({
                ...licenseData,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
            
            console.log('✅ Лицензия сохранена:', licenseKey);
        } catch (error) {
            console.error('❌ Ошибка сохранения лицензии:', error);
        }
    }
    
    // Получение всех лицензий
    async getAllLicenses() {
        if (!this.initialized) {
            console.warn('⚠️ Firebase не инициализирован');
            return [];
        }
        
        try {
            const snapshot = await this.db.collection('licenses').get();
            const licenses = [];
            
            snapshot.forEach(doc => {
                licenses.push({
                    key: doc.id,
                    ...doc.data()
                });
            });
            
            console.log('✅ Загружено лицензий:', licenses.length);
            return licenses;
        } catch (error) {
            console.error('❌ Ошибка загрузки лицензий:', error);
            return [];
        }
    }
    
    // Сохранение бана
    async saveBan(banId, banData) {
        if (!this.initialized) {
            console.warn('⚠️ Firebase не инициализирован');
            return;
        }
        
        try {
            await this.db.collection('bans').doc(banId).set({
                ...banData,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
            
            console.log('✅ Бан сохранен:', banId);
        } catch (error) {
            console.error('❌ Ошибка сохранения бана:', error);
        }
    }
    
    // Получение всех банов
    async getAllBans() {
        if (!this.initialized) {
            console.warn('⚠️ Firebase не инициализирован');
            return [];
        }
        
        try {
            const snapshot = await this.db.collection('bans').get();
            const bans = [];
            
            snapshot.forEach(doc => {
                bans.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            console.log('✅ Загружено банов:', bans.length);
            return bans;
        } catch (error) {
            console.error('❌ Ошибка загрузки банов:', error);
            return [];
        }
    }
    
    // Удаление бана
    async removeBan(banId) {
        if (!this.initialized) {
            console.warn('⚠️ Firebase не инициализирован');
            return;
        }
        
        try {
            await this.db.collection('bans').doc(banId).delete();
            console.log('✅ Бан удален:', banId);
        } catch (error) {
            console.error('❌ Ошибка удаления бана:', error);
        }
    }
    
    // Отписка от всех слушателей
    unsubscribeAll() {
        this.listeners.forEach(unsubscribe => unsubscribe());
        this.listeners = [];
        console.log('✅ Все подписки отменены');
    }
}

// Создание глобального экземпляра
window.firebaseSync = new FirebaseSync();
console.log('✅ FirebaseSync создан и доступен глобально');
