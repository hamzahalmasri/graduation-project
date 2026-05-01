import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Code, Users, Award } from 'lucide-react';
import { getAllInstructors, requestInstructor } from '../api/instructorService';
import { getStudentAssignment } from '../api/assignmentService';
import './StudentHomePage.css';
import './InstructorsList.css';

const cardColors = ['#0ea5e9', '#ea580c', '#22c55e', '#eab308', '#8b5cf6', '#3b82f6'];

const InstructorsList = () => {
    const navigate = useNavigate();
    const [instructors, setInstructors] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // FIX 2: Replaced the simple boolean with an object that tracks the actual assignment
    const [activeAssignment, setActiveAssignment] = useState(null);

    const [expandedSkills, setExpandedSkills] = useState({});
    const [activeCategory, setActiveCategory] = useState('All');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const studentId = localStorage.getItem('studentId');
                const [instData, assignmentData] = await Promise.all([
                    getAllInstructors(),
                    getStudentAssignment(studentId)
                ]);

                setInstructors(instData);

                // FIX 2: Store the entire active assignment so we know WHO was requested
                if (assignmentData && assignmentData.length > 0) {
                    const activeAssig = assignmentData.find(a => a.status === 'PENDING' || a.status === 'APPROVED');
                    if (activeAssig) {
                        setActiveAssignment(activeAssig);
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

    const toggleSkills = (e, instructorId) => {
        e.stopPropagation();
        setExpandedSkills(prev => ({
            ...prev,
            [instructorId]: !prev[instructorId]
        }));
    };

    const handleRequest = async (instructorId) => {
        if (activeAssignment) {
            alert("You already have a pending or active mentorship.");
            return;
        }

        try {
            const studentId = localStorage.getItem('studentId');
            await requestInstructor(studentId, instructorId);
            alert("Mentorship request sent successfully!");

            // Instantly update the UI to show the specific instructor as requested
            setActiveAssignment({
                instructor: { id: instructorId },
                status: 'PENDING'
            });
        } catch (e) {
            alert("Failed to send request. " + e.message);
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

    return (
        <div className="student-home-container" style={{ minHeight: '100vh', padding: '40px', backgroundColor: '#F8FAFC' }}>

            <button onClick={() => navigate('/home')} className="back-button-modern">
                <ArrowLeft size={18} /> Dashboard
            </button>

            <div className="mentors-header-section">
                <div className="mentors-header-text">
                    <span className="find-guide-badge">✨ FIND YOUR GUIDE</span>
                    <h1 className="hero-title" style={{ color: '#1E293B', fontSize: '42px', marginBottom: '16px' }}>Available Mentors</h1>
                    <p style={{ color: '#64748B', maxWidth: '600px', lineHeight: '1.6' }}>
                        Browse our community of experts ready to guide you through your roadmap. Find someone who matches your vibe and request mentorship!
                    </p>
                </div>

                {activeAssignment && (
                    <div className="status-floating-card">
                        <span className="status-label">STATUS</span>
                        <div className="status-active">
                            <CheckCircle2 size={18} /> {activeAssignment.status === 'APPROVED' ? 'Mentorship Active!' : 'Request Sent!'}
                        </div>
                        <span className="status-sub">{activeAssignment.status === 'APPROVED' ? 'Check your messages' : 'Waiting for response...'}</span>
                    </div>
                )}
            </div>

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
                <span style={{ fontWeight: 800, color: '#475569', fontSize: '14px', letterSpacing: '0.5px' }}>MORE GREAT MENTORS</span>
            </div>

            <div className="modern-instructors-grid">
                {filteredInstructors.map((instructor, index) => {
                    const color = cardColors[index % cardColors.length];

                    // FIX 2 LOGIC: Check if THIS specific card is the one the user requested
                    const isThisInstructorRequested = activeAssignment?.instructor?.id === instructor.id;
                    const isAnyRequestActive = activeAssignment !== null;

                    return (
                        <div key={instructor.id} className="modern-instructor-card">
                            <div className="card-top-border" style={{ backgroundColor: color }}></div>

                            <div className="card-header-row">
                                <div className="modern-avatar" style={{ backgroundColor: color }}>
                                    {getInitials(instructor.fullName)}
                                </div>
                            </div>

                            <h3 className="modern-instructor-name">{instructor.fullName}</h3>

                            {/* FIX 1: Display all expertise fields separated by commas */}
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

                            {/* FIX 2 UI: Only apply the 'requested' class if it matches this instructor */}
                            <button
                                className={`btn-request-modern ${isThisInstructorRequested ? 'requested' : ''}`}
                                disabled={isAnyRequestActive}
                                onClick={() => handleRequest(instructor.id)}
                            >
                                {isThisInstructorRequested ? <><CheckCircle2 size={16} /> Requested</> : 'Request Mentorship'}
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default InstructorsList;