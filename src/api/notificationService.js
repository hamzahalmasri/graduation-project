// api/notificationService.js
const API_BASE_URL = 'https://coeducational-xochitl-branchiform.ngrok-free.dev/api/notifications';
//const API_BASE_URL = 'https://eduguide-t7xp.onrender.com/api/notifications';

const getHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
        ...(token && { 'Authorization': `Bearer ${token}` })
    };
};

// 1. Get all notifications for a user
export const getUserNotifications = async (userId) => {
    const response = await fetch(`${API_BASE_URL}/user/${userId}`, { headers: getHeaders() });
    if (!response.ok) throw new Error('Failed to fetch notifications');
    return response.json();
};

// 2. Get unread count (for the badge)
export const getUnreadCount = async (userId) => {
    const response = await fetch(`${API_BASE_URL}/user/${userId}/unread-count`, { headers: getHeaders() });
    if (!response.ok) return 0;
    return response.json();
};

// 3. Mark a standard notification as read
export const markAsRead = async (notificationId) => {
    const response = await fetch(`${API_BASE_URL}/${notificationId}/read`, {
        method: 'PUT',
        headers: getHeaders()
    });
    if (!response.ok) throw new Error('Failed to mark as read');
    return response.json();
};

// 4. Mark ALL chat notifications as read (Bulk action for Chat Page)
export const markChatAsRead = async (assignmentId, userId) => {
    const response = await fetch(`${API_BASE_URL}/chat/${assignmentId}/read?userId=${userId}`, {
        method: 'PUT',
        headers: getHeaders()
    });
    if (!response.ok) throw new Error('Failed to clear chat notifications');
    return true;
};