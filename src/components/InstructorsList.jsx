import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, UserCircle, Award, CheckCircle2 } from 'lucide-react';
import { getAllInstructors, requestInstructor } from '../api/instructorService';
import { getStudentAssignment } from '../api/assignmentService';
import './StudentHomePage.css'; // Reusing your global styles

const InstructorsList = () => {
    const navigate = useNavigate();
    const [instructors, setInstructors] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [hasActiveRequest, setHasActiveRequest] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const studentId = localStorage.getItem('studentId');
                const [instData, assignmentData] = await Promise.all([
                    getAllInstructors(),
                    getStudentAssignment(studentId)
                ]);

                setInstructors(instData);

                // If they have an assignment that is PENDING or APPROVED, disable all request buttons
                if (assignmentData && assignmentData.length > 0) {
                    const status = assignmentData[0].status;
                    if (status === 'PENDING' || status === 'APPROVED') {
                        setHasActiveRequest(true);
                    }
                }
            } catch (err) {
                console.error("Error loading instructors", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    const handleRequest = async (instructorId) => {
        if (hasActiveRequest) {
            alert("You already have a pending or active mentorship.");
            return;
        }

        try {
            const studentId = localStorage.getItem('studentId');
            await requestInstructor(studentId, instructorId);
            alert("Mentorship request sent successfully!");
            setHasActiveRequest(true);
        } catch (e) {
            alert("Failed to send request.", e.message);
        }
    };

    if (isLoading) {
        return <div className="loading-screen"><h2>Loading Instructors...</h2></div>;
    }

    return (
        <div className="student-home-container" style={{ minHeight: '100vh', padding: '40px' }}>
            <button onClick={() => navigate('/home')} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', fontWeight: 'bold', marginBottom: '32px' }}>
                <ArrowLeft size={20} /> Back to Dashboard
            </button>

            <h1 className="hero-title" style={{ color: '#111827', marginBottom: '8px' }}>Available Mentors</h1>
            <p style={{ color: '#6B7280', marginBottom: '40px' }}>Browse and request an expert to guide you through your roadmap.</p>

            <div className="instructors-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))' }}>
                {instructors.map(instructor => (
                    <div key={instructor.id} className="instructor-card">
                        <div className="instructor-avatar">
                            <UserCircle size={50} color="#8B5CF6" />
                        </div>
                        <h3 className="instructor-name">{instructor.fullName}</h3>

                        <div className="instructor-badges" style={{ marginTop: '12px' }}>
                            {instructor.expertiseFields?.map((field, idx) => (
                                <span key={idx} className="badge-field">{field.replace('_', ' ')}</span>
                            ))}
                        </div>

                        <p className="instructor-exp" style={{ margin: '16px 0' }}><Award size={14} /> {instructor.yearsOfExperience || 0} Years Experience</p>

                        <button
                            className="btn-request-instructor"
                            disabled={hasActiveRequest}
                            onClick={() => handleRequest(instructor.id)}
                            style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
                        >
                            {hasActiveRequest ? <><CheckCircle2 size={16} /> Requested</> : 'Request Mentorship'}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default InstructorsList;