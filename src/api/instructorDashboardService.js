const BASE_API_URL = 'https://coeducational-xochitl-branchiform.ngrok-free.dev/api';

const getHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
        ...(token && { 'Authorization': `Bearer ${token}` })
    };
};

// 1. Get all students assigned to the instructor
export const getInstructorStudents = async (instructorId) => {
    const response = await fetch(`${BASE_API_URL}/assignments/instructor/${instructorId}`, {
        headers: getHeaders()
    });
    if (!response.ok) throw new Error("Failed to fetch assigned students");
    return response.json();
};

// 2. Get the current active roadmap for a student
export const getStudentActiveRoadmap = async (studentId) => {
    const response = await fetch(`${BASE_API_URL}/users/${studentId}/continue`, {
        headers: getHeaders()
    });
    if (!response.ok) throw new Error("Failed to fetch active roadmap");
    return response.json();
};

// 3. Get the progress summary for a student's roadmap
export const getStudentProgressSummary = async (studentId, roadmapId) => {
    const response = await fetch(`${BASE_API_URL}/progress/summary/student/${studentId}/roadmap/${roadmapId}`, {
        headers: getHeaders()
    });
    if (!response.ok) throw new Error("Failed to fetch progress summary");
    return response.json();
};

// 4. Drop a student (Instructor side)
export const dropStudentAssignment = async (assignmentId) => {
    const response = await fetch(`${BASE_API_URL}/assignments/${assignmentId}/drop?droppedBy=INSTRUCTOR`, {
        method: 'PUT',
        headers: getHeaders()
    });
    if (!response.ok) throw new Error("Failed to drop student");
    return response.json();
};

// 5. Send a performance note
export const sendPerformanceNote = async (noteData) => {
    const response = await fetch(`${BASE_API_URL}/notes`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(noteData)
    });
    if (!response.ok) throw new Error("Failed to send note");
    return response.json();
};

// 6. Get mentorship notes history for a specific assignment
export const getStudentNotes = async (assignmentId) => {
    const response = await fetch(`${BASE_API_URL}/notes/${assignmentId}`, {
        headers: getHeaders()
    });
    if (!response.ok) throw new Error("Failed to fetch notes history");
    return response.json();
};

// 7. Get Progress for the student's Last Opened Roadmap
export const getLastOpenedStudentProgress = async (studentId) => {
    const response = await fetch(`${BASE_API_URL}/progress/last-opened/${studentId}`, {
        headers: getHeaders()
    });
    if (!response.ok) throw new Error("Failed to fetch last opened progress");
    return response.json();
};