import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, MessageSquare, User, LogOut, BookOpen, Award, Target, BookMarked, Code, Sprout } from 'lucide-react';
import { getAllInstructors } from '../api/instructorService';
import logo from '../assets/light-logo.png';
import './InstructorDashboard.css';
import './InstructorProfile.css';

// Pre-defined pastel colors for the skills chips
const skillColors = [
    { bg: '#F3E8FF', text: '#7C3AED' }, // Purple
    { bg: '#EFF6FF', text: '#3B82F6' }, // Blue
    { bg: '#F1F5F9', text: '#475569' }, // Gray
    { bg: '#FEF2F2', text: '#EF4444' }, // Red
    { bg: '#ECFDF5', text: '#10B981' }  // Green
];

const InstructorProfile = () => {
    const navigate = useNavigate();
    const [instructor, setInstructor] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const instructorName = localStorage.getItem('userName') || 'Instructor';

    useEffect(() => {
        const loadProfileData = async () => {
            // 🚨 Strict Security Check from Backend Notes
            const role = localStorage.getItem('userRole');
            if (role !== 'instructor') {
                navigate('/');
                return;
            }

            try {
                const loggedInUserId = localStorage.getItem('instructorId') || localStorage.getItem('studentId');

                // Fetch all real database instructors
                const allInstructors = await getAllInstructors();

                // Find exactly who is logged in
                const myProfile = allInstructors.find(i => String(i.id) === String(loggedInUserId));

                if (myProfile) {
                    setInstructor(myProfile);
                } else {
                    console.error("Could not find instructor profile data.");
                }
            } catch (error) {
                console.error("Error fetching profile data:", error);
            } finally {
                setIsLoading(false);
            }
        };

        loadProfileData();
    }, [navigate]);

    const getInitials = (name) => {
        if (!name) return "IN";
        return name.split(' ').map(n => n).join('').substring(0, 2).toUpperCase();
    };

    // --- Dynamic UI Logic (As instructed by Backend Developer) ---
    // 🚨 We use optional chaining (?.) so React doesn't crash while the data is loading!

    // 1. Available Seats Math
    const MAX_STUDENTS = 10;
    const currentStudentsCount = instructor?.currentStudents || 0;
    const remainingSeats = Math.max(0, MAX_STUDENTS - currentStudentsCount);
    const progressPercentage = Math.round((currentStudentsCount / MAX_STUDENTS) * 100);

    // 2. Generate Dynamic Focus Areas
    const focusAreas = [];
    const lowerSkills = (instructor?.skills || []).map(s => s.toLowerCase());
    const expertFields = instructor?.expertiseFields || [];

    if (lowerSkills.some(s => s.includes('react') || s.includes('vue') || s.includes('angular'))) {
        focusAreas.push({ title: "Frontend Architecture", icon: <Code size={18} color="#8B5CF6" /> });
    }
    if (lowerSkills.some(s => s.includes('node') || s.includes('java') || s.includes('python'))) {
        focusAreas.push({ title: "Backend Systems", icon: <Code size={18} color="#3B82F6" /> });
    }
    if (expertFields.includes('FRONTEND')) {
        focusAreas.push({ title: "React Ecosystem", icon: <BookOpen size={18} color="#10B981" /> });
    }
    if (expertFields.includes('BACKEND')) {
        focusAreas.push({ title: "API Development", icon: <BookOpen size={18} color="#F59E0B" /> });
    }
    // Fallback if none matched
    if (focusAreas.length === 0) {
        focusAreas.push(
            { title: "Career Mentoring", icon: <Target size={18} color="#8B5CF6" /> },
            { title: "Technical Architecture", icon: <Code size={18} color="#3B82F6" /> }
        );
    }

    // Determine Main Title (e.g., "Frontend Mentor")
    // ✅ Safely checking so charAt doesn't crash
    const mainTitle = expertFields && expertFields.length > 0 && typeof expertFields === 'string'
        ? `${expertFields.charAt(0) + expertFields.slice(1).toLowerCase()} Mentor`
        : "Technical Mentor";

    return (
        <div className="inst-dashboard-container">
            {/* EXACT MATCH SIDEBAR - Always visible! */}
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
                    <button onClick={() => navigate('/my-students')}><Users size={18} /> My Students</button>
                    <button onClick={() => navigate('/messages')}><MessageSquare size={18} /> Send Message</button>
                    <button className="active"><User size={18} /> Profile</button>
                </nav>

                <button className="inst-logout-btn" onClick={() => { localStorage.clear(); navigate('/'); }}>
                    <LogOut size={18} /> Sign out
                </button>
            </aside>

            {/* MAIN PROFILE CONTENT */}
            <main className="inst-main">
                {/* 🚨 Loading screen is now protected inside the main content area */}
                {isLoading || !instructor ? (
                    <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
                        <div className="inst-loading">Loading Profile Data...</div>
                    </div>
                ) : (
                    <div className="profile-inner-content">

                        {/* Top Header Card */}
                        <div className="profile-header-card">
                            <div className="profile-avatar-large">
                                {getInitials(instructor.fullName)}
                            </div>
                            <div className="profile-header-info">
                                <h1>{instructor.fullName}</h1>
                                <p>{mainTitle}</p>
                            </div>
                        </div>

                        <div className="profile-grid">

                            {/* LEFT COLUMN */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                                {/* Bio Section */}
                                <div className="prof-card">
                                    <h3 className="prof-card-title"><BookOpen size={20} /> Bio</h3>
                                    <p className="prof-bio-text">
                                        {instructor.bio || "This instructor hasn't added a bio yet."}
                                    </p>
                                    {/* Static Quote Section */}
                                    <div className="prof-quote-box">
                                        "Helping students transition from learning to real-world development."
                                    </div>
                                </div>

                                {/* Skills Section */}
                                <div className="prof-card">
                                    <h3 className="prof-card-title"><Award size={20} /> Skills</h3>
                                    <div className="prof-skills-wrapper">
                                        {instructor.skills && instructor.skills.length > 0 ? (
                                            instructor.skills.map((skill, index) => {
                                                const color = skillColors[index % skillColors.length];
                                                return (
                                                    <span
                                                        key={index}
                                                        className="prof-skill-tag"
                                                        style={{ backgroundColor: color.bg, color: color.text }}
                                                    >
                                                        {skill}
                                                    </span>
                                                );
                                            })
                                        ) : (
                                            <p style={{ color: '#94A3B8', fontSize: '14px' }}>No skills listed.</p>
                                        )}
                                    </div>
                                </div>

                                {/* Focus Areas Section (Dynamically Generated UI) */}
                                <div className="prof-card">
                                    <h3 className="prof-card-title"><Target size={20} /> Focus Areas</h3>
                                    <div className="prof-skills-wrapper">
                                        {focusAreas.map((area, idx) => (
                                            <div key={idx} className="prof-focus-card">
                                                {area.icon}
                                                {area.title}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                            </div>

                            {/* RIGHT COLUMN */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                                {/* Seats Progress Card */}
                                <div className="prof-card prof-seats-container">
                                    <div
                                        className="prof-circular-progress"
                                        style={{ background: `conic-gradient(#8B5CF6 ${progressPercentage}%, #F1F5F9 0)` }}
                                    >
                                        <div className="prof-inner-circle">
                                            <h3>{currentStudentsCount}/{MAX_STUDENTS}</h3>
                                            <span>Active Mentees</span>
                                        </div>
                                    </div>

                                    {remainingSeats > 0 ? (
                                        <>
                                            <div className="prof-status-badge">
                                                <div style={{ width: '6px', height: '6px', background: '#10B981', borderRadius: '50%' }}></div>
                                                AVAILABLE FOR MENTORING
                                            </div>
                                            <p style={{ color: '#64748B', fontSize: '13px', margin: 0, fontWeight: 500 }}>
                                                {remainingSeats} seats remaining
                                            </p>
                                        </>
                                    ) : (
                                        <>
                                            <div className="prof-status-badge full">
                                                <div style={{ width: '6px', height: '6px', background: '#EF4444', borderRadius: '50%' }}></div>
                                                MENTOR FULL
                                            </div>
                                            <p style={{ color: '#64748B', fontSize: '13px', margin: 0, fontWeight: 500 }}>
                                                No seats remaining
                                            </p>
                                        </>
                                    )}
                                </div>

                                {/* Stats Row */}
                                <div className="prof-stats-grid">
                                    <div className="prof-stat-box">
                                        <Users size={20} className="prof-stat-icon" />
                                        <div style={{ marginTop: 'auto' }}>
                                            <div className="prof-stat-value">{currentStudentsCount}</div>
                                            <div className="prof-stat-label">Students</div>
                                        </div>
                                    </div>
                                    <div className="prof-stat-box">
                                        <Award size={20} className="prof-stat-icon" style={{ color: '#EC4899' }} />
                                        <div style={{ marginTop: 'auto' }}>
                                            <div className="prof-stat-value">{instructor.yearsOfExperience || 0}+</div>
                                            <div className="prof-stat-label">Years Exp.</div>
                                        </div>
                                    </div>
                                </div>


                            </div>
                        </div>

                    </div>
                )}
            </main>
        </div>
    );
};

export default InstructorProfile;