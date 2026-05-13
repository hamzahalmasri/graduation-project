import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Code, Users, Award, MessageSquare, Trash2 } from 'lucide-react';
import { getAllInstructors } from '../api/instructorService';
import { getStudentAssignment, dropInstructor, requestInstructor } from '../api/assignmentService';
import './StudentHomePage.css';
import './InstructorsList.css';

const cardColors = ['#0ea5e9', '#ea580c', '#22c55e', '#eab308', '#8b5cf6', '#3b82f6'];

const InstructorsList = () => {
    const navigate = useNavigate();
    const [instructors, setInstructors] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const [activeAssignment, setActiveAssignment] = useState(null);
    const [expandedSkills, setExpandedSkills] = useState({});
    const [activeCategory, setActiveCategory] = useState('All');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const studentId = localStorage.getItem('studentId');
            const [instData, assignmentData] = await Promise.all([
                getAllInstructors(),
                getStudentAssignment(studentId)
            ]);

            setInstructors(instData);

            // ✅ THE FIX: Sort by ID to find the newest assignment, ignoring old ghost requests
            if (assignmentData && assignmentData.length > 0) {
                const sortedAssignments = assignmentData.sort((a, b) => b.id - a.id);
                const newestAssignment = sortedAssignments[0];

                // Only set active if the absolute NEWEST assignment is Pending or Approved
                if (newestAssignment.status === 'PENDING' || newestAssignment.status === 'APPROVED') {
                    setActiveAssignment(newestAssignment);
                } else {
                    setActiveAssignment(null);
                }
            } else {
                setActiveAssignment(null);
            }
        } catch (err) {
            console.error("Error loading instructors", err);
        } finally {
            setIsLoading(false);
        }
    };

    const toggleSkills = (e, instructorId) => {
        e.stopPropagation();
        setExpandedSkills(prev => ({
            ...prev,
            [instructorId]: !prev[instructorId]
        }));
    };

    const handleRequest = async (instructorId) => {
        if (activeAssignment) return;

        try {
            const studentId = localStorage.getItem('studentId');
            await requestInstructor(studentId, instructorId);
            alert("Mentorship request sent successfully!");
            fetchData(); // Refresh to get the actual assignment ID
        } catch (e) {
            alert("Failed to send request. " + e.message);
        }
    };

    // 🚨 NEW: Handle Dropping the Instructor
    const handleDrop = async (assignmentId) => {
        if (window.confirm("Are you sure you want to drop this instructor? You will lose access to the chat.")) {
            try {
                await dropInstructor(assignmentId);
                setActiveAssignment(null); // Instantly restore UI to normal state!
                alert("Instructor dropped successfully.");
            } catch (error) {
                alert("Failed to drop instructor. " + error.message);
            }
        }
    };

    const getInitials = (name) => {
        if (!name) return "IN";
        return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    };

    if (isLoading) {
        return <div className="loading-screen"><h2>Loading Instructors...</h2></div>;
    }

    const allExpertise = instructors.flatMap(inst => inst.expertiseFields || []);
    const dynamicCategories = ['All', ...new Set(allExpertise.map(field => field.replace('_', ' ')))];

    const filteredInstructors = activeCategory === 'All'
        ? instructors
        : instructors.filter(inst => inst.expertiseFields?.some(f => f.replace('_', ' ') === activeCategory));

    const hasInstructor = activeAssignment !== null;

    return (
        <div className="instructors-page-wrapper">

            <button onClick={() => navigate('/home')} className="back-button-modern">
                <ArrowLeft size={18} /> Dashboard
            </button>

            <div className="mentors-header-section">
                <div className="mentors-header-text">
                    <span className="find-guide-badge">✨ FIND YOUR GUIDE</span>
                    {/* 🚨 Dynamic Title based on state */}
                    <h1 className="hero-title" style={{ color: '#1E293B', fontSize: '42px', marginBottom: '16px' }}>
                        {hasInstructor ? 'Other Available Mentors' : 'Choose Your Mentor'}
                    </h1>
                    <p style={{ color: '#64748B', maxWidth: '600px', lineHeight: '1.6' }}>
                        Browse our community of experts ready to guide you through your roadmap. Find someone who matches your vibe and request mentorship!
                    </p>
                </div>

                {/* Show Pending Status if not approved yet */}
                {activeAssignment && activeAssignment.status === 'PENDING' && (
                    <div className="status-floating-card">
                        <span className="status-label">STATUS</span>
                        <div className="status-active" style={{ color: '#F59E0B' }}>
                            <CheckCircle2 size={18} /> Request Sent!
                        </div>
                        <span className="status-sub">Waiting for response...</span>
                    </div>
                )}
            </div>

            {/* 🚨 NEW: The "Your Instructor" Premium Card (Shows only when APPROVED) */}
            {activeAssignment && activeAssignment.status === 'APPROVED' && (
                <div style={{
                    background: 'linear-gradient(135deg, #F3E8FF 0%, #FFFFFF 100%)',
                    border: '1px solid #D8B4FE',
                    borderRadius: '20px',
                    padding: '24px',
                    marginBottom: '40px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    boxShadow: '0 4px 15px rgba(139, 92, 246, 0.1)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <div className="modern-avatar" style={{ backgroundColor: '#8B5CF6', width: '64px', height: '64px', fontSize: '24px' }}>
                            {getInitials(activeAssignment.instructor?.fullName)}
                        </div>
                        <div>
                            <span style={{ fontSize: '12px', fontWeight: '800', color: '#8B5CF6', letterSpacing: '1px', textTransform: 'uppercase' }}>YOUR INSTRUCTOR</span>
                            <h2 style={{ margin: '4px 0', fontSize: '24px', color: '#1E293B' }}>{activeAssignment.instructor?.fullName}</h2>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', color: '#10B981', fontWeight: '600' }}>
                                <CheckCircle2 size={16} /> Approved & Active
                            </div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button onClick={() => navigate('/instructor-chat')} style={{ padding: '12px 24px', borderRadius: '12px', background: '#8B5CF6', color: 'white', border: 'none', fontWeight: '600', cursor: 'pointer', display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <MessageSquare size={18} /> Chat
                        </button>
                        <button onClick={() => handleDrop(activeAssignment.id)} style={{ padding: '12px 24px', borderRadius: '12px', background: '#FEE2E2', color: '#EF4444', border: 'none', fontWeight: '700', cursor: 'pointer', display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <Trash2 size={18} /> Drop Instructor
                        </button>
                    </div>
                </div>
            )}

            <div className="categories-scroll-wrapper">
                {dynamicCategories.map(cat => (
                    <button
                        key={cat}
                        className={`category-pill ${activeCategory === cat ? 'active' : ''}`}
                        onClick={() => setActiveCategory(cat)}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            <div className="section-divider">
                <Users size={18} color="#8B5CF6" />
                <span style={{ fontWeight: 800, color: '#475569', fontSize: '14px', letterSpacing: '0.5px' }}>
                    {hasInstructor ? 'OTHER INSTRUCTORS' : 'ALL INSTRUCTORS'}
                </span>
            </div>

            <div className="modern-instructors-grid">
                {filteredInstructors.map((instructor, index) => {
                    const color = cardColors[index % cardColors.length];

                    const isThisInstructorRequested = activeAssignment?.instructor?.id === instructor.id;
                    // 🚨 Faded State Logic
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
                                disabled={hasInstructor}
                                onClick={() => handleRequest(instructor.id)}
                            >
                                {hasInstructor
                                    ? (isThisInstructorRequested
                                        ? <><CheckCircle2 size={16} /> {activeAssignment.status === 'APPROVED' ? 'Assigned' : 'Requested'}</>
                                        : 'You already have a mentor')
                                    : 'Request Mentorship'}
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default InstructorsList;