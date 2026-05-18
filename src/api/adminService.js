const BASE_API_URL = 'https://coeducational-xochitl-branchiform.ngrok-free.dev/api';

const getHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
        ...(token && { 'Authorization': `Bearer ${token}` })
    };
};

export const getRoadmapAnalytics = async () => {
    const response = await fetch(`${BASE_API_URL}/roadmaps/analytics`, { headers: getHeaders() });
    if (!response.ok) throw new Error("Failed to fetch roadmap analytics");
    return response.json();
};

export const getMentorshipStatistics = async () => {
    const response = await fetch(`${BASE_API_URL}/assignments/statistics`, { headers: getHeaders() });
    if (!response.ok) throw new Error("Failed to fetch mentorship statistics");
    return response.json();
};

export const getPlatformStats = async () => {
    const response = await fetch(`${BASE_API_URL}/admin/stats`, { headers: getHeaders() });
    if (!response.ok) throw new Error("Failed to fetch platform stats");
    return response.json();
};

export const getSystemActivity = async () => {
    const response = await fetch(`${BASE_API_URL}/notifications/all`, { headers: getHeaders() });
    if (!response.ok) throw new Error("Failed to fetch system activity");
    return response.json();
};

export const getPendingAssignments = async () => {
    const response = await fetch(`${BASE_API_URL}/admin/pending-assignments`, { headers: getHeaders() });
    if (!response.ok) throw new Error("Failed to fetch pending assignments");
    return response.json();
};

export const approveAssignment = async (id) => {
    const response = await fetch(`${BASE_API_URL}/admin/assignments/${id}/approve`, {
        method: 'PUT',
        headers: getHeaders()
    });
    if (!response.ok) throw new Error("Failed to approve assignment");
    return response.text();
};

export const rejectAssignment = async (id, note) => {
    const url = new URL(`${BASE_API_URL}/admin/assignments/${id}/reject`);

    url.searchParams.append('note', note || 'No reason provided');

    const response = await fetch(url.toString(), {
        method: 'PUT',
        headers: getHeaders()
    });

    if (!response.ok) throw new Error("Failed to reject assignment");
    return response.text();
};

export const getPendingInstructors = async () => {
    const response = await fetch(`${BASE_API_URL}/admin/pending-instructors`, { headers: getHeaders() });
    if (!response.ok) throw new Error("Failed to fetch pending instructors");
    return response.json();
};

export const approveInstructor = async (id) => {
    const response = await fetch(`${BASE_API_URL}/admin/users/${id}/approve`, {
        method: 'PUT',
        headers: getHeaders()
    });
    if (!response.ok) throw new Error("Failed to approve instructor");
    return response.text();
};