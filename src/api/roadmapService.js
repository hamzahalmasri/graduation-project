const BASE_URL = 'https://coeducational-xochitl-branchiform.ngrok-free.dev/api/roadmaps';
const PROGRESS_URL = 'https://coeducational-xochitl-branchiform.ngrok-free.dev/api/progress';

const getHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
        ...(token && { 'Authorization': `Bearer ${token}` })
    };
};

// 1. Chat with AI (🚨 UPDATED TO ACCEPT FULL OBJECT WITH HISTORY & SESSION ID)
export const sendRoadmapChatMessage = async (requestBody) => {
    const response = await fetch(`${BASE_URL}/chat`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(requestBody)
    });

    if (!response.ok) throw new Error('Chat failed');
    return await response.text();
};

// NOTE: generateUserRoadmap has been deleted because the /chat endpoint generates it now!

// 2. Get All User Roadmaps
export const getUserRoadmaps = async (userId) => {
    if (!userId) throw new Error("Missing User ID");

    const response = await fetch(`${BASE_URL}/user/${userId}`, {
        method: 'GET',
        headers: getHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch roadmaps');
    return await response.json();
};

// 3. Get Specific Roadmap
export const getRoadmapById = async (roadmapId) => {
    if (!roadmapId) throw new Error("Missing Roadmap ID");

    const response = await fetch(`${BASE_URL}/${roadmapId}`, {
        method: 'GET',
        headers: getHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch roadmap details');
    return await response.json();
};

// 4. Delete Roadmap
export const deleteRoadmap = async (roadmapId) => {
    const response = await fetch(`${BASE_URL}/${roadmapId}`, {
        method: 'DELETE',
        headers: getHeaders()
    });
    if (!response.ok) throw new Error('Failed to delete roadmap');
};

// 5. Update Last Opened
export const setLastOpenedRoadmap = async (roadmapId, userId) => {
    const response = await fetch(`${BASE_URL}/open/${roadmapId}/user/${userId}`, {
        method: 'PUT',
        headers: getHeaders()
    });
    if (!response.ok) throw new Error('Failed to update last opened status');
};

// 6. Update Roadmap
export const updateRoadmap = async (roadmapId, roadmapData) => {
    const response = await fetch(`${BASE_URL}/${roadmapId}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(roadmapData)
    });
    if (!response.ok) throw new Error('Failed to update roadmap');
    return await response.json();
};

// 7. Create Manual/Generated Roadmap (🚨 SAVES THE FINAL ROADMAP TO DB)
export const createRoadmap = async (roadmapData) => {
    const response = await fetch(`${BASE_URL}`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(roadmapData)
    });
    if (!response.ok) throw new Error('Failed to save roadmap to database');
    return await response.json();
};

// 8. Mark a Step as Completed/Uncompleted (Progress Tracking)
export const markStepProgress = async (studentId, roadmapId, phaseTitle, stepTitle) => {
    const response = await fetch(PROGRESS_URL, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
            studentId: parseInt(studentId),
            roadmapId: parseInt(roadmapId),
            phaseTitle: phaseTitle,
            stepTitle: stepTitle
        })
    });

    if (!response.ok) throw new Error('Failed to update progress');
    return await response.json();
};

// 9. Get Student's Progress for a specific Roadmap
export const getStudentProgress = async (studentId, roadmapId) => {
    const response = await fetch(`${PROGRESS_URL}/student/${studentId}/roadmap/${roadmapId}`, {
        method: 'GET',
        headers: getHeaders()
    });

    if (!response.ok) throw new Error('Failed to fetch student progress');
    return await response.json();
};