import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, MessageSquare, User, LogOut, CheckCircle2, ChevronDown, ChevronUp, MapPin, Clock, AlertTriangle, ArrowLeft, PlayCircle, Circle, FileText } from 'lucide-react';
import logo from '../assets/light-logo.png';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

import { getUserRoadmaps, getStudentProgress } from '../api/roadmapService';
import {
    getInstructorStudents,
    getStudentNotes
} from '../api/instructorDashboardService';

import './InstructorDashboard.css';
import './StudentDetails.css';

dayjs.extend(relativeTime);

const StudentDetails = () => {
    const { id: studentId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();

    const [assignmentId, setAssignmentId] = useState(location.state?.assignmentId || null);

    const [isLoading, setIsLoading] = useState(true);
    const [studentInfo, setStudentInfo] = useState(null);
    const [phases, setPhases] = useState([]);
    const [notes, setNotes] = useState([]);

    const [accurateSummary, setAccurateSummary] = useState({ total: 0, done: 0, left: 0, percent: 0 });
    const [expandedPhases, setExpandedPhases] = useState({});

    const instructorName = localStorage.getItem('userName') || 'Instructor';

    useEffect(() => {
        const fetchAllDetails = async () => {
            try {
                const instructorId = localStorage.getItem('instructorId');

                // 1. Fetch Student/Assignment Details
                const assignments = await getInstructorStudents(instructorId);
                const currentAssignment = assignments.find(a =>
                    String(a.student.id) === String(studentId) || String(a.id) === String(assignmentId)
                );

                if (!currentAssignment) throw new Error("Student not found in your roster.");

                setStudentInfo(currentAssignment.student);
                setAssignmentId(currentAssignment.id);

                // 2. Fetch all roadmaps for this student to get the master blueprint
                const roadmaps = await getUserRoadmaps(currentAssignment.student.id).catch(() => []);
                if (!roadmaps || roadmaps.length === 0) {
                    setIsLoading(false);
                    return;
                }

                // Get the newest roadmap
                const activeRoadmap = roadmaps[roadmaps.length - 1];

                // 3. Parse the Master Roadmap Structure
                let roadmapObj = activeRoadmap.roadmapContent;
                if (typeof roadmapObj === 'string') roadmapObj = JSON.parse(roadmapObj);
                if (typeof roadmapObj === 'string') roadmapObj = JSON.parse(roadmapObj);

                const structurePhases = roadmapObj?.phases || [];

                // 4. Fetch the student's progress and notes
                const [detailedData, notesData] = await Promise.all([
                    getStudentProgress(currentAssignment.student.id, activeRoadmap.id).catch(() => []),
                    getStudentNotes(currentAssignment.id).catch(() => [])
                ]);

                setNotes(notesData);

                // 5. MERGE PROGRESS INTO THE BLUEPRINT
                let totalStepsCount = 0;
                let totalDoneCount = 0;
                let firstInProgressIndex = 0;

                const fullPhases = structurePhases.map((phase, pIndex) => {
                    let phaseDoneCount = 0;

                    const mappedSteps = (phase.steps || []).map(step => {
                        const stepTitle = typeof step === 'string' ? step : (step.title || step.stepTitle || "Unnamed Step");
                        totalStepsCount++;

                        const progressRecord = detailedData.find(p => p.stepTitle === stepTitle);
                        const status = progressRecord ? progressRecord.status : 'NOT_STARTED';

                        if (status === 'COMPLETED') {
                            phaseDoneCount++;
                            totalDoneCount++;
                        }

                        return {
                            stepTitle: stepTitle,
                            status: status,
                            createdAt: progressRecord ? progressRecord.createdAt : null,
                        };
                    });

                    // Figure out the status of the entire phase
                    let phaseStatus = 'NOT STARTED';
                    if (phaseDoneCount === mappedSteps.length && mappedSteps.length > 0) {
                        phaseStatus = 'COMPLETED';
                    } else if (phaseDoneCount > 0 || mappedSteps.some(s => s.status === 'IN_PROGRESS')) {
                        phaseStatus = 'IN PROGRESS';
                        firstInProgressIndex = pIndex;
                    } else if (pIndex === 0 && phaseDoneCount === 0) {
                        // If it's the very first phase and nothing is done, keep it open anyway
                        firstInProgressIndex = pIndex;
                    }

                    return {
                        title: phase.title || phase.phaseTitle || "Unnamed Phase",
                        steps: mappedSteps,
                        totalCount: mappedSteps.length,
                        completedCount: phaseDoneCount,
                        status: phaseStatus
                    };
                });

                // 6. Calculate bulletproof math
                const leftCount = totalStepsCount - totalDoneCount;
                const percent = totalStepsCount === 0 ? 0 : Math.round((totalDoneCount / totalStepsCount) * 100);

                setAccurateSummary({
                    total: totalStepsCount,
                    done: totalDoneCount,
                    left: leftCount,
                    percent: percent
                });

                setPhases(fullPhases);

                // Automatically open the active or next phase
                if (totalDoneCount === totalStepsCount && fullPhases.length > 0) {
                    setExpandedPhases({ [fullPhases.length - 1]: true });
                } else {
                    const activeIndexToOpen = fullPhases.findIndex(p => p.status === 'IN PROGRESS' || p.status === 'NOT STARTED');
                    setExpandedPhases({ [activeIndexToOpen !== -1 ? activeIndexToOpen : firstInProgressIndex]: true });
                }

            } catch (error) {
                console.error("Error loading student details:", error);
            } finally {
                setIsLoading(false);
            }
        };

        if (studentId) fetchAllDetails();
    }, [studentId, assignmentId]);

    const togglePhase = (index) => {
        setExpandedPhases(prev => ({ ...prev, [index]: !prev[index] }));
    };

    const getInitials = (name) => {
        if (!name) return "ST";
        return name.split(' ').map(n => n).join('').substring(0, 2).toUpperCase();
    };

    // --- Active / Next Step Logic for Insights ---
    const allSteps = phases.flatMap(p => p.steps);
    let activeStep = allSteps.find(s => s.status === 'IN_PROGRESS');
    let isNextUp = false;

    // Smart Fallback: If no step is literally IN_PROGRESS, find the very next unstarted step!
    if (!activeStep) {
        activeStep = allSteps.find(s => s.status === 'NOT_STARTED');
        if (activeStep) isNextUp = true;
    }

    const getDaysInactive = () => {
        if (!studentInfo?.lastActivityAt) return 0;
        const diff = new Date() - new Date(studentInfo.lastActivityAt);
        return Math.floor(diff / (1000 * 60 * 60 * 24));
    };

    const getDaysInActiveStep = () => {
        if (!activeStep?.createdAt) return 0;
        const diff = new Date() - new Date(activeStep.createdAt);
        return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
    };

    const daysInactive = getDaysInactive();

    // Badge styling mapping
    const getNoteStyles = (type) => {
        switch (type) {
            case 'QUIZ_FEEDBACK': return { border: '#EAB308', badgeBg: '#FEF9C3', badgeText: '#A16207', label: 'QUIZ' };
            case 'PROGRESS': return { border: '#0EA5E9', badgeBg: '#E0F2FE', badgeText: '#0369A1', label: 'PROGRESS' };
            default: return { border: '#A855F7', badgeBg: '#F3E8FF', badgeText: '#6B21A8', label: 'GENERAL' };
        }
    };

    const getPhaseColors = (status) => {
        switch (status) {
            case 'COMPLETED': return { border: '#06B6D4', bg: '#E0F2FE', text: '#0284C7', badgeBg: '#D1FAE5', badgeText: '#065F46' };
            case 'IN PROGRESS': return { border: '#7C3AED', bg: '#F5F3FF', text: '#6D28D9', badgeBg: '#F3E8FF', badgeText: '#6B21A8' };
            default: return { border: '#CBD5E1', bg: '#F1F5F9', text: '#64748B', badgeBg: '#F1F5F9', badgeText: '#475569' };
        }
    };

    if (isLoading) {
        return <div className="inst-dashboard-container" style={{ alignItems: 'center', justifyContent: 'center' }}><div className="inst-loading">Loading Student Details...</div></div>;
    }

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
                    <button className="active" onClick={() => navigate('/my-students')}><Users size={18} /> My Students</button>
                    <button onClick={() => navigate('/messages')}><MessageSquare size={18} /> Send Message</button>
                    <button onClick={() => navigate('/profile')}><User size={18} /> Profile</button>
                </nav>
                <button className="inst-logout-btn" onClick={() => { localStorage.clear(); navigate('/'); }}>
                    <LogOut size={18} /> Sign out
                </button>
            </aside>

            <main className="inst-main">
                <div className="sd-container">

                    <button onClick={() => navigate('/my-students')} style={{ background: 'none', border: 'none', color: '#64748B', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: '700', marginBottom: '24px', padding: 0 }}>
                        <ArrowLeft size={16} /> Back to My Students
                    </button>

                    {/* TOP HEADER CARD */}
                    <div className="sd-header-card">
                        <div className="sd-header-top">
                            <div className="sd-student-info">
                                <div className="sd-avatar">{getInitials(studentInfo?.fullName)}</div>
                                <div>
                                    <h1 className="sd-name">{studentInfo?.fullName || "Student"}</h1>
                                    <p className="sd-track">
                                        {studentInfo?.major || "General Track"} <span style={{ margin: '0 8px' }}>•</span>
                                        Last active {studentInfo?.lastActivityAt ? dayjs(studentInfo.lastActivityAt).fromNow() : 'Unknown'}
                                    </p>
                                </div>
                            </div>

                            <div className="sd-progress-section">
                                <div className="sd-progress-text">
                                    <span className="sd-progress-label">OVERALL PROGRESS</span>
                                    <span className="sd-progress-percent">{accurateSummary.percent}%</span>
                                </div>
                                <div className="sd-progress-bar-bg">
                                    <div className="sd-progress-bar-fill" style={{ width: `${accurateSummary.percent}%` }}></div>
                                </div>
                                <p className="sd-progress-steps-text">
                                    {accurateSummary.done} of {accurateSummary.total} steps complete
                                </p>
                            </div>

                            <div className="sd-stats-squares">
                                <div className="sd-square done">
                                    <h3>{accurateSummary.done}</h3>
                                    <span>DONE</span>
                                </div>
                                {/* ACTIVE SQUARE REMOVED AS REQUESTED */}
                                <div className="sd-square left">
                                    <h3>{accurateSummary.left}</h3>
                                    <span>LEFT</span>
                                </div>
                            </div>
                        </div>

                        {/* INSIGHTS ROW */}
                        <div className="sd-insights-row">
                            <span style={{ fontSize: '11px', fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', marginRight: '8px' }}>INSIGHTS</span>

                            {activeStep && (
                                <>
                                    <div className="sd-insight-pill current">
                                        <MapPin size={14} /> {isNextUp ? 'Next up:' : 'Current step:'} {activeStep.stepTitle}
                                    </div>
                                    {!isNextUp && activeStep.createdAt && (
                                        <div className="sd-insight-pill time">
                                            <Clock size={14} /> "{activeStep.stepTitle}" in progress for {getDaysInActiveStep()}d
                                        </div>
                                    )}
                                </>
                            )}

                            {daysInactive > 2 && (
                                <div className="sd-insight-pill warning">
                                    <AlertTriangle size={14} /> No activity in {daysInactive} days
                                </div>
                            )}

                            {!activeStep && accurateSummary.left === 0 && (
                                <div className="sd-insight-pill" style={{ background: '#D1FAE5', color: '#065F46' }}>
                                    <CheckCircle2 size={14} /> Student has completed the entire roadmap!
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="sd-main-grid">

                        {/* LEFT COLUMN: ROADMAP PHASES */}
                        <div>
                            <div className="sd-section-title">
                                <CheckCircle2 size={18} color="#7C3AED" /> ROADMAP PHASES
                            </div>

                            {phases.length === 0 ? (
                                <p style={{ color: '#64748B', fontSize: '14px', marginTop: '20px' }}>No detailed roadmap data available yet.</p>
                            ) : (
                                phases.map((phase, index) => {
                                    const colors = getPhaseColors(phase.status);
                                    const isOpen = expandedPhases[index];

                                    return (
                                        <div key={index} className="sd-phase-card" style={{ borderLeft: `4px solid ${colors.border}` }}>
                                            <div className="sd-phase-header" onClick={() => togglePhase(index)}>
                                                <div className="sd-phase-info">
                                                    <div className="sd-phase-number" style={{ background: colors.bg, color: colors.text }}>{index + 1}</div>
                                                    <div>
                                                        <div className="sd-phase-title-row">
                                                            <h4>{phase.title}</h4>
                                                            <span className="sd-phase-badge" style={{ background: colors.badgeBg, color: colors.badgeText }}>{phase.status}</span>
                                                        </div>
                                                        <p className="sd-phase-subtitle">{phase.completedCount} / {phase.totalCount} completed</p>
                                                    </div>
                                                </div>
                                                {isOpen ? <ChevronUp size={18} color="#94A3B8" /> : <ChevronDown size={18} color="#94A3B8" />}
                                            </div>

                                            {isOpen && (
                                                <div>
                                                    {phase.steps.map((step, sIdx) => (
                                                        <div
                                                            key={sIdx}
                                                            className={`sd-step-row ${step.status === 'COMPLETED' ? 'completed' : step.status === 'IN_PROGRESS' ? 'active-step' : 'not-started'}`}
                                                            style={{ textDecoration: 'none' }}
                                                        >
                                                            <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                                {step.status === 'COMPLETED' ? <CheckCircle2 size={16} color="#10B981" /> :
                                                                    step.status === 'IN_PROGRESS' ? <PlayCircle size={16} color="#0284C7" /> :
                                                                        <CheckCircle2 size={16} color="#CBD5E1" />}

                                                                {step.stepTitle}

                                                                {/* Only show the tiny green ACTIVE badge if it's currently being worked on */}
                                                                {step.status === 'IN_PROGRESS' && !isNextUp && (
                                                                    <span style={{ fontSize: '9px', background: '#D1FAE5', color: '#065F46', padding: '2px 6px', borderRadius: '4px', fontWeight: '800' }}>ACTIVE</span>
                                                                )}
                                                            </span>
                                                            <span>{step.createdAt ? dayjs(step.createdAt).fromNow() : ''}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* RIGHT COLUMN: NOTES HISTORY */}
                        <div className="sd-notes-container">
                            <div className="sd-section-title" style={{ justifyContent: 'space-between', borderBottom: '1px solid #F1F5F9', paddingBottom: '16px', marginBottom: '20px' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <FileText size={18} color="#F59E0B" /> NOTES HISTORY
                                </span>
                                <span style={{ width: '22px', height: '22px', background: '#F1F5F9', color: '#64748B', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '800' }}>
                                    {notes.length}
                                </span>
                            </div>

                            <div>
                                {notes.length === 0 ? (
                                    <p style={{ color: '#94A3B8', fontSize: '13px', textAlign: 'center', padding: '20px 0' }}>No performance notes sent yet.</p>
                                ) : (
                                    notes.map(note => {
                                        const styles = getNoteStyles(note.type);
                                        return (
                                            <div key={note.id} className="sd-note-card" style={{ borderLeft: `4px solid ${styles.border}` }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                    <h4 style={{ fontSize: '14px', fontWeight: '800', color: '#0F172A', margin: 0 }}>{note.stepProgress?.stepTitle || 'General Feedback'}</h4>
                                                    <span style={{ background: styles.badgeBg, color: styles.badgeText, fontSize: '9px', fontWeight: '800', padding: '3px 6px', borderRadius: '4px', textTransform: 'uppercase' }}>{styles.label}</span>
                                                </div>
                                                <p>{note.noteText}</p>
                                                <div className="sd-note-time">
                                                    <Clock size={12} /> {dayjs(note.createdAt).fromNow()}
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>

                    </div>
                </div>
            </main>
        </div>
    );
};

export default StudentDetails;