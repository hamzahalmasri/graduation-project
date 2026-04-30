import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Circle, Play, BookOpen, LayoutDashboard, Flame } from 'lucide-react';
import { getRoadmapById, setLastOpenedRoadmap, markStepProgress, getStudentProgress } from '../api/roadmapService';
import './RoadmapDetail.css';

const RoadmapDetail = () => {
    const { roadmapId } = useParams();
    const navigate = useNavigate();

    const [roadmap, setRoadmap] = useState(null);
    const [parsedContent, setParsedContent] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Tracks which steps are checked: stores strings like "Phase 1|Step 1"
    const [completedSteps, setCompletedSteps] = useState(new Set());

    useEffect(() => {
        const fetchDetail = async () => {
            try {
                // 1. Fetch the Roadmap Details
                const data = await getRoadmapById(roadmapId);
                setRoadmap(data);

                // Parse the JSON string from the database
                parseRoadmapContent(data.roadmapContent);

                const studentId = localStorage.getItem('studentId');
                if (studentId) {
                    // 2. Update "Last Opened" silently
                    setLastOpenedRoadmap(roadmapId, studentId).catch(err => console.error("Failed to set last opened", err));

                    // 3. FETCH PREVIOUS PROGRESS (This replaces your TODO!)
                    try {
                        const progressData = await getStudentProgress(studentId, roadmapId);

                        // Map the backend array into our React Set format ("Phase 1|Step 1")
                        const loadedProgress = new Set();
                        progressData.forEach(progressItem => {
                            loadedProgress.add(`${progressItem.phaseTitle}|${progressItem.stepTitle}`);
                        });

                        // Set it to state so the checkmarks light up instantly!
                        setCompletedSteps(loadedProgress);
                    } catch (progressErr) {
                        console.error("Failed to load saved progress", progressErr);
                    }
                }

            } catch (err) {
                console.error("Error fetching roadmap detail:", err);
                setError("Failed to load your syllabus. Please try again.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchDetail();
    }, [roadmapId]);


    const parseRoadmapContent = (contentString) => {
        try {
            const parsed = typeof contentString === 'string' ? JSON.parse(contentString) : contentString;
            setParsedContent(parsed);
            setError(null);
        } catch (e) {
            setParsedContent({
                phases: [{ title: "AI Generated Notes", steps: [{ title: contentString }], e }]
            });
        }
    };

    // Handle Checkbox Clicks
    const handleToggleStep = async (phaseTitle, stepTitle) => {
        const stepKey = `${phaseTitle}|${stepTitle}`;
        const studentId = localStorage.getItem('studentId');

        // Optimistically update the UI immediately
        setCompletedSteps(prev => {
            const newSet = new Set(prev);
            if (newSet.has(stepKey)) newSet.delete(stepKey);
            else newSet.add(stepKey);
            return newSet;
        });

        // Send the progress to the backend quietly in the background
        if (studentId) {
            try {
                await markStepProgress(studentId, roadmapId, phaseTitle, stepTitle);
            } catch (error) {
                console.error("Failed to save progress to database", error);
            }
        }
    };

    if (isLoading) {
        return (
            <div className="rd-wrapper center-flex">
                <div className="rd-loading-spinner"></div>
                <h2 className="rd-loading-text">Loading your syllabus...</h2>
            </div>
        );
    }

    // Dynamic Progress Calculations
    const totalSteps = parsedContent?.phases?.reduce((acc, phase) => acc + (phase.steps?.length || 0), 0) || 0;
    const progressPct = totalSteps === 0 ? 0 : Math.round((completedSteps.size / totalSteps) * 100);

    // Array of colors for Phase Cards
    const phaseColors = ['#06B6D4', '#F97316', '#8B5CF6', '#10B981', '#EC4899'];

    return (
        <div className="rd-wrapper">
            <div className="rd-ambient-glow rd-glow-purple"></div>
            <div className="rd-ambient-glow rd-glow-blue"></div>
            <div className="rd-ambient-glow rd-glow-pink"></div>

            {/* Top Nav */}
            <nav className="rd-top-nav">
                <button className="rd-btn-back" onClick={() => navigate('/roadmaps')}>
                    <ArrowLeft size={18} /> Back to Map
                </button>
            </nav>

            <main className="rd-main-container">

                {/* Header Progress Card */}
                <header className="rd-header-card">
                    <div className="rd-header-info">
                        <span className="rd-quest-badge">
                            <Flame size={14} color="#A855F7" /> CURRENT QUEST
                        </span>
                        <h1 className="rd-title">{roadmap?.learningPath || "Custom Syllabus"}</h1>
                        <p className="rd-goal">
                            <LayoutDashboard size={16} /> {roadmap?.mainGoal || parsedContent?.main_goal}
                        </p>
                    </div>

                    <div className="rd-progress-box">
                        <div className="rd-progress-header">
                            <span className="rd-progress-label">PROGRESS</span>
                            <span className="rd-progress-flame">🔥</span>
                        </div>
                        <div className="rd-progress-large-text">{progressPct}%</div>
                        <div className="rd-progress-subtext">{completedSteps.size} / {totalSteps} steps completed</div>
                        <div className="rd-progress-track">
                            <div className="rd-progress-fill" style={{ width: `${progressPct}%` }}></div>
                        </div>
                    </div>
                </header>

                {error ? (
                    <div className="rd-error-message">
                        <h2>{error}</h2>
                    </div>
                ) : (
                    <div className="rd-timeline-container">
                        {parsedContent?.phases?.map((phase, index) => {
                            const phaseTitle = phase.title || `Phase ${index + 1}`;
                            const phaseColor = phaseColors[index % phaseColors.length];

                            // Calculate completed steps just for this specific phase
                            const completedInPhase = phase.steps?.filter(s => {
                                const sTitle = typeof s === 'string' ? s : s.title;
                                return completedSteps.has(`${phaseTitle}|${sTitle}`);
                            }).length || 0;

                            const isPhaseComplete = completedInPhase === phase.steps?.length && phase.steps?.length > 0;

                            return (
                                <div key={index} className="rd-phase-row">

                                    {/* Left Side: Phase Card */}
                                    <div className="rd-phase-col">
                                        <div
                                            className={`rd-phase-card ${isPhaseComplete ? 'completed' : ''}`}
                                            style={{ '--phase-color': phaseColor }}
                                        >
                                            <div className="rd-phase-icon-wrap" style={{ color: phaseColor }}>
                                                {isPhaseComplete ? <CheckCircle2 size={24} /> : index + 1}
                                            </div>
                                            <h3 className="rd-phase-subtitle">Phase {index + 1}:</h3>
                                            <h2 className="rd-phase-title">{phaseTitle}</h2>
                                            <div className="rd-phase-stats">
                                                {completedInPhase} / {phase.steps?.length} complete
                                                {isPhaseComplete && <span className="rd-medal">🏆</span>}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right Side: Steps List */}
                                    <div className="rd-steps-col">
                                        {phase.steps?.map((step, stepIndex) => {
                                            const stepTitle = typeof step === 'string' ? step : step.title;
                                            const stepKey = `${phaseTitle}|${stepTitle}`;
                                            const isCompleted = completedSteps.has(stepKey);

                                            return (
                                                <div
                                                    key={stepIndex}
                                                    className={`rd-step-card ${isCompleted ? 'completed' : ''}`}
                                                    onClick={() => handleToggleStep(phaseTitle, stepTitle)}
                                                >
                                                    <div className="rd-step-check">
                                                        {isCompleted ? (
                                                            <CheckCircle2 size={28} className="rd-icon-checked" />
                                                        ) : (
                                                            <Circle size={28} className="rd-icon-unchecked" />
                                                        )}
                                                    </div>

                                                    <div className="rd-step-content">
                                                        <h4 className="rd-step-title">{stepTitle}</h4>

                                                        {/* Resources Area */}
                                                        <div className="rd-step-resources" onClick={(e) => e.stopPropagation()}>

                                                            {/* Article Badge */}
                                                            {step.article && step.article_url && (
                                                                <a
                                                                    href={step.article_url}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="rd-badge rd-badge-read"
                                                                >
                                                                    <BookOpen size={14} /> Read
                                                                </a>
                                                            )}

                                                            {/* Video Badge */}
                                                            {step.video && step.video.url && (
                                                                <a
                                                                    href={step.video.url}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="rd-badge rd-badge-watch"
                                                                >
                                                                    <Play size={14} fill="currentColor" /> Watch
                                                                </a>
                                                            )}

                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                </div>
                            );
                        })}
                    </div>
                )}
            </main>
        </div>
    );
};

export default RoadmapDetail;