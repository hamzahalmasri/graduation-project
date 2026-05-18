import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Users, GraduationCap, BookOpen, Clock,
    CheckSquare, Zap, Users2, Bell, Search,
    LogOut, Activity, FileText, Check, X,
    ActivitySquare, Briefcase, Eye, CheckCircle
} from 'lucide-react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

import {
    getPlatformStats,
    getPendingAssignments,
    getRoadmapAnalytics,
    getMentorshipStatistics,
    getSystemActivity,
    approveAssignment,
    rejectAssignment,
    getPendingInstructors,
    approveInstructor
} from '../api/adminService';

import './AdminDashboard.css';

dayjs.extend(relativeTime);

const AdminDashboard = () => {
    const navigate = useNavigate();

    const [stats, setStats] = useState(null);
    const [pending, setPending] = useState([]);
    const [roadmaps, setRoadmaps] = useState(null);
    const [mentorship, setMentorship] = useState(null);
    const [activities, setActivities] = useState([]);

    // New State for Pending Instructors & Modal
    const [pendingInstructorsList, setPendingInstructorsList] = useState([]);
    const [selectedInstructor, setSelectedInstructor] = useState(null);

    const fetchAllData = useCallback(async () => {
        try {
            const [
                statsRes,
                pendingRes,
                roadmapsRes,
                mentorshipRes,
                activitiesRes,
                instructorsRes
            ] = await Promise.all([
                getPlatformStats().catch(() => null),
                getPendingAssignments().catch(() => []),
                getRoadmapAnalytics().catch(() => null),
                getMentorshipStatistics().catch(() => null),
                getSystemActivity().catch(() => []),
                getPendingInstructors().catch(() => []) // Fetch Pending Instructors
            ]);

            setStats(statsRes);
            setPending(pendingRes);
            setRoadmaps(roadmapsRes);
            setMentorship(mentorshipRes);
            setActivities(activitiesRes);
            setPendingInstructorsList(instructorsRes);
        } catch (error) {
            console.error("Error fetching admin data:", error);
        }
    }, []);

    useEffect(() => {
        const initializeDashboard = async () => {
            await fetchAllData();
        };

        initializeDashboard();
    }, [fetchAllData]);

    const handleApprove = async (id) => {
        try {
            await approveAssignment(id);
            fetchAllData();
        } catch (err) {
            alert("Failed to approve request.", err.message);
        }
    };

    const handleReject = async (id) => {
        const note = window.prompt("Reason for rejection (optional):");
        if (note !== null) {
            try {
                await rejectAssignment(id, note);
                fetchAllData();
            } catch (err) {
                alert("Failed to reject request. Check your server connection.", err.message);
            }
        }
    };

    // --- NEW INSTRUCTOR HANDLERS ---
    const handleInstructorApprove = async (id) => {
        try {
            await approveInstructor(id);
            setSelectedInstructor(null); // close modal if open
            fetchAllData(); // refresh dashboard
        } catch (err) {
            alert("Failed to approve instructor.", err.message);
        }
    };

    const getInitials = (name) => {
        if (!name) return "U";
        return name.split(' ').map(n => n).join('').substring(0, 2).toUpperCase();
    };

    const mapActivity = (type) => {
        switch (type) {
            case 'PROGRESS': return { text: "Student completed roadmap progress", icon: <ActivitySquare size={12} />, color: "#3b82f6" };
            case 'NOTE': return { text: "Instructor sent performance feedback", icon: <FileText size={12} />, color: "#8b5cf6" };
            case 'REMINDER': return { text: "Inactivity reminder sent to student", icon: <Bell size={12} />, color: "#f97316" };
            case 'CHAT': return { text: "New mentorship chat activity", icon: <Users2 size={12} />, color: "#06b6d4" };
            case 'ROADMAP': return { text: "New AI roadmap generated", icon: <Zap size={12} />, color: "#8338ec" };
            case 'INSTRUCTOR': return { text: "Mentorship activity updated", icon: <CheckSquare size={12} />, color: "#10b981" };
            default: return { text: "System activity recorded", icon: <Activity size={12} />, color: "#8d99ae" };
        }
    };

    const maxPathsCount = roadmaps?.popularPaths ? Math.max(...Object.values(roadmaps.popularPaths)) : 1;

    return (
        <div className="admin-container">
            <main className="admin-main-content">

                <header className="admin-header">
                    <h1><Zap color="#4361ee" size={28} /> AdminHub</h1>
                    <div className="admin-header-actions">
                        <button className="admin-icon-btn" onClick={() => { localStorage.clear(); navigate('/'); }}>
                            <LogOut size={20} />
                            Logout
                        </button>
                    </div>
                </header>

                {/* --- STATS CARDS --- */}
                <section className="admin-kpi-grid">
                    <div className="admin-kpi-card">
                        <div className="admin-kpi-info">
                            <p>Total Users</p>
                            <h2>{stats?.totalUsers || 0}</h2>
                            <span className="admin-kpi-trend admin-trend-up">Platform Wide</span>
                        </div>
                        <div className="admin-kpi-icon" style={{ background: '#f3e8ff', color: '#8338ec' }}><Users size={24} /></div>
                    </div>
                    <div className="admin-kpi-card">
                        <div className="admin-kpi-info">
                            <p>Active Students</p>
                            <h2>{stats?.activeStudents || 0}</h2>
                            <span className="admin-kpi-trend admin-trend-up">Students</span>
                        </div>
                        <div className="admin-kpi-icon" style={{ background: '#e0f2fe', color: '#3a86ff' }}><BookOpen size={24} /></div>
                    </div>
                    <div className="admin-kpi-card">
                        <div className="admin-kpi-info">
                            <p>Active Instructors</p>
                            <h2>{stats?.activeInstructors || 0}</h2>
                            <span className="admin-kpi-trend admin-trend-up">Approved Mentors</span>
                        </div>
                        <div className="admin-kpi-icon" style={{ background: '#dcfce7', color: '#06d6a0' }}><GraduationCap size={24} /></div>
                    </div>
                    <div className="admin-kpi-card">
                        <div className="admin-kpi-info">
                            <p>Pending Approvals</p>
                            <h2>{stats?.pendingInstructorApprovals || 0}</h2>
                            <span className="admin-kpi-trend admin-trend-warning">Needs Review</span>
                        </div>
                        <div className="admin-kpi-icon" style={{ background: '#fef3c7', color: '#f97316' }}><Clock size={24} /></div>
                    </div>
                </section>

                {/* --- PENDING MENTORSHIP REQUESTS --- */}
                <section className="admin-section-header">
                    <div className="admin-section-title">
                        <div className="admin-title-icon" style={{ background: '#ffedd5', color: '#f97316' }}><CheckSquare size={16} /></div>
                        Pending Mentorship Approvals
                    </div>
                    <span className="admin-badge-count">{pending.length} pending</span>
                </section>

                <div className="admin-table-container">
                    <table className="admin-data-table">
                        <thead>
                            <tr>
                                <th>Student</th>
                                <th>Requested Instructor</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pending.length === 0 ? (
                                <tr><td colSpan="4" style={{ textAlign: 'center', color: '#8d99ae' }}>No pending requests.</td></tr>
                            ) : (
                                pending.map(req => (
                                    <tr key={req.id}>
                                        <td>
                                            <div className="admin-student-profile">
                                                <div className="admin-avatar-circle" style={{ background: '#4361ee' }}>
                                                    {getInitials(req.student?.fullName)}
                                                </div>
                                                {req.student?.fullName}
                                            </div>
                                        </td>
                                        <td>{req.instructor?.fullName}</td>
                                        <td><span className="admin-status-badge">Pending</span></td>
                                        <td className="admin-actions-cell">
                                            <button className="admin-btn admin-btn-approve" onClick={() => handleApprove(req.id)}>
                                                <Check size={14} /> Approve
                                            </button>
                                            <button className="admin-btn admin-btn-reject" onClick={() => handleReject(req.id)}>
                                                <X size={14} /> Reject
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* --- NEW: PENDING INSTRUCTOR APPROVALS --- */}
                <section className="admin-section-header">
                    <div className="admin-section-title">
                        <div className="admin-title-icon" style={{ background: '#e0e7ff', color: '#4f46e5' }}><GraduationCap size={16} /></div>
                        Pending Instructor Approvals
                    </div>
                    <span className="admin-badge-count blue-badge">{pendingInstructorsList.length} awaiting review</span>
                </section>

                <div style={{ marginBottom: '30px' }}>
                    {pendingInstructorsList.length === 0 ? (
                        <div className="admin-table-container" style={{ textAlign: 'center', color: '#8d99ae', padding: '24px' }}>
                            No pending instructor approvals.
                        </div>
                    ) : (
                        pendingInstructorsList.map(instructor => (
                            <div className="instructor-row-card" key={instructor.id}>
                                <div className="instructor-profile-block">
                                    <div className="admin-avatar-circle" style={{ backgroundColor: '#4f46e5', width: '40px', height: '40px', fontSize: '14px' }}>
                                        {getInitials(instructor.fullName)}
                                    </div>
                                    <div className="instructor-meta">
                                        <h4>{instructor.fullName}</h4>
                                        <p>{instructor.email}</p>
                                    </div>
                                </div>
                                <div className="instructor-actions-block">
                                    <div className="exp-badge">
                                        <Briefcase size={12} color="#94a3b8" /> {instructor.yearsOfExperience}y exp
                                    </div>
                                    <button className="admin-btn btn-view-info" onClick={() => setSelectedInstructor(instructor)}>
                                        <Eye size={14} /> View Info
                                    </button>
                                    <button className="admin-btn btn-instructor-approve" onClick={() => handleInstructorApprove(instructor.id)}>
                                        <CheckCircle size={14} /> Approve
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* --- ROADMAP ANALYTICS --- */}
                <section className="admin-section-header">
                    <div className="admin-section-title">
                        <div className="admin-title-icon" style={{ background: '#e0e7ff', color: '#4f46e5' }}><Zap size={16} /></div>
                        AI Roadmap Analytics
                    </div>
                </section>

                <div className="admin-analytics-grid">
                    <div className="admin-mini-card-stack">
                        <div className="admin-mini-card">
                            <p>Total Generated Roadmaps</p>
                            <h3 style={{ color: '#4f46e5' }}>{roadmaps?.totalRoadmaps || 0}</h3>
                        </div>
                        <div className="admin-mini-card">
                            <p>Generated Today</p>
                            <h3 style={{ color: '#2563eb' }}>{roadmaps?.roadmapsToday || 0}</h3>
                        </div>
                        <div className="admin-mini-card">
                            <p>Generated This Week</p>
                            <h3 style={{ color: '#4f46e5' }}>{roadmaps?.roadmapsThisWeek || 0}</h3>
                        </div>
                    </div>

                    <div className="admin-learning-paths-card">
                        <h4>Most Popular Learning Paths</h4>
                        {roadmaps?.popularPaths && Object.entries(roadmaps.popularPaths).map(([path, count], index) => {
                            const colors = ['#8b5cf6', '#3b82f6', '#8b5cf6', '#06b6d4', '#8b5cf6'];
                            const color = colors[index % colors.length];
                            const percent = Math.round((count / maxPathsCount) * 100);

                            return (
                                <div className="admin-path-row" key={path}>
                                    <span className="admin-path-index">{index + 1}</span>
                                    <span className="admin-path-name">{path}</span>
                                    <div className="admin-path-progress-container">
                                        <div className="admin-progress-bar">
                                            <div className="admin-progress-fill" style={{ width: `${percent}%`, backgroundColor: color }}></div>
                                        </div>
                                    </div>
                                    <span className="admin-path-stats">{count}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* --- MENTORSHIP STATS --- */}
                <section className="admin-section-header">
                    <div className="admin-section-title">
                        <div className="admin-title-icon" style={{ background: '#e6fcf5', color: '#0ca678' }}><Users2 size={16} /></div>
                        Mentorship Statistics
                    </div>
                </section>

                <section className="admin-bottom-grid">
                    <div className="admin-stat-card-line">
                        <p className="title">Active Assignments</p>
                        <h2 style={{ color: '#0ca678' }}>{mentorship?.activeMentorships || 0}</h2>
                        <p className="subtitle" style={{ color: '#0ca678' }}>Platform Engagement</p>
                        <div className="admin-line-indicator"><div className="admin-line-indicator-fill" style={{ width: '100%', backgroundColor: '#0ca678' }}></div></div>
                    </div>
                    <div className="admin-stat-card-line">
                        <p className="title">Pending Requests</p>
                        <h2 style={{ color: '#f59f00' }}>{mentorship?.pendingRequests || 0}</h2>
                        <p className="subtitle" style={{ color: '#8d99ae' }}>Awaiting Action</p>
                        <div className="admin-line-indicator"><div className="admin-line-indicator-fill" style={{ width: '100%', backgroundColor: '#f59f00' }}></div></div>
                    </div>
                    <div className="admin-stat-card-line">
                        <p className="title">Instructor Capacity Usage</p>
                        <h2 style={{ color: '#4361ee' }}>{mentorship?.instructorCapacityUsage || 0}%</h2>
                        <p className="subtitle" style={{ color: '#4361ee' }}>System Load</p>
                        <div className="admin-line-indicator"><div className="admin-line-indicator-fill" style={{ width: `${mentorship?.instructorCapacityUsage || 0}%`, backgroundColor: '#4361ee' }}></div></div>
                    </div>
                </section>

                {/* --- SYSTEM ACTIVITY --- */}
                <section className="admin-section-header">
                    <div className="admin-section-title">
                        <div className="admin-title-icon" style={{ background: '#e8f0fe', color: '#1a73e8' }}><Activity size={16} /></div>
                        Recent System Activity
                        <span style={{ display: 'inline-block', width: '8px', height: '8px', backgroundColor: '#0be881', borderRadius: '50%', marginLeft: '8px' }}></span>
                    </div>
                </section>

                <div className="admin-timeline-card">
                    {activities.length === 0 ? (
                        <p style={{ color: '#8d99ae' }}>No recent activity.</p>
                    ) : (
                        activities.slice(0, 10).map((act, index) => {
                            const config = mapActivity(act.type);
                            return (
                                <div className="admin-timeline-item" key={index}>
                                    <div className="admin-timeline-icon-dot" style={{ borderColor: config.color, color: config.color }}>
                                        {config.icon}
                                    </div>
                                    <div className="admin-timeline-content">{config.text}</div>
                                    <div className="admin-timeline-time">{dayjs(act.createdAt).fromNow()}</div>
                                </div>
                            );
                        })
                    )}
                </div>

            </main>

            {/* --- INSTRUCTOR VIEW MODAL --- */}
            <div className={`modal-overlay ${selectedInstructor ? 'active' : ''}`} onClick={() => setSelectedInstructor(null)}>
                <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                    <button className="modal-close-btn" onClick={() => setSelectedInstructor(null)}>
                        <X size={14} />
                    </button>

                    {selectedInstructor && (
                        <>
                            <div className="modal-header-profile">
                                <div className="modal-avatar">{getInitials(selectedInstructor.fullName)}</div>
                                <div className="modal-title-block">
                                    <h3>{selectedInstructor.fullName}</h3>
                                    <p>{selectedInstructor.email}</p>
                                    <div className="modal-exp-line">
                                        <Briefcase size={12} color="#f59f00" /> {selectedInstructor.yearsOfExperience} years of experience
                                    </div>
                                </div>
                            </div>

                            <div className="modal-section-label">Bio</div>
                            <p className="modal-bio">{selectedInstructor.bio || "No bio provided."}</p>

                            <div className="modal-section-label">Expertise</div>
                            <div className="tag-container">
                                {selectedInstructor.expertiseFields?.length > 0 ? (
                                    selectedInstructor.expertiseFields.map((field, i) => (
                                        <span key={i} className="tag-expertise">{field.replace('_', ' ')}</span>
                                    ))
                                ) : (
                                    <span style={{ fontSize: '12px', color: '#94a3b8' }}>None provided</span>
                                )}
                            </div>

                            <div className="modal-section-label">Skills</div>
                            <div className="tag-container">
                                {selectedInstructor.skills?.length > 0 ? (
                                    selectedInstructor.skills.map((skill, i) => (
                                        <span key={i} className="tag-skill">{skill}</span>
                                    ))
                                ) : (
                                    <span style={{ fontSize: '12px', color: '#94a3b8' }}>None provided</span>
                                )}
                            </div>

                            <div className="modal-footer-actions">
                                <button className="admin-btn btn-modal-close" onClick={() => setSelectedInstructor(null)}>Close</button>
                                <button className="admin-btn btn-instructor-approve" onClick={() => handleInstructorApprove(selectedInstructor.id)}>
                                    Approve Instructor
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>

        </div>
    );
};

export default AdminDashboard;