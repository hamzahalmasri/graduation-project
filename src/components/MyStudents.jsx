import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, MessageSquare, User, LogOut, Code, MessageCircle, Trash2, ArrowRight } from 'lucide-react';
import logo from '../assets/light-logo.png';
import './InstructorDashboard.css';
import './InstructorsList.css';
import { getInstructorStudents, dropStudentAssignment } from '../api/instructorDashboardService';

const cardColors = ['#0ea5e9', '#ea580c', '#22c55e', '#eab308', '#8b5cf6', '#3b82f6'];

const MyStudents = () => {
    const navigate = useNavigate();
    const [students, setStudents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const instructorName = localStorage.getItem('userName') || 'Instructor';
    const MAX_STUDENTS = 10;

    useEffect(() => {
        const fetchStudents = async () => {
            const instructorId = localStorage.getItem('instructorId');
            if (!instructorId) {
                navigate('/');
                return;
            }

            try {
                const assignmentsData = await getInstructorStudents(instructorId);
                // Filter to only show active/approved students
                const activeAssignments = assignmentsData.filter(a => a.status === 'APPROVED' || a.active);
                setStudents(activeAssignments);
            } catch (error) {
                console.error("Error fetching students:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchStudents();
    }, [navigate]);

    const handleDropStudent = async (assignmentId, studentName) => {
        if (!window.confirm(`Are you sure you want to drop ${studentName}? This action cannot be undone.`)) return;

        try {
            await dropStudentAssignment(assignmentId);
            // Instantly remove them from the UI
            setStudents(prev => prev.filter(s => s.id !== assignmentId));
            alert(`${studentName} has been dropped successfully.`);
        } catch (err) {
            alert("Error dropping student: " + err.message);
        }
    };

    const getInitials = (name) => {
        if (!name) return "ST";
        return name.split(' ').map(n => n).join('').substring(0, 2).toUpperCase();
    };

    const remainingSeats = Math.max(0, MAX_STUDENTS - students.length);

    return (
        <div className="inst-dashboard-container">
            {/* EXACT MATCH SIDEBAR */}
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
                    <button onClick={() => navigate('/instructor-home')}><LayoutDashboard size={18} /> Dashboard</button>
                    <button className="active"><Users size={18} /> My Students</button>
                    <button onClick={() => navigate('/messages')}><MessageSquare size={18} /> Send Message</button>
                    <button onClick={() => navigate('/profile')}><User size={18} /> Profile</button>
                </nav>

                <button className="inst-logout-btn" onClick={() => { localStorage.clear(); navigate('/'); }}>
                    <LogOut size={18} /> Sign out
                </button>
            </aside>

            {/* MAIN CONTENT AREA */}
            <main className="inst-main">
                <div className="inst-inner-content">

                    {/* Header Section */}
                    <div className="mentors-header-section" style={{ alignItems: 'center' }}>
                        <div>
                            <span className="find-guide-badge" style={{ color: '#8B5CF6' }}>✨ YOUR ROSTER</span>
                            <h1 className="hero-title" style={{ color: '#1E293B', fontSize: '36px', margin: '0 0 8px 0' }}>
                                My Students
                            </h1>
                            <p style={{ color: '#64748B', margin: 0 }}>Manage your current mentees and track their progress.</p>
                        </div>

                        {/* Visual Tracker for the 10 Seat Limit */}
                        <div className="status-floating-card" style={{ flexDirection: 'row', gap: '20px' }}>
                            <div style={{ textAlign: 'center' }}>
                                <span className="status-label">ACTIVE</span>
                                <div className="status-active" style={{ color: '#3B82F6', justifyContent: 'center' }}>
                                    {students.length}/{MAX_STUDENTS}
                                </div>
                            </div>
                            <div style={{ width: '1px', height: '40px', background: '#E2E8F0' }}></div>
                            <div style={{ textAlign: 'center' }}>
                                <span className="status-label">SEATS LEFT</span>
                                <div className="status-active" style={{ color: remainingSeats === 0 ? '#EF4444' : '#10B981', justifyContent: 'center' }}>
                                    {remainingSeats}
                                </div>
                            </div>
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="inst-loading">Loading your students...</div>
                    ) : students.length === 0 ? (
                        <div className="inst-empty" style={{ marginTop: '40px' }}>
                            <Users size={48} color="#CBD5E1" style={{ marginBottom: '16px' }} />
                            <h3>No Active Students</h3>
                            <p>You currently have 10 available seats. Wait for students to request you as a mentor!</p>
                        </div>
                    ) : (
                        /* Modern Grid from InstructorsList.css */
                        <div className="modern-instructors-grid">
                            {students.map((assignment, index) => {
                                const color = cardColors[index % cardColors.length];
                                const studentInfo = assignment.student;

                                return (
                                    <div key={assignment.id} className="modern-instructor-card">
                                        <div className="card-top-border" style={{ backgroundColor: color }}></div>

                                        <div className="card-header-row" style={{ justifyContent: 'space-between' }}>
                                            <div className="modern-avatar" style={{ backgroundColor: color }}>
                                                {getInitials(studentInfo.fullName)}
                                            </div>
                                            <span className="badge-skill-modern" style={{ background: '#ECFDF5', color: '#10B981' }}>
                                                Active Mentee
                                            </span>
                                        </div>

                                        <h3 className="modern-instructor-name">{studentInfo.fullName}</h3>

                                        <div className="expertise-line">
                                            <Code size={14} style={{ flexShrink: 0 }} />
                                            <span>{studentInfo.major || "General Track"}</span>
                                        </div>

                                        {/* Push buttons to the bottom */}
                                        <div style={{ marginTop: 'auto', paddingTop: '20px' }}>

                                            <button
                                                className="btn-request-modern"
                                                style={{ marginBottom: '12px' }}
                                                onClick={() => navigate('/messages')}
                                            >
                                                <MessageCircle size={16} /> Send Message
                                            </button>

                                            <div style={{ display: 'flex', gap: '12px' }}>
                                                <button
                                                    className="btn-request-modern"
                                                    style={{ flex: 1, background: '#FFFFFF', fontSize: '13px' }}
                                                    onClick={() => navigate(`/student-details/${studentInfo.id}`, { state: { assignmentId: assignment.id } })}
                                                >
                                                    View Details <ArrowRight size={14} />
                                                </button>

                                                <button
                                                    className="btn-request-modern"
                                                    style={{ flex: 1, background: '#FEF2F2', color: '#EF4444', borderColor: '#FEE2E2', fontSize: '13px' }}
                                                    onClick={() => handleDropStudent(assignment.id, studentInfo.fullName)}
                                                >
                                                    <Trash2 size={14} /> Drop
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default MyStudents;