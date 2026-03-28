// Личный кабинет Forever Client

// Проверка авторизации
window.addEventListener('load', async () => {
    const session = auth.checkSession();
    
    if (!session) {
        auth.showNotification('Необходимо войти в аккаунт', 'warning');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);
        return;
    }
    
    // Проверка бана в Firebase
    try {
        const db = firebase.firestore();
        // Ищем пользователя по полю username, а не по document ID
        const userSnapshot = await db.collection('users').where('username', '==', session.username).limit(1).get();
        
        if (!userSnapshot.empty) {
            const userDoc = userSnapshot.docs[0];
            const user = userDoc.data();
            
            if (user.banned) {
                const banEnd = user.bannedUntil ? new Date(user.bannedUntil) : null;
                
                if (!banEnd) {
                    // Перманентный бан
                    auth.showNotification('Ваш аккаунт заблокирован навсегда', 'error');
                    localStorage.removeItem('forever_session');
                    setTimeout(() => {
                        window.location.href = 'index.html';
                    }, 2000);
                    return;
                } else if (Date.now() < banEnd.getTime()) {
                    // Временный бан еще активен
                    const timeLeft = Math.ceil((banEnd.getTime() - Date.now()) / (1000 * 60));
                    auth.showNotification(`Ваш аккаунт заблокирован до ${banEnd.toLocaleString('ru-RU')}. Осталось: ${timeLeft} минут`, 'error');
                    localStorage.removeItem('forever_session');
                    setTimeout(() => {
                        window.location.href = 'index.html';
                    }, 2000);
                    return;
                }
            }
        }
    } catch (error) {
        console.error('❌ Ошибка проверки бана:', error);
    }
    
    loadUserData(session.username);
});

// Загрузка данных пользователя
async function loadUserData(username) {
    try {
        const db = firebase.firestore();
        // Ищем пользователя по полю username
        const userSnapshot = await db.collection('users').where('username', '==', username).limit(1).get();
        
        if (userSnapshot.empty) {
            auth.showNotification('Ошибка загрузки данных пользователя', 'error');
            return;
        }
        
        const userDoc = userSnapshot.docs[0];
        const user = userDoc.data();
        
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
        
    } catch (error) {
        console.error('❌ Ошибка загрузки данных:', error);
        auth.showNotification('Ошибка загрузки данных', 'error');
    }
}

