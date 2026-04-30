import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, ChevronRight, Loader2, Trophy, Circle, CheckCircle2 } from 'lucide-react';
import { fetchQuizById, submitQuiz, fetchQuizResumeState, saveQuizProgress } from '../api/quizService';
import './TakeQuiz.css';

const letters = ['A', 'B', 'C', 'D'];

const TakeQuiz = () => {
    const navigate = useNavigate();
    const { quizId } = useParams();

    const [quizData, setQuizData] = useState(null);
    const [currentIdx, setCurrentIdx] = useState(0);
    const [answers, setAnswers] = useState([]);
    const [isComplete, setIsComplete] = useState(false);
    const [finalScore, setFinalScore] = useState(null);

    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadQuiz = async () => {
            try {
                setIsLoading(true);
                const studentId = localStorage.getItem('studentId');

                const [data, resumeData] = await Promise.all([
                    fetchQuizById(quizId),
                    fetchQuizResumeState(quizId, studentId).catch(() => null)
                ]);

                setQuizData(data);
                const initialAnswers = new Array(data.questions.length).fill(-1);

                if (resumeData && resumeData.nextQuestionIndex > 0) {
                    setCurrentIdx(resumeData.nextQuestionIndex);
                }

                setAnswers(initialAnswers);
                setIsLoading(false);
            } catch (err) {
                setError(err.message);
                setIsLoading(false);
            }
        };
        if (quizId) loadQuiz();
    }, [quizId]);

    const handleSelectOption = (optIdx) => {
        const newAnswers = [...answers];
        newAnswers[currentIdx] = optIdx;
        setAnswers(newAnswers);
    };

    const handleNext = async () => {
        if (answers[currentIdx] === -1) return;

        if (currentIdx < quizData.questions.length - 1) {
            setCurrentIdx(prev => prev + 1);
        } else {
            await submitToBackend();
        }
    };

    const submitToBackend = async () => {
        try {
            setIsSubmitting(true);
            const studentId = localStorage.getItem('studentId');

            const payloadAnswers = quizData.questions.map((q, index) => {
                const selectedIdx = answers[index];
                const optionKeys = ['optionA', 'optionB', 'optionC', 'optionD'];
                const selectedText = q[optionKeys[selectedIdx]];

                return {
                    questionId: q.id,
                    answer: selectedText
                };
            });

            const response = await submitQuiz(quizId, studentId, payloadAnswers);

            console.log("BACKEND RESPONSE:", response);
            const actualScore = typeof response === 'number' ? response : response.score;
            setFinalScore(actualScore || 0);

            setIsComplete(true);
            setIsSubmitting(false);

        } catch (err) {
            console.error("Failed to submit:", err);
            alert("Failed to submit your quiz. Please try again.");
            setIsSubmitting(false);
        }
    };

    const handlePrev = () => {
        if (currentIdx > 0) setCurrentIdx(prev => prev - 1);
    };

    if (isLoading) return <div className="take-quiz-loader"><Loader2 className="animate-spin text-purple" size={48} /></div>;
    if (error) return <div className="take-quiz-error">{error}</div>;
    if (!quizData || !quizData.questions) return <div className="take-quiz-error">Quiz not found.</div>;

    const currentQ = quizData.questions[currentIdx];
    const currentOptions = [currentQ.optionA, currentQ.optionB, currentQ.optionC, currentQ.optionD];

    // Calculate progress (handling 0 index)
    const progressPct = quizData.questions.length > 0
        ? Math.round(((currentIdx) / quizData.questions.length) * 100)
        : 0;

    const handleExit = async () => {
        const studentId = localStorage.getItem('studentId');
        try {
            const payloadAnswers = answers
                .map((optIdx, index) => {
                    if (optIdx === -1) return null;
                    const q = quizData.questions[index];
                    const optionKeys = ['optionA', 'optionB', 'optionC', 'optionD'];
                    return {
                        questionId: q.id,
                        answer: q[optionKeys[optIdx]]
                    };
                })
                .filter(a => a !== null);

            await saveQuizProgress(quizId, studentId, payloadAnswers);
        } catch (err) {
            console.error("Failed to save progress:", err);
        }
        navigate('/quizzes');
    };

    return (
        <div className="take-quiz-light-wrapper">
            {/* Top Navigation Bar */}
            <nav className="quiz-top-nav">
                <button onClick={handleExit} className="nav-exit-btn">
                    <ArrowLeft size={16} /> Exit Quiz
                </button>
                <div className="nav-quiz-title">{quizData.title}</div>
                <div className="nav-fraction">{currentIdx + 1} / {quizData.questions.length}</div>
            </nav>

            {/* Global Progress Bar */}
            <div className="global-progress-track">
                <div className="global-progress-fill" style={{ width: `${progressPct}%` }}></div>
            </div>

            {/* Main Content Layout */}
            <main className="quiz-main-layout">

                {/* Left Side: Quiz Card */}
                <div className="quiz-card-container">

                    {/* Decorative Dots */}
                    <div className="card-decor-dots">
                        <div className="dash-purple"></div>
                        <div className="dot-gray"></div>
                        <div className="dot-gray"></div>
                        <div className="dot-gray"></div>
                    </div>

                    <div className="question-meta">
                        QUESTION {currentIdx + 1} OF {quizData.questions.length}
                    </div>

                    <h2 className="question-text">{currentQ.questionText}</h2>

                    <div className="options-list" role="radiogroup">
                        {currentOptions.map((optText, i) => {
                            if (!optText) return null;
                            const isSelected = answers[currentIdx] === i;
                            return (
                                <div
                                    key={i}
                                    onClick={() => handleSelectOption(i)}
                                    className={`option-item ${isSelected ? 'selected' : ''}`}
                                    role="radio"
                                    aria-checked={isSelected}
                                >
                                    <div className="option-letter-box">{letters[i]}</div>
                                    <span className="option-text">{optText}</span>
                                    <div className="radio-icon">
                                        {isSelected ? (
                                            <CheckCircle2 className="checked-icon" size={24} />
                                        ) : (
                                            <Circle className="unchecked-icon" size={24} />
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Card Footer */}
                    <footer className="card-footer">
                        <span className="percent-complete">{progressPct}% complete</span>
                        <div className="footer-actions">
                            <button
                                onClick={handlePrev}
                                disabled={currentIdx === 0 || isSubmitting}
                                className="btn-back"
                            >
                                <ChevronLeft size={16} /> Back
                            </button>
                            <button onClick={handleNext} disabled={answers[currentIdx] === -1 || isSubmitting} className="btn-next">
                                {isSubmitting ? (
                                    <><Loader2 className="animate-spin" size={16} /> Submitting</>
                                ) : currentIdx === quizData.questions.length - 1 ? (
                                    'Submit'
                                ) : (
                                    <>Next <ChevronRight size={16} /></>
                                )}
                            </button>
                        </div>
                    </footer>
                </div>

                {/* Right Side: Image Column */}
                {/*<aside className="quiz-images-column">
                   
                    <div className="image-wrapper">
                        <img src={cRobot} alt=" 1" />
                    </div>
                    <div className="image-wrapper">
                        <img src={wRobot} alt=" 2" />
                    </div>
                    <div className="image-wrapper">
                        <img src={whRobot} alt=" 3" />
                    </div>
                </aside>*/}
            </main>

            {/* Completion Overlay (Updated to match light theme) */}
            {isComplete && (
                <div className="completion-overlay">
                    <div className="overlay-content">
                        <div className="trophy-container"><Trophy size={48} color="#7C3AED" /></div>
                        <h2 className="completion-title">Quiz Submitted!</h2>
                        <p className="score-text">Your answers have been saved and graded.</p>
                        <button
                            onClick={() => navigate('/quizzes', { state: { recentScore: finalScore } })}
                            className="btn-return-home"
                        >
                            Return to Dashboard
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TakeQuiz;