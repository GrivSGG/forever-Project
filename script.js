// Плавная прокрутка
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Анимация появления элементов при скролле
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Применяем анимацию к карточкам функций
document.querySelectorAll('.feature-card').forEach((card, index) => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(50px)';
    card.style.transition = `opacity 0.6s ease ${index * 0.1}s, transform 0.6s ease ${index * 0.1}s`;
    observer.observe(card);
});

// Создание звезд
function createStars() {
    const starsContainer = document.getElementById('starsContainer');
    if (!starsContainer) return;
    
    const starsCount = 200;
    
    for (let i = 0; i < starsCount; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        
        const size = Math.random() * 3 + 1;
        const x = Math.random() * 100;
        const y = Math.random() * 100;
        const duration = Math.random() * 3 + 2;
        const delay = Math.random() * 3;
        
        star.style.cssText = `
            width: ${size}px;
            height: ${size}px;
            left: ${x}%;
            top: ${y}%;
            animation-duration: ${duration}s;
            animation-delay: ${delay}s;
        `;
        
        starsContainer.appendChild(star);
    }
}

// Создание частиц
function createParticles() {
    const particlesContainer = document.getElementById('particlesContainer');
    if (!particlesContainer) return;
    
    const particlesCount = 50;
    
    for (let i = 0; i < particlesCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        
        const size = Math.random() * 4 + 2;
        const x = Math.random() * 100;
        const duration = Math.random() * 10 + 15;
        const delay = Math.random() * 10;
        
        particle.style.cssText = `
            width: ${size}px;
            height: ${size}px;
            left: ${x}%;
            animation-duration: ${duration}s;
            animation-delay: ${delay}s;
        `;
        
        particlesContainer.appendChild(particle);
    }
}

// Инициализация фона
createStars();
createParticles();

// Параллакс эффект для фона
document.addEventListener('mousemove', (e) => {
    const stars = document.querySelectorAll('.stars, .stars2, .stars3');
    const x = e.clientX / window.innerWidth;
    const y = e.clientY / window.innerHeight;
    
    stars.forEach((star, index) => {
        const speed = (index + 1) * 10;
        star.style.transform = `translate(${x * speed}px, ${y * speed}px)`;
    });
});


// Система тикетов
function initTicketSystem() {
    const ticketForm = document.getElementById('ticketForm');
    if (ticketForm) {
        ticketForm.addEventListener('submit', handleTicketSubmit);
    }
    
    loadUserTickets();
}

function handleTicketSubmit(e) {
    e.preventDefault();
    
    const session = window.auth ? window.auth.checkSession() : null;
    if (!session) {
        alert('Войдите в аккаунт для создания тикета');
        showLogin();
        return;
    }
    
    const subject = document.getElementById('ticketSubject').value.trim();
    const message = document.getElementById('ticketMessage').value.trim();
    
    if (!subject || !message) {
        alert('Заполните все поля');
        return;
    }
    
    if (!canCreateTicket(session.username)) {
        alert('Вы можете создать только 1 тикет в день. Попробуйте завтра.');
        return;
    }
    
    const ticket = {
        id: generateTicketId(),
        username: session.username,
        subject: subject,
        message: message,
        status: 'pending',
        createdAt: new Date().toISOString(),
        responses: []
    };
    
    const tickets = loadAllTickets();
    tickets.push(ticket);
    saveAllTickets(tickets);
    
    // Синхронизация с Firebase
    if (window.firebaseSync && window.firebaseSync.initialized) {
        window.firebaseSync.saveTicket(ticket).catch(err => {
            console.error('Ошибка синхронизации тикета:', err);
        });
    }
    
    document.getElementById('ticketSubject').value = '';
    document.getElementById('ticketMessage').value = '';
    
    alert('Тикет успешно создан! Мы ответим вам в ближайшее время.');
    loadUserTickets();
}

function canCreateTicket(username) {
    const tickets = loadAllTickets();
    const userTickets = tickets.filter(t => t.username === username);
    
    if (userTickets.length === 0) return true;
    
    const lastTicket = userTickets[userTickets.length - 1];
    const lastTicketDate = new Date(lastTicket.createdAt);
    const now = new Date();
    const hoursSinceLastTicket = (now - lastTicketDate) / (1000 * 60 * 60);
    
    return hoursSinceLastTicket >= 24;
}

function loadAllTickets() {
    const tickets = localStorage.getItem('forever_tickets');
    return tickets ? JSON.parse(tickets) : [];
}

function saveAllTickets(tickets) {
    localStorage.setItem('forever_tickets', JSON.stringify(tickets));
}

