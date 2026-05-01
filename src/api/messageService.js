// Keeping the same base URL structure
const BASE_URL = 'https://coeducational-xochitl-branchiform.ngrok-free.dev/api/messages';

//const BASE_URL = 'https://eduguide-t7xp.onrender.com/api/messages';

const getHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
        // This token is required to prove to the backend who is sending the message!
        ...(token && { 'Authorization': `Bearer ${token}` })
    };
};

// Helper to get the logged-in user's ID
const getUserId = () => {
    const id = localStorage.getItem('studentId');
    if (!id) throw new Error("User not logged in");
    return id;
};

// 1. Get Conversation Messages (Requires ?userId=...)
export const getConversationMessages = async (assignmentId) => {
    const userId = getUserId();
    const response = await fetch(`${BASE_URL}/assignment/${assignmentId}?userId=${userId}`, {
        method: 'GET',
        headers: getHeaders()
    });

    if (!response.ok) throw new Error('Failed to load messages');
    return await response.json();
};

// 2. Send Message 
export const sendInstructorMessage = async (assignmentId, contentText) => {
    const userId = getUserId();

    const response = await fetch(`${BASE_URL}`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
            assignmentId: parseInt(assignmentId),
            senderId: parseInt(userId),
            content: contentText
        })
    });

    if (!response.ok) throw new Error('Failed to send message');
    return await response.json();
};

// 3. Mark Whole Conversation As Read (Requires ?userId=...)
export const markConversationAsRead = async (assignmentId) => {
    const userId = getUserId();
    const response = await fetch(`${BASE_URL}/read/assignment/${assignmentId}?userId=${userId}`, {
        method: 'PUT',
        headers: getHeaders()
    });

    if (!response.ok) throw new Error('Failed to mark conversation as read');
};