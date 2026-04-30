// Make sure this points to your real backend URL or Ngrok link!
const API_BASE_URL = 'https://coeducational-xochitl-branchiform.ngrok-free.dev/api/quizzes';
//const API_BASE_URL = 'https://eduguide-t7xp.onrender.com/api/quizzes';

const getHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
        ...(token && { 'Authorization': `Bearer ${token}` })
    };
};

// fetch all cards for the dashboard
export const fetchQuizCards = async (studentId) => {
    const response = await fetch(`${API_BASE_URL}/cards?studentId=${studentId}`, { headers: getHeaders() });
    if (!response.ok) throw new Error('Failed to fetch quiz cards');
    return response.json();
};

// fetch the recommended quiz
export const fetchRecommendedQuiz = async (studentId) => {
    const response = await fetch(`${API_BASE_URL}/recommended?studentId=${studentId}`, { headers: getHeaders() });
    if (!response.ok) return null; // Return null if none is recommended
    return response.json();
};

// fetch a specific quiz to take
export const fetchQuizById = async (quizId) => {
    const response = await fetch(`${API_BASE_URL}/${quizId}`, { headers: getHeaders() });
    if (!response.ok) throw new Error('Failed to fetch quiz details');
    return response.json();
};

// submit the completed quiz
export const submitQuiz = async (quizId, studentId, answersArray) => {
    const payload = {
        quizId: Number(quizId),
        studentId: Number(studentId),
        answers: answersArray
    };

    const response = await fetch(`${API_BASE_URL}/submit`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error('Failed to submit quiz');
    return response.json();
};

// fetch previous attempts for a specific quiz
export const fetchQuizAttempts = async (quizId, studentId) => {
    const response = await fetch(`${API_BASE_URL}/${quizId}/attempts/${studentId}`, { headers: getHeaders() });
    if (!response.ok) throw new Error('Failed to fetch quiz attempts');
    return response.json();
};

// fetch the best score for a specific quiz
export const fetchQuizBestScore = async (quizId, studentId) => {
    const response = await fetch(`${API_BASE_URL}/${quizId}/best-score/${studentId}`, { headers: getHeaders() });

    if (!response.ok) return null;

    return response.json();
};

// fetch resume state to see where the user left off
export const fetchQuizResumeState = async (quizId, studentId) => {
    // Adjust this URL if your Swagger docs show it formatted differently!
    const response = await fetch(`${API_BASE_URL}/${quizId}/resume/${studentId}`, { headers: getHeaders() });
    if (!response.ok) return null; // If no saved state, just return null
    return response.json();
};

// save progress without finishing the quiz
export const saveQuizProgress = async (quizId, studentId, answers) => {
    return await submitQuiz(quizId, studentId, answers);
};
