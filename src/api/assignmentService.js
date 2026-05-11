const BASE_URL = 'https://coeducational-xochitl-branchiform.ngrok-free.dev/api/assignments';

const getHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
        // This token is required to fetch the user's private assignments!
        ...(token && { 'Authorization': `Bearer ${token}` })
    };
};

export const getStudentAssignment = async () => {
    const studentId = localStorage.getItem('studentId');
    if (!studentId) throw new Error("Student ID not found");

    const response = await fetch(`${BASE_URL}/student/${studentId}`, {
        method: 'GET',
        headers: {
            ...getHeaders(),
            'Cache-Control': 'no-cache', // 🚨 FORCES BROWSER TO GET FRESH DATA
            'Pragma': 'no-cache'
        }
    });

    if (!response.ok) throw new Error('Failed to load assignment');
    return await response.json();
};

export const dropInstructor = async (assignmentId) => {
    const response = await fetch(`${BASE_URL}/${assignmentId}/drop?droppedBy=STUDENT`, {
        method: 'PUT',
        headers: getHeaders()
    });

    if (!response.ok) throw new Error('Failed to drop instructor');
    return await response.json();
};

export const requestInstructor = async (studentId, instructorId) => {
    const response = await fetch(`${BASE_URL}?studentId=${studentId}&instructorId=${instructorId}`, {
        method: 'POST',
        headers: getHeaders()
    });
    if (!response.ok) throw new Error('Failed to request instructor');
    return response.json();
};