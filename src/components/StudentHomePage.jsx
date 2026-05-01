import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, UserCircle, MessageSquare, Map, BrainCircuit, Target, Award, Flame, Play, BotMessageSquare, LogOut, ChevronRight, BookOpen, Star, Code, CheckCircle2 } from 'lucide-react';
import NotificationBell from './NotificationBell';
import { getUserRoadmaps, getStudentProgress } from '../api/roadmapService';
import { getStudentAssignment } from '../api/assignmentService';
import { getTopInstructors, requestInstructor } from '../api/instructorService';
import green from '../assets/green.svg';
import robotPhone from '../assets/phone-robot.svg';
import logo from '../assets/logo.png';
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
            // 1. Fetch User's Roadmaps
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

                // 2. Fetch Dynamic Progress
                const progressData = await getStudentProgress(studentId, latestRoadmap.id);
                const completedRecords = progressData.filter(p => p.status === 'COMPLETED' || p.status?.toUpperCase() === 'COMPLETED');
                const uniqueCompletedSteps = new Set(completedRecords.map(p => `${p.phaseTitle}|${p.stepTitle}`));

                currentStep = uniqueCompletedSteps.size;
                progressPercentage = totalSteps === 0 ? 0 : Math.min(100, Math.round((currentStep / totalSteps) * 100));
            }

            // 3. Fetch Instructor Status & Top Instructors
            let activeAssignment = null;
            try {
                const assignments = await getStudentAssignment(studentId);
                activeAssignment = assignments && assignments.length > 0 ? assignments[0] : null;

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
                instructorStatus: activeAssignment ? activeAssignment.status : null,
                requestedInstructorId: activeAssignment?.instructor?.id || null, // Tracking WHO was requested
                instructorNote: activeAssignment ? activeAssignment.note : null,
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
        if (userData.instructorStatus === 'PENDING' || userData.instructorStatus === 'APPROVED') {
            alert("You already have an active or pending instructor request.");
            return;
        }

        try {
            setIsRequesting(true);
            await requestInstructor(userData.studentId, instructorId);
            alert("Request sent successfully! Waiting for admin approval.");

            // Optimistic UI Update: Instantly turn this specific button green
            setUserData(prev => ({
                ...prev,
                instructorStatus: 'PENDING',
                requestedInstructorId: instructorId
            }));

            fetchDashboardData(); // Refresh data quietly in the background
        } catch (e) {
            alert("Failed to send request. Please try again.", e);
        } finally {
            setIsRequesting(false);
        }
    };

    if (!userData) {
        return <div className="loading-screen"><h2>Loading please wait...</h2></div>;
    }

    const remainingSteps = Math.max(0, userData.totalSteps - userData.currentStep);

    let instructorTitle = "Find an Instructor";
    let instructorSub = "Choose your mentor";
    if (userData.instructorStatus === 'PENDING') {
        instructorTitle = "Instructor Status";
        instructorSub = "Waiting for approval ⏳";
    } else if (userData.instructorStatus === 'APPROVED') {
        instructorTitle = "Instructor Chat";
        instructorSub = "Chat with your mentor ✅";
    } else if (userData.instructorStatus === 'REJECTED') {
        instructorTitle = "Request Rejected";
        instructorSub = "Check notes and re-apply ❌";
    }

    return (
        <div className="student-home-container">
            <nav className="top-navbar">
                <div className="nav-left">
                    <div className="brand-logo">
                        <img src={logo} alt="Brand Logo" className="logo-image" />
                    </div>
                    <div className="nav-links">
                        <button onClick={() => navigate('/chat')}><BotMessageSquare size={16} /> AI Chat</button>
                        <button onClick={() => navigate('/roadmaps')}><Map size={16} /> Roadmap</button>
                        <button onClick={() => navigate('/quizzes')}><BrainCircuit size={16} /> Quizzes</button>
                        <button onClick={() => navigate('/instructor-chat')}><MessageSquare size={16} /> Instructor</button>
                    </div>
                </div>
                <div className="nav-right">
                    <NotificationBell />
                    <button className="icon-btn"><UserCircle size={20} /></button>
                    <button className="icon-btn logout" onClick={handleLogout}>
                        <LogOut size={20} />
                    </button>
                </div>
            </nav>

            <main className="main-content">
                {/* Hero Section */}
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

                {/* Quick Actions */}
                <h2 className="section-title">Quick Actions</h2>
                <section className="quick-actions-grid">
                    <div className="action-card" onClick={() => navigate('/chat')}>
                        <div className="action-icon icon-ai"><img src={robotPhone} alt="AI Tutor" className='robot-img' /></div>
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
                    <div className="action-card" onClick={() => userData.instructorStatus === 'APPROVED' ? navigate('/instructor-chat') : alert(`Status: ${userData.instructorStatus || 'None'}`)}>
                        <div className="action-icon icon-instructor"><MessageSquare size={24} /></div>
                        <h3>{instructorTitle}</h3>
                        <p style={{ color: userData.instructorStatus === 'REJECTED' ? '#ef4444' : '#6B7280' }}>{instructorSub}</p>
                        <ChevronRight className="arrow-icon" size={16} />
                    </div>
                </section>

                {/* NEW: Top Instructors Section with Modern Design */}
                <div className="section-header-row">
                    <h2 className="section-title">Top Instructors</h2>
                    <button className="btn-text-purple" onClick={() => navigate('/instructors')}>View All Instructors →</button>
                </div>
                <section className="modern-instructors-grid" style={{ marginBottom: '32px' }}>
                    {topInstructors.length > 0 ? topInstructors.slice(0, 3).map((instructor, index) => {
                        const color = cardColors[index % cardColors.length];
                        const isThisInstructorRequested = userData.requestedInstructorId === instructor.id;
                        const isAnyRequestActive = userData.instructorStatus === 'PENDING' || userData.instructorStatus === 'APPROVED';

                        return (
                            <div key={instructor.id} className="modern-instructor-card">
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
                                    disabled={isRequesting || isAnyRequestActive}
                                    onClick={() => handleInstructorRequest(instructor.id)}
                                >
                                    {isThisInstructorRequested ? <><CheckCircle2 size={16} /> Requested</> : 'Request Mentor'}
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
                        <div className="stat-icon-wrapper purple"><Target size={20} /></div>
                        <div className="stat-info">
                            <span className="stat-label">CURRENT PATH</span>
                            <span className="stat-value" style={{ fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '140px' }}>
                                {userData.currentPath}
                            </span>
                        </div>
                    </div>
                    <div className="progress-stat-card">
                        <div className="stat-icon-wrapper orange"><BrainCircuit size={20} /></div>
                        <div className="stat-info">
                            <span className="stat-label">QUIZZES DONE</span>
                            <span className="stat-value highlight-orange">{userData.quizzesCompleted}</span>
                        </div>
                    </div>
                    <div className="progress-stat-card">
                        <div className="stat-icon-wrapper green"><Award size={20} /></div>
                        <div className="stat-info">
                            <span className="stat-label">BEST SCORE</span>
                            <span className="stat-value highlight-green">{userData.bestScore}%</span>
                        </div>
                    </div>
                    <div className="progress-stat-card">
                        <div className="stat-icon-wrapper blue"><BookOpen size={20} /></div>
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
            </main>
        </div>
    );
};

export default StudentHomePage;