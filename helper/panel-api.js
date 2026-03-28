// Helper Panel API Functions with Token Authentication

// Get access token
function getAccessToken() {
    return localStorage.getItem('helper_access_token');
}

// API call helper
async function apiCall(url, method, body) {
    const token = getAccessToken();
    const response = await fetch(url, {
        method: method,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: body ? JSON.stringify(body) : undefined
    });
    
    if (response.status === 401) {
        alert('⛔ Токен доступа истек. Войдите снова.');
        localStorage.removeItem('helper_access_granted');
        localStorage.removeItem('helper_access_token');
        localStorage.removeItem('helper_access_time');
        window.location.href = 'auth.html';
        throw new Error('Token expired');
    }
    
    return response;
}

const API_BASE = 'https://forever-project-production-a2fa.up.railway.app/api/helper';

// Override functions to use API
window.generateKeysAPI = async function(type, paymentType, count, createdBy) {
    const response = await apiCall(`${API_BASE}/generate-keys`, 'POST', {
        type, paymentType, count, createdBy
    });
    return await response.json();
};

window.grantSubscriptionAPI = async function(username, type, grantedBy) {
    const response = await apiCall(`${API_BASE}/grant-subscription`, 'POST', {
        username, type, grantedBy
    });
    return await response.json();
};

window.revokeSubscriptionAPI = async function(username, type) {
    const response = await apiCall(`${API_BASE}/revoke-subscription`, 'POST', {
        username, type
    });
    return await response.json();
};

window.deleteUserAPI = async function(username) {
    const response = await apiCall(`${API_BASE}/delete-user`, 'POST', {
        username
    });
    return await response.json();
};

window.deleteTicketAPI = async function(ticketId) {
    const response = await apiCall(`${API_BASE}/delete-ticket`, 'POST', {
        ticketId
    });
    return await response.json();
};

window.respondToTicketAPI = async function(ticketId, message, from) {
    const response = await apiCall(`${API_BASE}/respond-ticket`, 'POST', {
        ticketId, message, from
    });
    return await response.json();
};

window.changeTicketStatusAPI = async function(ticketId, status) {
    const response = await apiCall(`${API_BASE}/change-ticket-status`, 'POST', {
        ticketId, status
    });
    return await response.json();
};

window.banUserAPI = async function(username, duration, reason, bannedBy) {
    const response = await apiCall(`${API_BASE}/ban-user`, 'POST', {
        username, duration, reason, bannedBy
    });
    return await response.json();
};

window.banIPAPI = async function(ip, reason, bannedBy) {
    const response = await apiCall(`${API_BASE}/ban-ip`, 'POST', {
        ip, reason, bannedBy
    });
    return await response.json();
};

window.unbanAPI = async function(banId) {
    const response = await apiCall(`${API_BASE}/unban`, 'POST', {
        banId
    });
    return await response.json();
};
