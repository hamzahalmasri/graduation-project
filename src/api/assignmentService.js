// Keeping the ngrok format
const BASE_URL = 'https://coeducational-xochitl-branchiform.ngrok-free.dev/api/assignments';
//const BASE_URL = 'https://eduguide-t7xp.onrender.com/api/assignments';

const getHeaders = () => ({
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true'
});

// Fetch the student's active assignment to get the assignmentId
export const getStudentAssignment = async () => {
    const studentId = localStorage.getItem('studentId');
    if (!studentId) throw new Error("Student ID not found");

    const response = await fetch(`${BASE_URL}/student/${studentId}`, {
        method: 'GET',
        headers: getHeaders()
    });

    if (!response.ok) throw new Error('Failed to load assignment');
    return await response.json();
};