// Загрузка лицензий
function loadLicenses(user) {
    const container = document.getElementById('licensesContainer');
    
    if (!user.licenses || user.licenses.length === 0) {
        return;
    }
    
    container.innerHTML = '';
    
    user.licenses.forEach(license => {
        const card = document.createElement('div');
        card.className = 'license-card';
        
        const typeNames = {
            '1day': '1 день',
            '7days': '7 дней',
            '30days': '30 дней',
            '90days': '90 дней',
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

// Generate HWID helper function
function generateHWID() {
    const chars = 'ABCDEF0123456789';
    let hwid = '';
    for (let i = 0; i < 32; i++) {
        hwid += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return hwid;
}

// Activation functions - GLOBAL
window.activateLicense = function() {
    document.getElementById('activateModal').classList.add('show');
}

window.closeActivateModal = function() {
    document.getElementById('activateModal').classList.remove('show');
}

window.handleActivation = async function(event) {
    event.preventDefault();
    
    const key = document.getElementById('licenseKey').value.trim();
    const session = auth.checkSession();
    
    if (!session) {
        auth.showNotification('Ошибка сессии', 'error');
        return false;
    }
    
    try {
        const db = firebase.firestore();
        
        // Check license
        const licenseDoc = await db.collection('licenses').doc(key).get();
        
        if (!licenseDoc.exists) {
            auth.showNotification('Ключ не найден', 'error');
            return false;
        }
        
        const licenseData = licenseDoc.data();
        
        if (licenseData.used) {
            auth.showNotification('Этот ключ уже активирован', 'error');
            return false;
        }
        
        // Generate HWID
        const hwid = generateHWID();
        
        // Calculate expiry
        let expiryDate = null;
        const typeDays = {
            '1day': 1,
            '7days': 7,
            '30days': 30,
            '90days': 90
        };
        
        if (typeDays[licenseData.type]) {
            expiryDate = new Date(Date.now() + typeDays[licenseData.type] * 24 * 60 * 60 * 1000).toISOString();
        }
        
        const license = {
            key: key,
            type: licenseData.type,
            hwid: hwid,
            activationDate: new Date().toISOString(),
            expiryDate: expiryDate
        };
        
        // Update user
        const usersRef = db.collection('users');
        const userSnapshot = await usersRef.where('username', '==', session.username).limit(1).get();
        
        if (userSnapshot.empty) {
            auth.showNotification('������������ �� ������', 'error');
            return false;
        }
        
        await userSnapshot.docs[0].ref.update({
            licenses: firebase.firestore.FieldValue.arrayUnion(license),
            hwid: hwid
        });
        
        // Mark license as used
        await db.collection('licenses').doc(key).update({
            used: true,
            activatedBy: session.username,
            activatedAt: new Date().toISOString()
        });
        
        auth.showNotification('Лицензия активирована!', 'success');
        closeActivateModal();
        
        setTimeout(() => {
            loadUserData(session.username);
        }, 1000);
        
    } catch (error) {
        console.error('❌ Ошибка активации:', error);
        auth.showNotification('Ошибка: ' + error.message, 'error');
    }
    
    return false;
}

window.downloadClient = function() {
    auth.showNotification('Функция загрузки в разработке', 'info');
}

// Ticket modal functions - GLOBAL
window.showTicketModal = function() {
    document.getElementById('ticketModal').classList.add('show');
}

window.closeTicketModal = function() {
    document.getElementById('ticketModal').classList.remove('show');
}

window.showViewTicketsModal = function() {
    loadUserTickets();
    document.getElementById('viewTicketsModal').classList.add('show');
}

window.closeViewTicketsModal = function() {
    document.getElementById('viewTicketsModal').classList.remove('show');
}

window.submitTicket = async function(event) {
    event.preventDefault();
    
    const subject = document.getElementById('ticketProblem').value.trim();
    const message = document.getElementById('ticketDescription').value.trim();
    const session = auth.checkSession();
    
    if (!session) return false;
    
    try {
        const db = firebase.firestore();
        const ticketId = 'ticket_' + Date.now() + '_' + Math.random().toString(36).substring(2, 11);
        
        await db.collection('tickets').doc(ticketId).set({
            id: ticketId,
            username: session.username,
            subject: subject,
            message: message,
            status: 'pending',
            responses: [],
            createdAt: new Date().toISOString(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        auth.showNotification('Тикет создан успешно', 'success');
        document.getElementById('ticketForm').reset();
        closeTicketModal();
        
    } catch (error) {
        console.error('❌ Ошибка создания тикета:', error);
        auth.showNotification('Ошибка создания тикета: ' + error.message, 'error');
    }
    
    return false;
}

async function loadUserTickets() {
    const session = auth.checkSession();
    if (!session) return;
    
    const ticketsList = document.getElementById('ticketsList');
    ticketsList.innerHTML = '<div style="text-align: center; padding: 20px;"><i class="fas fa-spinner fa-spin" style="font-size: 32px; color: #4A90E2;"></i><br><br>Загрузка тикетов...</div>';
    
    try {
        const db = firebase.firestore();
        const snapshot = await db.collection('tickets')
            .where('username', '==', session.username)
            .get();
        
        if (snapshot.empty) {
            ticketsList.innerHTML = `
                <div style="text-align: center; padding: 40px; color: rgba(255,255,255,0.6);">
                    <i class="fas fa-inbox" style="font-size: 48px; margin-bottom: 15px; display: block;"></i>
                    У вас пока нет тикетов
                </div>
            `;
            return;
        }
        
        ticketsList.innerHTML = '';
        
        const statusNames = {
            'pending': 'В ожидании',
            'reviewing': 'Рассматривается',
            'waiting_response': 'Ожидание ответа',
            'ready': 'Готово',
            'closed': 'Закрыт'
        };
        
        const tickets = [];
        snapshot.forEach(doc => {
            tickets.push({ id: doc.id, ...doc.data() });
        });
        
        // Sort by date
        tickets.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        tickets.forEach(ticket => {
            const ticketDiv = document.createElement('div');
            ticketDiv.className = 'ticket-item';
            ticketDiv.innerHTML = `
                <div class="ticket-item-header">
                    <div class="ticket-subject">${ticket.subject}</div>
                    <div class="ticket-status-badge ${ticket.status || 'pending'}">
                        ${statusNames[ticket.status] || 'В ожидании'}
                    </div>
                </div>
                <div style="color: rgba(255,255,255,0.6); font-size: 14px; margin-bottom: 15px;">
                    Создан: ${new Date(ticket.createdAt).toLocaleString('ru-RU')}
                </div>
                <div style="padding: 15px; background: rgba(255,255,255,0.03); border-radius: 8px; margin-bottom: 15px;">
                    ${ticket.message}
                </div>
                
                ${ticket.responses && ticket.responses.length > 0 ? `
                    <div class="ticket-chat">
                        ${ticket.responses.map(response => `
                            <div class="chat-message ${response.from === session.username ? 'user' : 'helper'}">
                                <div class="chat-author">${response.from}</div>
                                <div class="chat-text">${response.message}</div>
                                <div class="chat-time">${new Date(response.date).toLocaleString('ru-RU')}</div>
                            </div>
                        `).join('')}
                    </div>
                ` : '<div style="color: rgba(255,255,255,0.4); font-style: italic; padding: 10px;">Ответов пока нет</div>'}
                
                ${ticket.status !== 'closed' ? `
                    <div class="chat-input-area">
                        <input type="text" class="chat-input" id="reply_${ticket.id}" placeholder="Написать сообщение...">
                        <button class="btn-send" onclick="sendTicketReply('${ticket.id}')">
                            <i class="fas fa-paper-plane"></i> Отправить
                        </button>
                    </div>
                ` : '<div style="color: rgba(255,255,255,0.4); font-style: italic; padding: 10px; text-align: center;">Тикет закрыт</div>'}
            `;
            
            ticketsList.appendChild(ticketDiv);
        });
        
    } catch (error) {
        console.error('❌ Ошибка загрузки тикетов:', error);
        ticketsList.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #F44336;">
                <i class="fas fa-exclamation-triangle" style="font-size: 48px; margin-bottom: 15px; display: block;"></i>
                Ошибка загрузки тикетов: ${error.message}
            </div>
        `;
    }
}

// Send ticket reply - GLOBAL
window.sendTicketReply = async function(ticketId) {
    const input = document.getElementById(`reply_${ticketId}`);
    const message = input.value.trim();
    
    if (!message) {
        auth.showNotification('Введите сообщение', 'error');
        return;
    }
    
    const session = auth.checkSession();
    if (!session) return;
    
    try {
        const db = firebase.firestore();
        const response = {
            from: session.username,
            message: message,
            date: new Date().toISOString()
        };
        
        await db.collection('tickets').doc(ticketId).update({
            responses: firebase.firestore.FieldValue.arrayUnion(response),
            status: 'waiting_response',
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        input.value = '';
        auth.showNotification('Сообщение отправлено', 'success');
        
        // Reload tickets
        await loadUserTickets();
        
    } catch (error) {
        console.error('❌ Ошибка отправки сообщения:', error);
        auth.showNotification('Ошибка отправки: ' + error.message, 'error');
    }
}

// Ticket modal functions - GLOBAL
window.showTicketModal = function() {
    document.getElementById('ticketModal').classList.add('show');
}

window.closeTicketModal = function() {
    document.getElementById('ticketModal').classList.remove('show');
}

window.showViewTicketsModal = function() {
    loadUserTickets();
    document.getElementById('viewTicketsModal').classList.add('show');
}

window.closeViewTicketsModal = function() {
    document.getElementById('viewTicketsModal').classList.remove('show');
}

window.submitTicket = async function(event) {
    event.preventDefault();
    
    const subject = document.getElementById('ticketProblem').value.trim();
    const message = document.getElementById('ticketDescription').value.trim();
    const session = auth.checkSession();
    
    if (!session) return false;
    
    try {
        const db = firebase.firestore();
        const ticketId = 'ticket_' + Date.now() + '_' + Math.random().toString(36).substring(2, 11);
        
        await db.collection('tickets').doc(ticketId).set({
            id: ticketId,
            username: session.username,
            subject: subject,
            message: message,
            status: 'pending',
            responses: [],
            createdAt: new Date().toISOString(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        auth.showNotification('Тикет создан успешно', 'success');
        document.getElementById('ticketForm').reset();
        closeTicketModal();
        
    } catch (error) {
        console.error('❌ Ошибка создания тикета:', error);
        auth.showNotification('Ошибка создания тикета: ' + error.message, 'error');
    }
    
    return false;
}

// Activation functions - GLOBAL
window.activateLicense = function() {
    document.getElementById('activateModal').classList.add('show');
}

window.closeActivateModal = function() {
    document.getElementById('activateModal').classList.remove('show');
}

window.handleActivation = async function(event) {
    event.preventDefault();
    
    const key = document.getElementById('licenseKey').value.trim();
    const session = auth.checkSession();
    
    if (!session) {
        auth.showNotification('Ошибка сессии', 'error');
        return false;
    }
    
    try {
        const db = firebase.firestore();
        
        // Check license
        const licenseDoc = await db.collection('licenses').doc(key).get();
        
        if (!licenseDoc.exists) {
            auth.showNotification('Ключ не найден', 'error');
            return false;
        }
        
        const licenseData = licenseDoc.data();
        
        if (licenseData.used) {
            auth.showNotification('Этот ключ уже активирован', 'error');
            return false;
        }
        
        // Generate HWID
        const hwid = generateHWID();
        
        // Calculate expiry
        let expiryDate = null;
        const typeDays = {
            '1day': 1,
            '7days': 7,
            '30days': 30,
            '90days': 90
        };
        
        if (typeDays[licenseData.type]) {
            expiryDate = new Date(Date.now() + typeDays[licenseData.type] * 24 * 60 * 60 * 1000).toISOString();
        }
        
        const license = {
            key: key,
            type: licenseData.type,
            hwid: hwid,
            activationDate: new Date().toISOString(),
            expiryDate: expiryDate
        };
        
        // Update user
        const usersRef = db.collection('users');
        const userSnapshot = await usersRef.where('username', '==', session.username).limit(1).get();
        
        if (userSnapshot.empty) {
            auth.showNotification('������������ �� ������', 'error');
            return false;
        }
        
        await userSnapshot.docs[0].ref.update({
            licenses: firebase.firestore.FieldValue.arrayUnion(license),
            hwid: hwid
        });
        
        // Mark license as used
        await db.collection('licenses').doc(key).update({
            used: true,
            activatedBy: session.username,
            activatedAt: new Date().toISOString()
        });
        
        auth.showNotification('Лицензия активирована!', 'success');
        closeActivateModal();
        
        setTimeout(() => {
            loadUserData(session.username);
        }, 1000);
        
    } catch (error) {
        console.error('❌ Ошибка активации:', error);
        auth.showNotification('Ошибка: ' + error.message, 'error');
    }
    
    return false;
}

window.downloadClient = function() {
    auth.showNotification('Функция загрузки в разработке', 'info');
}

// Code style
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

// ============ AVATAR UPLOAD ============

window.uploadAvatar = async function(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const session = auth.checkSession();
    if (!session) {
        auth.showNotification('Ошибка сессии', 'error');
        return;
    }
    
    // Проверка типа файла
    if (!file.type.startsWith('image/')) {
        auth.showNotification('Выберите изображение', 'error');
        return;
    }
    
    // Проверка размера (макс 2MB)
    if (file.size > 2 * 1024 * 1024) {
        auth.showNotification('Файл слишком большой (макс 2MB)', 'error');
        return;
    }
    
    try {
        auth.showNotification('Загрузка аватарки...', 'info');
        
        const storage = firebase.storage();
        const storageRef = storage.ref();
        const avatarRef = storageRef.child(`avatars/${session.username}.jpg`);
        
        // Загружаем файл
        await avatarRef.put(file);
        
        // Получаем URL
        const url = await avatarRef.getDownloadURL();
        
        // Сохраняем в профиль - ищем по username
        const db = firebase.firestore();
        const usersRef = db.collection('users');
        const userSnapshot = await usersRef.where('username', '==', session.username).limit(1).get();
        
        if (!userSnapshot.empty) {
            await userSnapshot.docs[0].ref.update({
                avatarUrl: url,
                avatarUpdated: firebase.firestore.FieldValue.serverTimestamp()
            });
        }
        
        // Обновляем отображение
        document.getElementById('userAvatar').src = url;
        
        auth.showNotification('Аватарка обновлена!', 'success');
        
    } catch (error) {
        console.error('❌ Ошибка загрузки аватарки:', error);
        auth.showNotification('Ошибка загрузки: ' + error.message, 'error');
    }
}

// Загрузка аватарки при загрузке страницы
async function loadAvatar(username) {
    try {
        const db = firebase.firestore();
        const userSnapshot = await db.collection('users').where('username', '==', username).limit(1).get();
        
        if (!userSnapshot.empty && userSnapshot.docs[0].data().avatarUrl) {
            document.getElementById('userAvatar').src = userSnapshot.docs[0].data().avatarUrl;
        }
    } catch (error) {
        console.error('❌ Ошибка загрузки аватарки:', error);
    }
}

// Вызываем загрузку аватарки
window.addEventListener('load', () => {
    const session = auth.checkSession();
    if (session) {
        loadAvatar(session.username);
    }
});
