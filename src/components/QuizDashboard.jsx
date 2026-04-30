import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, X, RotateCcw, Target, Award, Sparkles, BookOpen } from 'lucide-react';
import { fetchQuizCards, fetchRecommendedQuiz, fetchQuizAttempts } from '../api/quizService';
import aQuiz from '../assets/a-quiz.svg';
import fQuiz from '../assets/f-quiz.svg';
import logo from '../assets/logo.png';
import solQuiz from '../assets/green-solve-quiz.svg';
import './QuizDashboard.css';

const QuizDashboard = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // Grab the score if they just redirected from a finished quiz
    const recentScore = location.state?.recentScore;

    // Main Dashboard Data State
    const [quizzes, setQuizzes] = useState([]);
    const [recommended, setRecommended] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Filter States
    const [filterPath, setFilterPath] = useState('all paths');
    const [filterLevel, setFilterLevel] = useState('all levels');

    // Modal States
    const [showModal, setShowModal] = useState(false);
    const [modalAttempts, setModalAttempts] = useState([]);
    const [modalQuizTitle, setModalQuizTitle] = useState('');
    const [isModalLoading, setIsModalLoading] = useState(false);

    useEffect(() => {
        const loadDashboardData = async () => {
            try {
                setIsLoading(true);
                const realStudentId = localStorage.getItem('studentId');

                if (!realStudentId) {
                    setError("User session expired. Please log out and log back in.");
                    setIsLoading(false);
                    return;
                }

                // Pure API Logic - No hardcoded data
                const [cardsData, recommendedData] = await Promise.all([
                    fetchQuizCards(realStudentId).catch(() => []),
                    fetchRecommendedQuiz(realStudentId).catch(() => null)
                ]);

                setQuizzes(cardsData);
                setRecommended(recommendedData);
                setIsLoading(false);
            } catch (err) {
                setError(err.message || "An unexpected error occurred");
                setIsLoading(false);
            }
        };

        loadDashboardData();
    }, []);

    const handleViewResults = async (quiz) => {
        const studentId = localStorage.getItem('studentId');
        setModalQuizTitle(quiz.title);
        setShowModal(true);
        setIsModalLoading(true);

        try {
            const data = await fetchQuizAttempts(quiz.id, studentId);
            setModalAttempts(data || []);
        } catch (err) {
            console.error("Failed to load attempts", err);
            setModalAttempts([]);
        }

        setIsModalLoading(false);
    };

    // Derived Statistics
    const totalQuizzes = quizzes.length;
    const completedQuizzes = quizzes.filter(q => q.completed).length;
    const attemptedQuizzes = quizzes.filter(q => q.completed || q.attempts > 0);
    const avgScore = attemptedQuizzes.length > 0
        ? Math.round(attemptedQuizzes.reduce((acc, q) => acc + (q.bestScore || 0), 0) / attemptedQuizzes.length)
        : 0;

    const filteredQuizzes = quizzes.filter((q) => {
        const matchesPath = filterPath === 'all paths' || q.path?.toLowerCase() === filterPath.toLowerCase();
        const matchesLevel = filterLevel === 'all levels' || q.level?.toLowerCase() === filterLevel.toLowerCase();
        return matchesPath && matchesLevel;
    });

    const getTopBorderColor = (quiz) => {
        if (quiz.completed) return '#7C3AED'; // Purple for done
        if (quiz.level?.toLowerCase() === 'advanced') return '#EF4444'; // Red for advanced
        if (quiz.level?.toLowerCase() === 'intermediate') return '#F97316'; // Orange for intermediate
        return '#3B82F6'; // Blue for beginner
    };

    if (isLoading) return <div className="center-screen">Loading your quizzes...</div>;
    if (error) return <div className="center-screen error-text">{error}</div>;

    return (
        <div className="quiz-dashboard-wrapper">
            {/* Top Navigation */}
            <nav className="top-navbar">
                <div className="nav-left">
                    <div className="brand-logo">
                        <img src={logo} alt="Brand Logo" className="logo-image" />
                    </div>
                    <span className="nav-separator">|</span>
                    <span className="nav-page-title">Quiz Arena</span>

                </div>
                <button className="btn-nav-back" onClick={() => navigate('/home')}>
                    <ArrowLeft size={16} /> Back to Home
                </button>
            </nav>

            <div className="dashboard-container">
                {/* Hero Stats Banner */}
                <header className="hero-stats-banner">
                    <div className="hero-left">
                        <span className="hero-badge"><Sparkles size={14} /> TEST YOUR KNOWLEDGE</span>
                        <h1 className="hero-title">Quiz Arena</h1>

                        <p className="hero-subtitle">Challenge yourself, track your scores, and level up your skills one quiz at a time.</p>
                    </div>
                    <div className="hero-right">
                        <img src={solQuiz} alt="Quiz Mascot" className="hero-mascot" />
                        <div className="stat-box">
                            <span className="stat-number">{totalQuizzes}</span>
                            <span className="stat-label">Total Quizzes</span>
                        </div>
                        <div className="stat-box">
                            <span className="stat-number">{completedQuizzes}</span>
                            <span className="stat-label">Completed</span>
                        </div>
                        <div className="stat-box">
                            <span className="stat-number">{avgScore}%</span>
                            <span className="stat-label">Avg Score</span>
                        </div>
                    </div>
                </header>

                {/* Post-Quiz Character Feedback Banner */}
                {recentScore !== undefined && recentScore !== null && (
                    <div className="character-feedback-container">
                        <div className="speech-bubble">
                            {recentScore > 50 ? (
                                <p>Fantastic job! You're doing great,<br />keep up the good work! 🌟</p>
                            ) : (
                                <p>Don't give up! Work a little more<br />to get a better mark. 🛠️</p>
                            )}
                        </div>

                        {/* Interactive Mascot SVG */}
                        <img
                            src={recentScore > 50 ? aQuiz : fQuiz}
                            alt="Feedback Mascot"
                            className="feedback-mascot"
                        />
                    </div>
                )}

                {/* Pill Filters */}
                <div className="filter-row">
                    <div className="filter-group">
                        <span className="filter-title"><BookOpen size={14} /> PATH</span>
                        {['All Paths', 'Frontend', 'Backend', 'Fullstack'].map(path => (
                            <button
                                key={path}
                                className={`filter-pill ${filterPath === path.toLowerCase() ? 'active' : ''}`}
                                onClick={() => setFilterPath(path.toLowerCase())}
                            >
                                {path}
                            </button>
                        ))}
                    </div>
                    <div className="filter-group">
                        <span className="filter-title"><Award size={14} /> LEVEL</span>
                        {['All Levels', 'Beginner', 'Intermediate', 'Advanced'].map(level => (
                            <button
                                key={level}
                                className={`filter-pill ${filterLevel === level.toLowerCase() ? 'active' : ''}`}
                                onClick={() => setFilterLevel(level.toLowerCase())}
                            >
                                {level}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Recommended Section */}
                {recommended && (
                    <section className="recommended-section">
                        <h2 className="section-title"><Award size={20} color="#FBBF24" /> Recommended for You</h2>
                        <div className="recommended-card">
                            <div className="rec-content">
                                <span className="rec-badge">✨ PICKED FOR YOU</span>
                                <h3 className="rec-title">{recommended.title}</h3>
                                <p className="rec-desc">{recommended.description}</p>
                                <div className="rec-tags">
                                    <span className="tag">{recommended.path}</span>
                                    <span className="tag">{recommended.level}</span>
                                </div>
                                <div className="rec-progress-wrapper">
                                    <div className="progress-header">
                                        <span>Progress</span>
                                        <span className="progress-percent">{recommended.progress || 0}%</span>
                                    </div>
                                    <div className="progress-track">
                                        <div className="progress-fill" style={{ width: `${recommended.progress || 0}%` }}></div>
                                    </div>
                                </div>
                            </div>
                            <button className="btn-continue" onClick={() => navigate(`/take-quiz/${recommended.id}`)}>
                                Continue Quiz &rarr;
                            </button>
                        </div>
                    </section>
                )}

                {/* All Quizzes Grid */}
                <section className="all-quizzes-section">
                    <div className="section-header-row">
                        <h2 className="section-title"><Target size={20} color="#7C3AED" /> All Quizzes</h2>
                        <span className="showing-count">({filteredQuizzes.length} showing)</span>
                    </div>

                    {filteredQuizzes.length === 0 ? (
                        <p className="empty-state-text">No quizzes match your filters.</p>
                    ) : (
                        <div className="quiz-grid">
                            {filteredQuizzes.map((q) => (
                                <div key={q.id} className="quiz-card" style={{ borderTop: `4px solid ${getTopBorderColor(q)}` }}>

                                    <div className="card-top-row">
                                        <h3 className="card-title">{q.title}</h3>
                                        <span className={`status-badge ${q.completed ? 'done' : q.level?.toLowerCase()}`}>
                                            {q.completed ? 'DONE' : q.level?.toUpperCase()}
                                        </span>
                                    </div>

                                    <div className="card-tags">
                                        <span className="tag">{q.path}</span>
                                        <span className="tag">{q.level}</span>
                                    </div>

                                    <div className="card-body">
                                        {q.completed || q.attempts > 0 ? (
                                            <div className="score-display">
                                                <div className="circular-score" style={{ background: `conic-gradient(#7C3AED ${q.bestScore || 0}%, #F3F4F6 0)` }}>
                                                    <div className="inner-circle">{q.bestScore || 0}%</div>
                                                </div>
                                                <div className="score-details">
                                                    <span className="score-label">BEST SCORE</span>
                                                    <span className="score-value">{q.bestScore || 0}%</span>
                                                    <span className="attempts-count">{q.attempts} attempt{q.attempts !== 1 ? 's' : ''}</span>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="unattempted-display">
                                                <Target size={24} color="#D1D5DB" />
                                                <span>Not attempted yet</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="card-actions">
                                        {q.completed || q.attempts > 0 ? (
                                            <>
                                                <button className="btn-outline" onClick={() => handleViewResults(q)}>
                                                    ◎ Results
                                                </button>
                                                <button className="btn-solid-purple" onClick={() => navigate(`/take-quiz/${q.id}`)}>
                                                    <RotateCcw size={14} /> Retry
                                                </button>
                                            </>
                                        ) : (
                                            <button className="btn-solid-blue w-full" onClick={() => navigate(`/take-quiz/${q.id}`)}>
                                                <Play size={14} fill="currentColor" /> Start Quiz
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </div>

            {/* Results History Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>

                        <div className="modal-header">
                            <h3 className="modal-title">{modalQuizTitle} History</h3>
                            <button className="modal-close-btn" onClick={() => setShowModal(false)}>
                                <X size={20} />
                            </button>
                        </div>

                        <div className="modal-body">
                            {isModalLoading ? (
                                <p className="modal-message">Loading past attempts...</p>
                            ) : modalAttempts.length === 0 ? (
                                <p className="modal-message">No history found for this quiz.</p>
                            ) : (
                                <div className="attempts-list">
                                    {modalAttempts.map((attempt, index) => (
                                        <div key={index} className="attempt-card">
                                            <div className="attempt-info">
                                                <div className="attempt-number">Attempt {attempt.attemptNumber || index + 1}</div>
                                                <div className="attempt-date">{new Date(attempt.date).toLocaleDateString()}</div>
                                            </div>
                                            <div className="attempt-score">
                                                {attempt.score} / {100}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default QuizDashboard;