function generateTicketId() {
    return 'ticket_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function loadUserTickets() {
    const session = window.auth ? window.auth.checkSession() : null;
    const ticketsList = document.getElementById('ticketsList');
    
    if (!ticketsList) return;
    
    if (!session) {
        ticketsList.innerHTML = '<p style="color: rgba(255,255,255,0.6);">Войдите в аккаунт для просмотра тикетов</p>';
        return;
    }
    
    const tickets = loadAllTickets();
    const userTickets = tickets.filter(t => t.username === session.username);
    
    if (userTickets.length === 0) {
        ticketsList.innerHTML = '<p style="color: rgba(255,255,255,0.6);">У вас пока нет тикетов</p>';
        return;
    }
    
    const statusNames = {
        'pending': 'В ожидании',
        'reviewing': 'Рассматривается',
        'waiting_response': 'Ожидание вашего ответа',
        'ready': 'Готова',
        'closed': 'Закрыта'
    };
    
    ticketsList.innerHTML = '';
    userTickets.reverse().forEach(ticket => {
        const ticketItem = document.createElement('div');
        ticketItem.className = 'ticket-item';
        ticketItem.innerHTML = `
            <div class="ticket-item-header">
                <div class="ticket-item-title">${ticket.subject}</div>
                <div class="ticket-status ${ticket.status}">${statusNames[ticket.status] || ticket.status}</div>
            </div>
            <div class="ticket-item-message">${ticket.message}</div>
            <div class="ticket-item-date">Создан: ${new Date(ticket.createdAt).toLocaleString('ru-RU')}</div>
            ${ticket.responses && ticket.responses.length > 0 ? `
                <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid rgba(255,255,255,0.1);">
                    <strong style="color: white;">Ответы:</strong>
                    ${ticket.responses.map(r => `
                        <div style="margin-top: 10px; padding: 10px; background: rgba(255,255,255,0.05); border-radius: 8px;">
                            <div style="color: #00d4ff; font-weight: 600;">${r.from}</div>
                            <div style="color: rgba(255,255,255,0.8);">${r.message}</div>
                            <div style="color: rgba(255,255,255,0.5); font-size: 12px; margin-top: 5px;">${new Date(r.date).toLocaleString('ru-RU')}</div>
                        </div>
                    `).join('')}
                </div>
            ` : ''}
        `;
        ticketsList.appendChild(ticketItem);
    });
}

// Инициализация при загрузке
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTicketSystem);
} else {
    initTicketSystem();
}

// Функции для навигации к ценам
function showPricing() {
    const pricingSection = document.getElementById('pricing');
    if (pricingSection) {
        pricingSection.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
}

function checkAuthAndShowPricing() {
    // Просто показываем цены, авторизация не требуется для просмотра
    showPricing();
}

function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
}

// Загрузка статистики с Firebase
async function loadStats() {
    try {
        if (!window.firebaseSync || !window.firebaseSync.initialized) {
            console.log('Firebase не инициализирован, используем локальные данные');
            updateStatsFromLocal();
            return;
        }

        const db = firebase.firestore();
        
        // Загружаем пользователей
        const usersSnapshot = await db.collection('users').get();
        const totalUsers = usersSnapshot.size;
        
        // Загружаем лицензии
        const licensesSnapshot = await db.collection('licenses').get();
        const totalLicenses = licensesSnapshot.docs.filter(doc => doc.data().used).length;
        
        // Обновляем статистику на странице
        const totalUsersHome = document.getElementById('totalUsersHome');
        const totalLicensesHome = document.getElementById('totalLicensesHome');
        const totalDownloadsHome = document.getElementById('totalDownloadsHome');
        
        if (totalUsersHome) totalUsersHome.textContent = totalUsers;
        if (totalLicensesHome) totalLicensesHome.textContent = totalLicenses;
        if (totalDownloadsHome) totalDownloadsHome.textContent = totalUsers * 2; // Примерная статистика
        
    } catch (error) {
        console.error('Ошибка загрузки статистики:', error);
        updateStatsFromLocal();
    }
}

function updateStatsFromLocal() {
    const users = JSON.parse(localStorage.getItem('forever_users') || '{}');
    const totalUsers = Object.keys(users).length;
    
    const totalUsersHome = document.getElementById('totalUsersHome');
    const totalLicensesHome = document.getElementById('totalLicensesHome');
    const totalDownloadsHome = document.getElementById('totalDownloadsHome');
    
    if (totalUsersHome) totalUsersHome.textContent = totalUsers;
    if (totalLicensesHome) totalLicensesHome.textContent = Math.floor(totalUsers * 0.7);
    if (totalDownloadsHome) totalDownloadsHome.textContent = totalUsers * 2;
}

// Загружаем статистику при загрузке страницы
window.addEventListener('load', () => {
    setTimeout(loadStats, 1000); // Даем время Firebase инициализироваться
});
