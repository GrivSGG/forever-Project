// Forever Messenger System - Полная система мессенджера
// Включает: чаты, друзей, группы, метки, аватарки

class ForeverMessenger {
    constructor() {
        this.db = null;
        this.storage = null;
        this.currentUser = null;
        this.friends = [];
        this.chats = [];
        this.groups = [];
        this.pendingRequests = [];
        this.waypoints = [];
        this.onlineUsers = new Map();
        this.listeners = [];
    }

    async initialize(username) {
        this.db = firebase.firestore();
        this.storage = firebase.storage();
        this.currentUser = username;
        
        // Подписываемся на обновления
        await this.subscribeToFriends();
        await this.subscribeToChats();
        await this.subscribeToGroups();
        await this.subscribeToWaypoints();
        await this.updateOnlineStatus(true);
        
        // Обновляем статус каждые 30 секунд
        setInterval(() => this.updateOnlineStatus(true), 30000);
        
        console.log('✅ Forever Messenger initialized for', username);
    }

    // ============ АВАТАРКИ ============
    
    async uploadAvatar(file) {
        if (!file || !file.type.startsWith('image/')) {
            throw new Error('Выберите изображение');
        }
        
        // Максимум 2MB
        if (file.size > 2 * 1024 * 1024) {
            throw new Error('Файл слишком большой (макс 2MB)');
        }
        
        const storageRef = this.storage.ref();
        const avatarRef = storageRef.child(`avatars/${this.currentUser}.jpg`);
        
        // Загружаем файл
        await avatarRef.put(file);
        
        // Получаем URL
        const url = await avatarRef.getDownloadURL();
        
        // Сохраняем в профиль
        await this.db.collection('users').doc(this.currentUser).update({
            avatarUrl: url,
            avatarUpdated: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        return url;
    }

    async getAvatarUrl(username) {
        try {
            const doc = await this.db.collection('users').doc(username).get();
            if (doc.exists && doc.data().avatarUrl) {
                return doc.data().avatarUrl;
            }
        } catch (e) {
            console.error('Error getting avatar:', e);
        }
        return null; // Вернет null если нет аватарки - клиент покажет лого
    }

    // ============ ДРУЗЬЯ ============
    
    async sendFriendRequest(targetUsername) {
        // Проверяем существует ли пользователь
        const userDoc = await this.db.collection('users').doc(targetUsername).get();
        if (!userDoc.exists) {
            throw new Error('Пользователь не найден');
        }
        
        // Проверяем не друзья ли уже
        const friendDoc = await this.db.collection('friends')
            .where('users', 'array-contains', this.currentUser)
            .get();
        
        for (let doc of friendDoc.docs) {
            const users = doc.data().users;
            if (users.includes(targetUsername)) {
                throw new Error('Уже в друзьях');
            }
        }
        
        // Создаем запрос
        await this.db.collection('friendRequests').add({
            from: this.currentUser,
            to: targetUsername,
            status: 'pending',
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
    }

    async acceptFriendRequest(requestId) {
        const requestRef = this.db.collection('friendRequests').doc(requestId);
        const request = await requestRef.get();
        
        if (!request.exists) throw new Error('Запрос не найден');
        
        const data = request.data();
        
        // Создаем дружбу
        await this.db.collection('friends').add({
            users: [data.from, data.to],
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // Удаляем запрос
        await requestRef.delete();
    }

    async rejectFriendRequest(requestId) {
        await this.db.collection('friendRequests').doc(requestId).delete();
    }

    async removeFriend(friendUsername) {
        const snapshot = await this.db.collection('friends')
            .where('users', 'array-contains', this.currentUser)
            .get();
        
        for (let doc of snapshot.docs) {
            const users = doc.data().users;
            if (users.includes(friendUsername)) {
                await doc.ref.delete();
                break;
            }
        }
    }

    async subscribeToFriends() {
        // Подписка на друзей
        this.listeners.push(
            this.db.collection('friends')
                .where('users', 'array-contains', this.currentUser)
                .onSnapshot(snapshot => {
                    this.friends = [];
                    snapshot.forEach(doc => {
                        const data = doc.data();
                        const friendName = data.users.find(u => u !== this.currentUser);
                        this.friends.push({
                            id: doc.id,
                            username: friendName,
                            ...data
                        });
                    });
                    this.onFriendsUpdate && this.onFriendsUpdate(this.friends);
                })
        );
        
        // Подписка на входящие запросы
        this.listeners.push(
            this.db.collection('friendRequests')
                .where('to', '==', this.currentUser)
                .where('status', '==', 'pending')
                .onSnapshot(snapshot => {
                    this.pendingRequests = [];
                    snapshot.forEach(doc => {
                        this.pendingRequests.push({
                            id: doc.id,
                            ...doc.data()
                        });
                    });
                    this.onRequestsUpdate && this.onRequestsUpdate(this.pendingRequests);
                })
        );
    }

    // ============ ЧАТЫ ============
    
    async sendMessage(recipientUsername, message, type = 'text', data = null) {
        // Проверяем дружбу
        const isFriend = this.friends.some(f => f.username === recipientUsername);
        if (!isFriend) {
            throw new Error('Можно писать только друзьям');
        }
        
        const chatId = this.getChatId(this.currentUser, recipientUsername);
        
        await this.db.collection('messages').add({
            chatId: chatId,
            from: this.currentUser,
            to: recipientUsername,
            message: message,
            type: type, // 'text', 'coordinates', 'waypoint'
            data: data,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            read: false
        });
    }

    async sendGroupMessage(groupId, message, type = 'text', data = null) {
        await this.db.collection('groupMessages').add({
            groupId: groupId,
            from: this.currentUser,
            message: message,
            type: type,
            data: data,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
    }

    getChatId(user1, user2) {
        return [user1, user2].sort().join('_');
    }

    async subscribeToChats() {
        // Подписка на личные сообщения
        this.listeners.push(
            this.db.collection('messages')
                .where('chatId', '>=', this.currentUser)
                .where('chatId', '<=', this.currentUser + '\uf8ff')
                .orderBy('chatId')
                .orderBy('timestamp', 'desc')
                .limit(100)
                .onSnapshot(snapshot => {
                    const messages = [];
                    snapshot.forEach(doc => {
                        messages.push({
                            id: doc.id,
                            ...doc.data()
                        });
                    });
                    this.onMessagesUpdate && this.onMessagesUpdate(messages);
                })
        );
    }

    async markAsRead(messageId) {
        await this.db.collection('messages').doc(messageId).update({
            read: true
        });
    }

    // ============ ГРУППЫ ============
    
    async createGroup(name, members) {
        // members должен включать текущего пользователя
        if (!members.includes(this.currentUser)) {
            members.push(this.currentUser);
        }
        
        const groupRef = await this.db.collection('groups').add({
            name: name,
            members: members,
            admin: this.currentUser,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        return groupRef.id;
    }

    async addToGroup(groupId, username) {
        await this.db.collection('groups').doc(groupId).update({
            members: firebase.firestore.FieldValue.arrayUnion(username)
        });
    }

    async removeFromGroup(groupId, username) {
        await this.db.collection('groups').doc(groupId).update({
            members: firebase.firestore.FieldValue.arrayRemove(username)
        });
    }

    async subscribeToGroups() {
        this.listeners.push(
            this.db.collection('groups')
                .where('members', 'array-contains', this.currentUser)
                .onSnapshot(snapshot => {
                    this.groups = [];
                    snapshot.forEach(doc => {
                        this.groups.push({
                            id: doc.id,
                            ...doc.data()
                        });
                    });
                    this.onGroupsUpdate && this.onGroupsUpdate(this.groups);
                })
        );
    }

    // ============ МЕТКИ (WAYPOINTS) ============
    
    async sendWaypoint(recipientUsernames, waypoint) {
        // waypoint = { name, x, y, z, dimension, color }
        const waypointId = await this.db.collection('waypoints').add({
            from: this.currentUser,
            recipients: recipientUsernames,
            name: waypoint.name,
            x: waypoint.x,
            y: waypoint.y,
            z: waypoint.z,
            dimension: waypoint.dimension,
            color: waypoint.color,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        return waypointId.id;
    }

    async subscribeToWaypoints() {
        this.listeners.push(
            this.db.collection('waypoints')
                .where('recipients', 'array-contains', this.currentUser)
                .onSnapshot(snapshot => {
                    this.waypoints = [];
                    snapshot.forEach(doc => {
                        this.waypoints.push({
                            id: doc.id,
                            ...doc.data()
                        });
                    });
                    this.onWaypointsUpdate && this.onWaypointsUpdate(this.waypoints);
                })
        );
    }

    async deleteWaypoint(waypointId) {
        await this.db.collection('waypoints').doc(waypointId).delete();
    }

    // ============ ОНЛАЙН СТАТУС ============
    
    async updateOnlineStatus(isOnline) {
        await this.db.collection('users').doc(this.currentUser).update({
            online: isOnline,
            lastSeen: firebase.firestore.FieldValue.serverTimestamp(),
            showClient: true // По умолчанию показываем
        });
    }

    async setClientVisibility(visible) {
        await this.db.collection('users').doc(this.currentUser).update({
            showClient: visible
        });
    }

    async subscribeToOnlineStatus() {
        // Подписка на статус друзей
        for (let friend of this.friends) {
            this.listeners.push(
                this.db.collection('users').doc(friend.username)
                    .onSnapshot(doc => {
                        if (doc.exists) {
                            const data = doc.data();
                            this.onlineUsers.set(friend.username, {
                                online: data.online,
                                lastSeen: data.lastSeen,
                                showClient: data.showClient,
                                avatarUrl: data.avatarUrl
                            });
                            this.onOnlineStatusUpdate && this.onOnlineStatusUpdate(this.onlineUsers);
                        }
                    })
            );
        }
    }

    // ============ ПОИСК ПОЛЬЗОВАТЕЛЕЙ ============
    
    async searchUsers(query) {
        const snapshot = await this.db.collection('users')
            .where('username', '>=', query)
            .where('username', '<=', query + '\uf8ff')
            .limit(10)
            .get();
        
        const users = [];
        snapshot.forEach(doc => {
            users.push({
                username: doc.id,
                ...doc.data()
            });
        });
        
        return users;
    }

    // ============ ОЧИСТКА ============
    
    destroy() {
        this.listeners.forEach(unsubscribe => unsubscribe());
        this.listeners = [];
        this.updateOnlineStatus(false);
    }
}

// Глобальный экземпляр
window.foreverMessenger = null;

console.log('✅ Forever Messenger System загружен');
