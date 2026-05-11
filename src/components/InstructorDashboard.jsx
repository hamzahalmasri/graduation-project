import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, MessageSquare, User, LogOut, Trash2, Flame } from 'lucide-react';
import logo from '../assets/light-logo.png';
import './InstructorDashboard.css';
import './StudentHomePage.css';
import {
    getInstructorStudents,
    getLastOpenedStudentProgress,
    getStudentActiveRoadmap, // 🚨 IMPORTED THIS TO FIX THE MATH
    dropStudentAssignment,
    sendPerformanceNote
} from '../api/instructorDashboardService';

const InstructorDashboard = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [students, setStudents] = useState([]);

    const [noteForm, setNoteForm] = useState({ assignmentId: '', type: 'QUIZ_FEEDBACK', noteText: '' });
    const [isSendingNote, setIsSendingNote] = useState(false);
    const [noteSuccess, setNoteSuccess] = useState(false);

    const instructorName = localStorage.getItem('userName') || 'Instructor';

    const fetchDashboardData = useCallback(async () => {
        setIsLoading(true);
        const instructorId = localStorage.getItem('instructorId');

        if (!instructorId) {
            navigate('/');
            return;
        }

        try {
            const assignmentsData = await getInstructorStudents(instructorId);
            const activeAssignments = assignmentsData.filter(a => a.status === 'APPROVED' || a.active);

            const enrichedStudents = await Promise.all(activeAssignments.map(async (assignment) => {
                const sId = assignment.student.id;
                let progressPercentage = 0;
                let learningPath = assignment.student.major || "Custom Track";

                try {
                    // 1. Get the raw numbers from the backend
                    const progressData = await getLastOpenedStudentProgress(sId);
                    const currentStep = progressData.completedSteps || 0;
                    const backendTotal = progressData.totalSteps || 0;

                    // 2. Fetch the roadmap to get the REAL total steps
                    let realTotalSteps = backendTotal;
                    try {
                        const activeRoadmap = await getStudentActiveRoadmap(sId);
                        learningPath = activeRoadmap.learningPath || learningPath;

                        let contentObj = activeRoadmap.roadmapContent;
                        if (typeof contentObj === 'string') contentObj = JSON.parse(contentObj);
                        if (typeof contentObj === 'string') contentObj = JSON.parse(contentObj);

                        const fallbackTotal = contentObj?.phases?.reduce((acc, phase) => acc + (phase.steps?.length || 0), 0) || 0;
                        if (fallbackTotal > 0) {
                            realTotalSteps = fallbackTotal;
                        }
                    } catch (roadmapErr) {
                        console.warn(`Could not fetch active roadmap for student ${sId} to fix math`, roadmapErr);
                    }

                    // 🚨 3. THE FIX: Dynamically calculate the true percentage!
                    progressPercentage = realTotalSteps === 0 ? 0 : Math.round((currentStep / realTotalSteps) * 100);

                } catch (e) {
                    console.warn(`Could not fetch full progress data for student ${sId}`, e);
                }

                return {
                    ...assignment,
                    progressPercentage,
                    learningPath
                };
            }));

            setStudents(enrichedStudents);

            if (enrichedStudents.length > 0) {
                setNoteForm(prev => ({ ...prev, assignmentId: enrichedStudents.id }));
            }
        } catch (error) {
            console.error("Dashboard Error:", error);
        } finally {
            setIsLoading(false);
        }
    }, [navigate]);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    const handleDropStudent = async (assignmentId) => {
        if (!window.confirm("Are you sure you want to drop this student?")) return;

        try {
            await dropStudentAssignment(assignmentId);
            setStudents(prev => prev.filter(s => s.id !== assignmentId));
            alert("Student dropped successfully.");
        } catch (err) {
            alert("Error dropping student: " + err.message);
        }
    };

    const handleSendNote = async (e) => {
        e.preventDefault();
        setIsSendingNote(true);
        setNoteSuccess(false);

        try {
            await sendPerformanceNote({
                assignmentId: parseInt(noteForm.assignmentId),
                type: noteForm.type,
                noteText: noteForm.noteText
            });

            setNoteSuccess(true);
            setNoteForm(prev => ({ ...prev, noteText: '' }));
            setTimeout(() => setNoteSuccess(false), 3000);
        } catch (err) {
            alert("Failed to send note: " + err.message);
        } finally {
            setIsSendingNote(false);
        }
    };

    const getInitials = (name) => {
        if (!name) return "ST";
        return name.split(' ').map(n => n).join('').substring(0, 2).toUpperCase();
    };

    const recentStudents = [...students]
        .sort((a, b) => new Date(b.student.lastActivityAt || b.assignedAt) - new Date(a.student.lastActivityAt || a.assignedAt))
        .slice(0, 3);

    const topMovers = [...students]
        .sort((a, b) => b.progressPercentage - a.progressPercentage)
        .slice(0, 3);

    const avatarGradients = [
        'linear-gradient(135deg, #A855F7 0%, #7C3AED 100%)',
        'linear-gradient(135deg, #34D399 0%, #059669 100%)',
        'linear-gradient(135deg, #60A5FA 0%, #2563EB 100%)',
        'linear-gradient(135deg, #F87171 0%, #DC2626 100%)',
        'linear-gradient(135deg, #FBBF24 0%, #D97706 100%)'
    ];

    return (
        <div className="inst-dashboard-container">
            <aside className="sidebar">
                <div className="sidebar-logo">
                    <img src={logo} alt="EduGuide" className="inst-logo-img" />
                </div>

                <div className="inst-profile-widget">
                    <div className="inst-avatar">{getInitials(instructorName)}</div>
                    <div className="inst-info">
                        <p className="inst-name">{instructorName}</p>
                        <p className="inst-role">Instructor</p>
                    </div>
                </div>

                <nav className="inst-nav">
                    <button className="active"><LayoutDashboard size={18} /> Dashboard</button>
                    <button onClick={() => navigate('/my-students')}><Users size={18} /> My Students</button>
                    <button onClick={() => navigate('/messages')}><MessageSquare size={18} /> Send Message</button>
                    <button onClick={() => navigate('/profile')}><User size={18} /> Profile</button>
                </nav>

                <button className="inst-logout-btn" onClick={() => { localStorage.clear(); navigate('/'); }}>
                    <LogOut size={18} /> Sign out
                </button>
            </aside>

            <main className="inst-main">
                <div className="inst-inner-content">

                    <div className="inst-hero-banner">
                        <h1 className="inst-hero-title">Welcome back, {instructorName.split(' ')}.</h1>
                        <p className="inst-hero-subtitle">
                            You're shaping the next generation! one push at a time.
                        </p>
                        <button className="inst-btn-white" onClick={() => navigate('/my-students')}>
                            See my students
                        </button>
                    </div>

                    {isLoading ? (
                        <div className="inst-loading">Loading student data...</div>
                    ) : (
                        <>
                            <section className="inst-section">
                                <div className="inst-section-header">
                                    <h2 className="inst-section-title">My Students</h2>
                                    <button className="inst-view-all" onClick={() => navigate('/my-students')}>View all &rarr;</button>
                                </div>

                                <div className="inst-students-grid">
                                    {recentStudents.map((assignment, index) => (
                                        <div key={assignment.id} className="inst-student-card">
                                            <div className="inst-card-top">
                                                <div className="inst-student-avatar" style={{ background: avatarGradients[index % 5] }}>
                                                    {getInitials(assignment.student.fullName)}
                                                </div>
                                                <div className="inst-student-meta">
                                                    <h3 className="inst-student-name">{assignment.student.fullName}</h3>
                                                    <span className="inst-student-track">{assignment.learningPath}</span>
                                                </div>
                                            </div>

                                            <div className="inst-progress-container">
                                                <div className="inst-progress-labels">
                                                    <span>Progress</span>
                                                    <span>{assignment.progressPercentage}%</span>
                                                </div>
                                                <div className="inst-progress-track">
                                                    <div className="inst-progress-fill" style={{ width: `${assignment.progressPercentage}%` }}></div>
                                                </div>
                                            </div>

                                            <div className="inst-card-actions">
                                                <button className="inst-btn-outline" onClick={() => navigate(`/student-details/${assignment.student.id}`, { state: { assignmentId: assignment.id } })}>
                                                    View Details
                                                </button>
                                                <button className="inst-btn-purple" onClick={() => navigate('/messages')}>
                                                    Send Message
                                                </button>
                                            </div>

                                            <button className="inst-btn-drop" onClick={() => handleDropStudent(assignment.id)}>
                                                <Trash2 size={14} /> Drop Student
                                            </button>
                                        </div>
                                    ))}
                                    {recentStudents.length === 0 && <p className="inst-empty">No active students found.</p>}
                                </div>
                            </section>

                            <section className="inst-bottom-grid">

                                <div className="inst-glass-card">
                                    <h3 className="inst-card-title">🏆 Climbing the roadmap</h3>
                                    <p className="inst-card-subtitle">Your fastest movers this week</p>

                                    <div className="inst-movers-list">
                                        {topMovers.map((assignment, index) => (
                                            <div key={assignment.id} className="inst-mover-item">
                                                <div className="inst-student-avatar small" style={{ background: avatarGradients[index % 5] }}>
                                                    {getInitials(assignment.student.fullName)}
                                                </div>
                                                <div className="inst-mover-info">
                                                    <div className="inst-mover-name-row">
                                                        <h4>{assignment.student.fullName}</h4>
                                                        <span className="inst-fire-badge"><Flame size={12} fill="currentColor" /> {Math.floor(assignment.progressPercentage)}%</span>
                                                    </div>
                                                    <p className="inst-mover-track">{assignment.learningPath}</p>
                                                    <div className="inst-progress-track">
                                                        <div className="inst-progress-fill" style={{ width: `${assignment.progressPercentage}%` }}></div>
                                                    </div>
                                                </div>
                                                <span className="inst-mover-percent">{assignment.progressPercentage}%</span>
                                            </div>
                                        ))}
                                        {topMovers.length === 0 && <p className="inst-empty" style={{ padding: '20px', fontSize: '14px', border: 'none' }}>No progress data found.</p>}
                                    </div>
                                </div>

                                <div className="inst-glass-card">
                                    <h3 className="inst-card-title">Write Performance Note</h3>
                                    <form className="inst-note-form" onSubmit={handleSendNote}>

                                        <label>STUDENT</label>
                                        <select
                                            value={noteForm.assignmentId}
                                            onChange={(e) => setNoteForm({ ...noteForm, assignmentId: e.target.value })}
                                            required
                                        >
                                            {students.map(s => (
                                                <option key={s.id} value={s.id}>{s.student.fullName}</option>
                                            ))}
                                        </select>

                                        <label>NOTE TYPE</label>
                                        <select
                                            value={noteForm.type}
                                            onChange={(e) => setNoteForm({ ...noteForm, type: e.target.value })}
                                        >
                                            <option value="QUIZ_FEEDBACK">QUIZ_FEEDBACK</option>
                                            <option value="PROGRESS">PROGRESS</option>
                                            <option value="GENERAL">GENERAL</option>
                                            <option value="WARNING">WARNING</option>
                                            <option value="MILESTONE">MILESTONE</option>
                                        </select>

                                        <label>NOTE</label>
                                        <textarea
                                            placeholder="Write your note here..."
                                            rows="3"
                                            value={noteForm.noteText}
                                            onChange={(e) => setNoteForm({ ...noteForm, noteText: e.target.value })}
                                            required
                                        ></textarea>

                                        <button type="submit" className="inst-btn-submit" disabled={isSendingNote || students.length === 0}>
                                            {isSendingNote ? 'Sending...' : 'Send Note'}
                                        </button>

                                        {noteSuccess && <p className="inst-success-msg">✓ Note sent successfully</p>}
                                    </form>
                                </div>
                            </section>
                        </>
                    )}
                </div>
            </main>
        </div>
    );
};

export default InstructorDashboard;