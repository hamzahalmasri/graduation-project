const BASE_URL = 'https://coeducational-xochitl-branchiform.ngrok-free.dev/api/users';
const ASSIGNMENT_URL = 'https://coeducational-xochitl-branchiform.ngrok-free.dev/api/assignments';

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

// 3. Request an Instructor
export const requestInstructor = async (studentId, instructorId) => {
    const response = await fetch(`${ASSIGNMENT_URL}?studentId=${studentId}&instructorId=${instructorId}`, {
        method: 'POST',
        headers: getHeaders()
    });
    if (!response.ok) throw new Error('Failed to request instructor');
    return response.json();
};