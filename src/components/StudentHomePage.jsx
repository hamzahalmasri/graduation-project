import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, UserCircle, MessageSquare, Map, BrainCircuit, Target, Award, Flame, Play, BotMessageSquare, LogOut, ChevronRight, BookOpen, Star, Code, CheckCircle2, Trash2 } from 'lucide-react';
import NotificationBell from './NotificationBell';
import { getUserRoadmaps, getStudentProgress } from '../api/roadmapService';
import { getStudentAssignment, dropInstructor } from '../api/assignmentService';
import { getTopInstructors, requestInstructor } from '../api/instructorService';
import green from '../assets/green.svg';
import logo from '../assets/light-logo.png';
import './InstructorsList.css';
import './StudentHomePage.css';


const cardColors = ['#0ea5e9', '#ea580c', '#22c55e', '#eab308', '#8b5cf6', '#3b82f6'];

const StudentHomePage = () => {
    const navigate = useNavigate();
    const [userData, setUserData] = useState(null);
    const [topInstructors, setTopInstructors] = useState([]);
    const [isRequesting, setIsRequesting] = useState(false);
    const [expandedSkills, setExpandedSkills] = useState({});

    const toggleSkills = (e, instructorId) => {
        e.stopPropagation();
        setExpandedSkills(prev => ({
            ...prev,
            [instructorId]: !prev[instructorId]
        }));
    };

    const handleLogout = () => {
        localStorage.clear();
        navigate('/');
    };

    const getInitials = (name) => {
        if (!name) return "IN";
        return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    };

    const fetchDashboardData = async () => {
        const studentId = localStorage.getItem('studentId');
        const realName = localStorage.getItem('userName') || "Student";

        if (!studentId) return;

        try {
            const roadmaps = await getUserRoadmaps(studentId);
            let currentPath = "No active roadmap";
            let totalSteps = 0;
            let currentStep = 0;
            let progressPercentage = 0;
            let latestRoadmap = null;

            if (roadmaps && roadmaps.length > 0) {
                latestRoadmap = roadmaps[0];
                currentPath = latestRoadmap.learningPath || latestRoadmap.mainGoal || "Custom Path";

                try {
                    let contentObj = latestRoadmap.roadmapContent;
                    if (typeof contentObj === 'string') {
                        contentObj = JSON.parse(contentObj);
                        if (typeof contentObj === 'string') {
                            contentObj = JSON.parse(contentObj);
                        }
                    }
                    totalSteps = contentObj?.phases?.reduce((acc, phase) => acc + (phase.steps?.length || 0), 0) || 0;
                } catch (e) {
                    console.error("Failed to parse roadmap content", e);
                }

                const progressData = await getStudentProgress(studentId, latestRoadmap.id);
                const completedRecords = progressData.filter(p => p.status === 'COMPLETED' || p.status?.toUpperCase() === 'COMPLETED');
                const uniqueCompletedSteps = new Set(completedRecords.map(p => `${p.phaseTitle}|${p.stepTitle}`));

                currentStep = uniqueCompletedSteps.size;
                progressPercentage = totalSteps === 0 ? 0 : Math.min(100, Math.round((currentStep / totalSteps) * 100));
            }

            // Fetch Instructor Status
            let activeAssignment = null;
            try {
                const assignments = await getStudentAssignment(studentId);
                activeAssignment = assignments && assignments.length > 0 ? assignments.find(a => a.status === 'PENDING' || a.status === 'APPROVED') : null;

                const instructors = await getTopInstructors();
                setTopInstructors(instructors);
            } catch (err) {
                console.error("API Error:", err);
            }

            setUserData({
                fullName: realName,
                studentId: studentId,
                currentPath,
                progressPercentage,
                currentStep,
                totalSteps,
                roadmapId: latestRoadmap ? latestRoadmap.id : null,
                activeAssignment: activeAssignment,
                quizzesCompleted: 12,
                bestScore: 98,
                streakDays: 5
            });

        } catch (error) {
            console.error("Error fetching dynamic home page data:", error);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const handleInstructorRequest = async (instructorId) => {
        if (userData.activeAssignment) return;

        try {
            setIsRequesting(true);
            await requestInstructor(userData.studentId, instructorId);
            alert("Request sent successfully! Waiting for admin approval.");
            fetchDashboardData();
        } catch (e) {
            alert("Failed to send request. Please try again.", e);
        } finally {
            setIsRequesting(false);
        }
    };

    const handleDrop = async (assignmentId) => {
        if (window.confirm("Are you sure you want to drop this instructor?")) {
            try {
                await dropInstructor(assignmentId);
                setUserData(prev => ({ ...prev, activeAssignment: null }));
                alert("Instructor dropped successfully.");
            } catch (error) {
                alert("Failed to drop instructor. " + error.message);
            }
        }
    };

    if (!userData) {
        return <div className="loading-screen"><h2>Loading please wait...</h2></div>;
    }

    const remainingSteps = Math.max(0, userData.totalSteps - userData.currentStep);
    const hasInstructor = userData.activeAssignment !== null && userData.activeAssignment !== undefined;

    let instructorTitle = "Find an Instructor";
    let instructorSub = "Choose your mentor";
    if (userData.activeAssignment?.status === 'PENDING') {
        instructorTitle = "Instructor Status";
        instructorSub = "Waiting for approval ⏳";
    } else if (userData.activeAssignment?.status === 'APPROVED') {
        instructorTitle = "Instructor Chat";
        instructorSub = "Chat with your mentor ✅";
    }

    return (
        <div className="student-home-container">

            {/* 🚨 NEW SIDEBAR */}
            <aside className="sidebar">
                <div className="sidebar-logo">
                    <img src={logo} alt="Brand Logo" className="logo-image" />
                </div>

                <div className="sidebar-nav">
                    <button onClick={() => navigate('/chat')}><BotMessageSquare size={18} /> AI Chat</button>
                    <button onClick={() => navigate('/roadmaps')}><Map size={18} /> Roadmap</button>
                    <button onClick={() => navigate('/quizzes')}><BrainCircuit size={18} /> Quizzes</button>
                    <button onClick={() => navigate('/instructor-chat')}><MessageSquare size={18} /> Instructor</button>
                </div>

                {/* Logout positioned at bottom */}
                <button className="sidebar-logout" onClick={handleLogout}>
                    <LogOut size={18} /> Logout
                </button>
            </aside>

            <main className="main-content">

                {/* 🚨 FLOATING NOTIFICATION */}
                <div className="floating-notification">
                    <NotificationBell />
                </div>

                {/* 🚨 HERO BANNER: Full width, no rounded corners, flush to top */}
                <section className="hero-banner">
                    <div className="hero-content">
                        <span className="hero-badge">✨ YOUR DASHBOARD</span>
                        <h1 className="hero-title">Welcome again,<br /><span className="highlight-yellow">{userData.fullName}!</span></h1>
                        <p className="hero-subtext">You're on a {userData.streakDays}-day streak! {userData.progressPercentage}% through your current path.</p>

                        <div className="streak-tracker">
                            <Flame size={18} color="#FBBF24" fill="#FBBF24" />
                            <span className="streak-text">{userData.streakDays} Day Streak</span>
                            <div className="streak-dots">
                                {[...Array(5)].map((_, i) => <div key={`active-${i}`} className="dot active"></div>)}
                                {[...Array(2)].map((_, i) => <div key={`inactive-${i}`} className="dot inactive"></div>)}
                            </div>
                        </div>

                        <button className="btn-yellow" onClick={() => userData.roadmapId ? navigate(`/roadmap/${userData.roadmapId}`) : navigate('/chat')}>
                            {userData.roadmapId ? (<><Play size={14} fill="currentColor" /> Continue Learning</>) : "Generate Roadmap"}
                        </button>
                    </div>
                    <div className="hero-image-placeholder">
                        <img src={green} alt="Dashboard Illustration" className="hero-image" />
                    </div>
                </section>

                {/* Wrapper for the rest of the page to give it padding inside the main content */}
                <div className="page-inner-content">

                    {/* Quick Actions */}
                    <h2 className="section-title">Quick Actions</h2>
                    <section className="quick-actions-grid">
                        <div className="action-card" onClick={() => navigate('/chat')}>
                            <div className="action-icon icon-ai"><BotMessageSquare size={30} /></div>
                            <h3>Chat With AI</h3>
                            <p>Get instant help & tutoring</p>
                            <ChevronRight className="arrow-icon" size={16} />
                        </div>
                        <div className="action-card" onClick={() => navigate('/roadmaps')}>
                            <div className="action-icon icon-roadmap"><Map size={24} /></div>
                            <h3>My Roadmap</h3>
                            <p>View curriculum & milestones</p>
                            <ChevronRight className="arrow-icon" size={16} />
                        </div>
                        <div className="action-card" onClick={() => navigate('/quizzes')}>
                            <div className="action-icon icon-quiz"><BrainCircuit size={24} /></div>
                            <h3>Take Quizzes</h3>
                            <p>Test knowledge & earn badges</p>
                            <ChevronRight className="arrow-icon" size={16} />
                        </div>
                        <div className="action-card" onClick={() => userData.activeAssignment?.status === 'APPROVED' ? navigate('/instructor-chat') : alert(`Status: ${userData.activeAssignment?.status || 'None'}`)}>
                            <div className="action-icon icon-instructor"><MessageSquare size={24} /></div>
                            <h3>{instructorTitle}</h3>
                            <p style={{ color: '#6B7280' }}>{instructorSub}</p>
                            <ChevronRight className="arrow-icon" size={16} />
                        </div>
                    </section>

                    <div className="section-header-row" style={{ marginTop: '40px' }}>
                        <h2 className="section-title">
                            {hasInstructor ? 'Other Top Instructors' : 'Top Instructors'}
                        </h2>
                        <button className="btn-text-purple" onClick={() => navigate('/instructors')}>View All Mentors →</button>
                    </div>

                    {userData.activeAssignment?.status === 'APPROVED' && (
                        <div style={{
                            background: 'linear-gradient(135deg, #F3E8FF 0%, #FFFFFF 100%)',
                            border: '1px solid #D8B4FE',
                            borderRadius: '20px',
                            padding: '24px',
                            marginBottom: '24px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            boxShadow: '0 4px 15px rgba(139, 92, 246, 0.1)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                                <div className="modern-avatar" style={{ backgroundColor: '#8B5CF6', width: '64px', height: '64px', fontSize: '24px' }}>
                                    {getInitials(userData.activeAssignment.instructor?.fullName)}
                                </div>
                                <div>
                                    <span style={{ fontSize: '12px', fontWeight: '800', color: '#8B5CF6', letterSpacing: '1px', textTransform: 'uppercase' }}>YOUR INSTRUCTOR</span>
                                    <h2 style={{ margin: '4px 0', fontSize: '24px', color: '#1E293B' }}>{userData.activeAssignment.instructor?.fullName}</h2>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', color: '#10B981', fontWeight: '600' }}>
                                        <CheckCircle2 size={16} /> Approved & Active
                                    </div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button onClick={() => navigate('/instructor-chat')} style={{ padding: '12px 24px', borderRadius: '12px', background: '#8B5CF6', color: 'white', border: 'none', fontWeight: '600', cursor: 'pointer', display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    <MessageSquare size={18} /> Chat
                                </button>
                                <button onClick={() => handleDrop(userData.activeAssignment.id)} style={{ padding: '12px 24px', borderRadius: '12px', background: '#FEE2E2', color: '#EF4444', border: 'none', fontWeight: '700', cursor: 'pointer', display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    <Trash2 size={18} /> Drop Instructor
                                </button>
                            </div>
                        </div>
                    )}

                    <section className="modern-instructors-grid" style={{ marginBottom: '32px', gridTemplateColumns: 'repeat(3, 1fr)' }}>
                        {topInstructors.length > 0 ? topInstructors.slice(0, 3).map((instructor, index) => {
                            const color = cardColors[index % cardColors.length];
                            const isThisInstructorRequested = userData.activeAssignment?.instructor?.id === instructor.id;
                            const isFaded = hasInstructor && !isThisInstructorRequested;

                            return (
                                <div key={instructor.id} className="modern-instructor-card" style={{ opacity: isFaded ? 0.6 : 1, transition: 'opacity 0.3s' }}>
                                    <div className="card-top-border" style={{ backgroundColor: color }}></div>

                                    <div className="card-header-row">
                                        <div className="modern-avatar" style={{ backgroundColor: color }}>
                                            {getInitials(instructor.fullName)}
                                        </div>
                                    </div>

                                    <h3 className="modern-instructor-name">{instructor.fullName}</h3>

                                    <div className="expertise-line">
                                        <Code size={14} style={{ flexShrink: 0 }} />
                                        <span style={{ display: 'inline-block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {instructor.expertiseFields?.map(f => f.replace('_', ' ')).join(', ')}
                                        </span>
                                    </div>

                                    <p className="modern-bio" style={{ fontStyle: instructor.bio ? 'normal' : 'italic', color: instructor.bio ? '#475569' : '#94A3B8' }}>
                                        "{instructor.bio || "This instructor hasn't added a bio yet."}"
                                    </p>

                                    <div className="instructor-skills" style={{ justifyContent: 'flex-start', marginTop: 'auto', marginBottom: '16px' }}>
                                        {instructor.skills?.slice(0, expandedSkills[instructor.id] ? instructor.skills.length : 3).map((skill, idx) => (
                                            <span key={idx} className="badge-skill-modern">{skill}</span>
                                        ))}

                                        {instructor.skills?.length > 3 && (
                                            <span
                                                className="badge-skill-more-modern"
                                                onClick={(e) => toggleSkills(e, instructor.id)}
                                            >
                                                {expandedSkills[instructor.id] ? 'Less' : `+${instructor.skills.length - 3}`}
                                            </span>
                                        )}
                                    </div>

                                    <div className="instructor-exp-modern">
                                        <Award size={14} /> {instructor.yearsOfExperience || 0} Years Experience
                                    </div>

                                    <button
                                        className={`btn-request-modern ${isThisInstructorRequested ? 'requested' : ''}`}
                                        disabled={isRequesting || hasInstructor}
                                        onClick={() => handleInstructorRequest(instructor.id)}
                                    >
                                        {hasInstructor
                                            ? (isThisInstructorRequested ? <><CheckCircle2 size={16} /> {userData.activeAssignment.status === 'APPROVED' ? 'Assigned' : 'Requested'}</> : 'You already have a mentor')
                                            : 'Request Mentor'}
                                    </button>
                                </div>
                            );
                        }) : (
                            <p className="no-data-text">No instructors available right now.</p>
                        )}
                    </section>

                    {/* Your Progress */}
                    <h2 className="section-title">Your Progress</h2>
                    <section className="progress-overview-grid">
                        <div className="progress-stat-card">
                            <div className="stat-icon-wrapper purple"><Target size={24} /></div>
                            <div className="stat-info">
                                <span className="stat-label">CURRENT PATH</span>
                                <span className="stat-value" style={{ fontSize: '15px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '140px' }}>
                                    {userData.currentPath}
                                </span>
                            </div>
                        </div>
                        <div className="progress-stat-card">
                            <div className="stat-icon-wrapper orange"><BrainCircuit size={24} /></div>
                            <div className="stat-info">
                                <span className="stat-label">QUIZZES DONE</span>
                                <span className="stat-value highlight-orange">{userData.quizzesCompleted}</span>
                            </div>
                        </div>
                        <div className="progress-stat-card">
                            <div className="stat-icon-wrapper green"><Award size={24} /></div>
                            <div className="stat-info">
                                <span className="stat-label">BEST SCORE</span>
                                <span className="stat-value highlight-green">{userData.bestScore}%</span>
                            </div>
                        </div>
                        <div className="progress-stat-card">
                            <div className="stat-icon-wrapper blue"><BookOpen size={24} /></div>
                            <div className="stat-info">
                                <span className="stat-label">CURRENT STEP</span>
                                <span className="stat-value highlight-blue">{userData.currentStep}/{userData.totalSteps}</span>
                            </div>
                        </div>
                    </section>

                    {/* In Progress Card */}
                    {userData.totalSteps > 0 && (
                        <section className="in-progress-card">
                            <div className="in-progress-header">
                                <div className="header-left">
                                    <span className="badge-in-progress">In Progress</span>
                                    <h2 className="path-title">{userData.currentPath}</h2>
                                </div>
                            </div>

                            <div className="progress-details">
                                <span className="step-count">Step {userData.currentStep} of {userData.totalSteps}</span>
                                <div className="right-stats">
                                    <span className="steps-left">{remainingSteps} steps left</span>
                                    <span className="percentage">{userData.progressPercentage}%</span>
                                </div>
                            </div>

                            <div className="linear-progress-track">
                                <div className="linear-progress-fill" style={{ width: `${userData.progressPercentage}%` }}></div>
                            </div>

                            <div className="in-progress-footer">
                                <div className="circular-progress-section">
                                    <div className="circular-progress" style={{ background: `conic-gradient(#7C3AED ${userData.progressPercentage}%, #F3F4F6 0)` }}>
                                        <div className="inner-circle">{userData.progressPercentage}%</div>
                                    </div>
                                    <div className="encouragement-text">
                                        {userData.progressPercentage >= 100 ? "Amazing, you finished this path!" : "Keep going, you are doing great!"}
                                        <button className="btn-purple" onClick={() => navigate(`/roadmap/${userData.roadmapId}`)}>
                                            Continue Learning <Play size={14} fill="currentColor" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </section>
                    )}
                </div>
            </main>
        </div>
    );
};

export default StudentHomePage;