const BASE_URL = 'https://coeducational-xochitl-branchiform.ngrok-free.dev/api/users';

/*const BASE_URL = 'https://eduguide-t7xp.onrender.com/api/users';
const ASSIGNMENT_URL = 'https://eduguide-t7xp.onrender.com/api/assignments';*/

const getHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
        ...(token && { 'Authorization': `Bearer ${token}` })
    };
};

// 1. Get Top 4 Instructors for Home Page
export const getTopInstructors = async () => {
    const response = await fetch(`${BASE_URL}/instructors/top`, { headers: getHeaders() });
    if (!response.ok) return [];
    return response.json();
};

// 2. Get All Instructors for the standalone page
export const getAllInstructors = async () => {
    const response = await fetch(`${BASE_URL}/instructors/all`, { headers: getHeaders() });
    if (!response.ok) return [];
    return response.json();
};

