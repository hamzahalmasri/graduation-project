import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Map, Target, Clock, ChevronRight, PlusCircle, Calendar, AlertCircle, Sparkles, Trash2, ArrowLeft, BookOpen, Brain, Palette, Bot, Settings } from 'lucide-react';
import { getUserRoadmaps, deleteRoadmap, setLastOpenedRoadmap } from '../api/roadmapService';
import logo from '../assets/logo.png';
import './RoadmapsList.css';

const RoadmapsList = () => {
    const navigate = useNavigate();
    const [roadmaps, setRoadmaps] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchRoadmaps = async () => {
            const studentId = localStorage.getItem('studentId');

            if (!studentId) {
                setError("Please log in to view your roadmaps.");
                setIsLoading(false);
                return;
            }

            try {
                const data = await getUserRoadmaps(studentId);
                setRoadmaps(data || []);
            } catch (err) {
                console.error("Error fetching roadmaps:", err);
                setError("Failed to load your roadmaps. Please try again later.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchRoadmaps();
    }, []);

    const handleDeleteRoadmap = async (e, id) => {
        e.stopPropagation();
        if (window.confirm("Delete this roadmap permanently?")) {
            try {
                await deleteRoadmap(id);
                setRoadmaps(prevRoadmaps => prevRoadmaps.filter(r => r.id !== id));
            } catch (err) {
                alert("Failed to delete.", err);
            }
        }
    };

    const handleOpenRoadmap = async (roadmapId) => {
        const studentId = localStorage.getItem('studentId');
        try {
            // Tell backend this is now the active roadmap!
            await setLastOpenedRoadmap(roadmapId, studentId);
        } catch (err) {
            console.error("Failed to update last opened status", err);
        }
        // Navigate to the roadmap
        navigate(`/roadmap/${roadmapId}`);
    };

    const formatDate = (dateString) => {
        if (!dateString) return "Recently Created";
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };

    // Arrays to dynamically style the cards to match the design image
    const cardColors = ['#06B6D4', '#A855F7', '#F97316'];
    const cardIcons = [
        <Palette size={24} color="#06B6D4" />,
        <Bot size={24} color="#A855F7" />,
        <Settings size={24} color="#F97316" />
    ];
    const cardIconBgs = ['#ECFEFF', '#F3E8FF', '#FFF7ED'];

    if (isLoading) {
        return (
            <div className="rl-wrapper center-flex">
                <div className="rl-loading-spinner"></div>
                <h2 className="rl-loading-text">Loading your learning paths...</h2>
            </div>
        );
    }

    return (
        <div className="rl-wrapper">
            {/* Top Navigation */}
            <nav className="rl-nav">
                <div className="rl-nav-left">
                    <img src={logo} alt="EduGuide Logo" className="rl-nav-logo" />
                </div>
                <div className="rl-nav-right">
                    <button className="rl-btn-back" onClick={() => navigate('/home')}>
                        <ArrowLeft size={16} /> Back to Home
                    </button>
                </div>
            </nav>

            <main className="rl-main-container">

                {/* Purple Hero Banner */}
                <header className="rl-hero-banner">
                    <div className="rl-hero-left">
                        <span className="rl-hero-badge">
                            <Map size={14} /> MY LEARNING PATHS
                        </span>
                        <h1 className="rl-hero-title">Your Roadmaps</h1>
                        <p className="rl-hero-subtitle">
                            AI-crafted learning paths built around your goals, pace, and schedule.
                        </p>
                    </div>

                    <div className="rl-hero-right">
                        <div className="rl-stat-box">
                            <span className="rl-stat-number">{roadmaps.length}</span>
                            <span className="rl-stat-label">Roadmaps</span>
                        </div>
                        <button className="rl-btn-new" onClick={() => navigate('/chat')}>
                            <PlusCircle size={18} /> New Roadmap
                        </button>
                    </div>
                </header>

                {error ? (
                    <div className="rl-error-container">
                        <AlertCircle size={40} color="#ef4444" />
                        <h2>Oops!</h2>
                        <p>{error}</p>
                    </div>
                ) : roadmaps.length === 0 ? (
                    <div className="rl-empty-state">
                        <div className="rl-empty-icon-wrap"><Map size={48} color="#7C3AED" /></div>
                        <h2>No Roadmaps Found</h2>
                        <p>You haven't generated any learning paths yet. Let the AI build a custom curriculum tailored exactly to your goals!</p>
                        <button className="rl-btn-new large" onClick={() => navigate('/chat')}>
                            <Sparkles size={20} /> Generate Your First Roadmap
                        </button>
                    </div>
                ) : (
                    <section className="rl-list-section">
                        <div className="rl-section-header">
                            <h2 className="rl-section-title">
                                <BookOpen size={20} color="#7C3AED" /> All Roadmaps
                                <span className="rl-count-badge">{roadmaps.length}</span>
                            </h2>
                        </div>

                        <div className="rl-grid">
                            {roadmaps.map((roadmap, index) => {
                                const colorTheme = cardColors[index % 3];
                                const IconComp = cardIcons[index % 3];
                                const iconBg = cardIconBgs[index % 3];

                                return (
                                    <div
                                        key={roadmap.id}
                                        className="rl-card"
                                        onClick={() => handleOpenRoadmap(roadmap.id)}
                                        style={{ borderTop: `4px solid ${colorTheme}` }}
                                    >
                                        <button
                                            className="rl-delete-btn"
                                            onClick={(e) => handleDeleteRoadmap(e, roadmap.id)}
                                            title="Delete Roadmap"
                                        >
                                            <Trash2 size={16} />
                                        </button>

                                        <div className="rl-card-header">
                                            <div className="rl-card-icon" style={{ backgroundColor: iconBg }}>
                                                {IconComp}
                                            </div>
                                            <div className="rl-card-titles">
                                                <h3>{roadmap.learningPath || "Custom Learning Path"}</h3>
                                                <div className="rl-date-row">
                                                    <Calendar size={13} />
                                                    {formatDate(roadmap.createdAt)}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="rl-card-details">
                                            <div className="rl-detail-item">
                                                <Target size={16} color="#A78BFA" />
                                                <span>Goal: {roadmap.mainGoal || "Skill Mastery"}</span>
                                            </div>
                                            <div className="rl-detail-item">
                                                <Clock size={16} color="#A78BFA" />
                                                <span>{roadmap.weeklyStudyTime || "Self-paced"} · {roadmap.roadmapLength || "Flexible"}</span>
                                            </div>
                                        </div>

                                        <div className="rl-card-footer">
                                            <span className="rl-view-text">View Full Syllabus</span>
                                            <div className="rl-chevron-wrap">
                                                <ChevronRight size={16} />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                )}
            </main>
        </div>
    );
};

export default RoadmapsList;