import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain, Send, Sparkles, ArrowLeft, Target, Zap, Shield, Loader2 } from 'lucide-react';
import { sendRoadmapChatMessage, createRoadmap } from '../api/roadmapService';
import logo from '../assets/logo.png';
import './AiChatbot.css';

// 🧠 Backend Extraction Logic
const extractOptions = (text) => {
    if (!text || typeof text !== 'string') return [];
    const lines = text.split('\n');
    return lines
        .filter(line => line.trim().startsWith('-'))
        .map(line => line.trim().replace(/^-\s*/, '').trim())
        .filter(opt => opt.length > 0);
};

const QUESTION_KEYS = [
    'learningPath',
    'roadmapLength',
    'learningStyle',
    'weeklyStudyTime',
    'mainGoal',
    'confidenceLevel'
];

const AiChatbot = () => {
    const navigate = useNavigate();
    const chatContainerRef = useRef(null);
    const hasInitialized = useRef(false);

    const studentId = localStorage.getItem('studentId') || 'guest';
    const sessionId = useRef(`session-${studentId}-${Date.now()}`);

    const [history, setHistory] = useState([]);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [messages, setMessages] = useState([]);

    const [answers, setAnswers] = useState({
        learningPath: '',
        roadmapLength: '',
        learningStyle: '',
        weeklyStudyTime: '',
        mainGoal: '',
        confidenceLevel: ''
    });

    const [currentOptions, setCurrentOptions] = useState([]);
    const [inputText, setInputText] = useState('');
    const [isTyping, setIsTyping] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);

    // Auto-start the conversation on load
    useEffect(() => {
        if (!hasInitialized.current) {
            hasInitialized.current = true;
            startConversation();
        }
    }, []);

    const startConversation = async () => {
        try {
            const initialHistory = [{ role: 'user', text: 'Hello' }];
            const requestBody = {
                message: "User: Hello",
                sessionId: sessionId.current
            };

            const botReply = await sendRoadmapChatMessage(requestBody);

            setHistory([...initialHistory, { role: 'bot', text: botReply }]);
            setMessages([{ sender: 'bot', text: botReply }]);
            setCurrentOptions(extractOptions(botReply));
            setCurrentQuestion(1);
        } catch (error) {
            console.error("Failed to start chat", error);
            setMessages([{ sender: 'bot', text: "Error connecting to AI. Please refresh the page." }]);
        } finally {
            setIsTyping(false);
        }
    };

    const scrollToBottom = () => {
        if (chatContainerRef.current) {
            const container = chatContainerRef.current;
            container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
        }
    };

    useEffect(() => { scrollToBottom(); }, [messages, isTyping, currentOptions]);

    const handleUserAnswer = async (userAnswer) => {
        if (!userAnswer.trim() || isTyping || isGenerating) return;

        setInputText('');
        setCurrentOptions([]);
        setIsTyping(true);

        // Track the answer
        let updatedAnswers = { ...answers };
        const keyIndex = currentQuestion - 1;

        if (keyIndex >= 0 && keyIndex < QUESTION_KEYS.length) {
            const keyName = QUESTION_KEYS[keyIndex];
            updatedAnswers[keyName] = userAnswer;
            setAnswers(updatedAnswers);
        }

        const newHistory = [...history, { role: 'user', text: userAnswer }];
        setHistory(newHistory);
        setMessages(prev => [...prev, { sender: 'user', text: userAnswer }]);

        const historyString = newHistory
            .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.text}`)
            .join('\n');

        const requestBody = {
            message: historyString,
            sessionId: sessionId.current
        };

        if (currentQuestion === 6) {
            requestBody.learningPath = updatedAnswers.learningPath;
            setIsGenerating(true);
        }

        try {
            const botReply = await sendRoadmapChatMessage(requestBody);

            // 🚀 FIXED: Strip Markdown tags from the AI's response before parsing!
            try {
                // This removes ```json and ``` from the string
                const cleanJsonString = botReply.replace(/```json/gi, '').replace(/```/g, '').trim();
                const parsed = JSON.parse(cleanJsonString);

                if (parsed.phases) {
                    await saveRoadmap(parsed, updatedAnswers);
                    return; // Stop here, redirecting!
                }
            } catch (e) {
                console.warn("Failed to parse AI response as JSON", e);
            }

            setHistory([...newHistory, { role: 'bot', text: botReply }]);
            setMessages(prev => [...prev, { sender: 'bot', text: botReply }]);
            setCurrentOptions(extractOptions(botReply));
            setCurrentQuestion(prev => prev + 1);

        } catch (error) {
            setMessages(prev => [...prev, { sender: 'bot', text: "Sorry, I lost connection to the server." }], error);
        } finally {
            setIsTyping(false);
        }
    };

    const saveRoadmap = async (roadmapJson, finalAnswers) => {
        if (studentId === 'guest') {
            alert("Please log in to save your roadmap!");
            setIsGenerating(false);
            navigate('/roadmaps');
            return;
        }

        try {
            const saved = await createRoadmap({
                userId: parseInt(studentId),
                learningPath: finalAnswers.learningPath,
                roadmapLength: finalAnswers.roadmapLength,
                learningStyle: finalAnswers.learningStyle,
                weeklyStudyTime: finalAnswers.weeklyStudyTime,
                mainGoal: finalAnswers.mainGoal,
                confidenceLevel: finalAnswers.confidenceLevel,
                roadmapContent: JSON.stringify(roadmapJson)
            });

            navigate('/roadmap/' + saved.id);
        } catch (err) {
            console.error("Failed to save final roadmap", err);
            alert("Roadmap generated but failed to save to database.");
            setIsGenerating(false);
        }
    };

    return (
        <div className="ai-roadmap-wrapper">


            <nav className="ai-roadmap-nav">
                <div className="ai-roadmap-nav-left">
                    <img src={logo} alt="EduGuide Logo" className="ai-roadmap-logo" />
                </div>
                <div className="ai-roadmap-nav-center">
                    <span className="ai-roadmap-page-title">EduGuide AI Roadmap Builder</span>
                </div>
                <div className="ai-roadmap-nav-right">
                    <button className="ai-roadmap-btn-back" onClick={() => navigate('/home')}>
                        <ArrowLeft /> Back to Home
                    </button>
                </div>
            </nav>

            <main className="ai-roadmap-main">

                <aside className="ai-roadmap-sidebar">
                    <div className="ai-roadmap-video-card">
                        <div className="ai-roadmap-robot-status">
                            <span className="ai-roadmap-status-dot"></span> EduBot is here to help
                        </div>
                        <div className="ai-roadmap-video-wrapper">
                            <video autoPlay loop muted playsInline className="ai-roadmap-video" >
                                <source src="/videos/Robot_Chatting_and_Using_Phone.webm" type="video/webm" />
                                Your browser does not support the video tag.
                            </video>
                        </div>
                    </div>

                    <div className="ai-roadmap-instructions">
                        <div className="ai-roadmap-inst-card">
                            <div className="ai-roadmap-icon-wrap red"><Target size="{20}" /></div>
                            <div className="ai-roadmap-inst-text">
                                <h4>Choose your option</h4>
                                <p>The more detail you choose, the more tailored your roadmap will be.</p>
                            </div>
                        </div>
                        <div className="ai-roadmap-inst-card">
                            <div className="ai-roadmap-icon-wrap yellow"><Zap size="{20}" /></div>
                            <div className="ai-roadmap-inst-text">
                                <h4>Quick Answers</h4>
                                <p>Click the suggested options or type your own, both work great!</p>
                            </div>
                        </div>
                        <div className="ai-roadmap-inst-card">
                            <div className="ai-roadmap-icon-wrap green"><Shield size="{20}" /></div>
                            <div className="ai-roadmap-inst-text">
                                <h4>Private & Safe</h4>
                                <p>Your conversation is only used to generate your personal roadmap.</p>
                            </div>
                        </div>
                    </div>
                </aside>


                <section className="ai-roadmap-chat-area">

                    <div className="ai-roadmap-chat-header">
                        <div className="ai-roadmap-bot-avatar">
                            <img src={logo} alt="EduBot Avatar" className="ai-roadmap-bot-avatar-img" />
                        </div>
                        <div className="ai-roadmap-header-info">
                            <div className="ai-roadmap-header-title">Roadmap Assistant</div>
                            <div className="ai-roadmap-header-status">
                                <span className={`ai-roadmap-status-dot ${isTyping ? 'typing' : 'online'}`}></span>
                                {isTyping ? 'Thinking...' : 'Online · Powered by AI'}
                            </div>
                        </div>
                    </div>


                    <div className="ai-roadmap-messages" ref={chatContainerRef}>
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`ai-roadmap-bubble ${msg.sender === 'bot' ? 'ai-roadmap-bot' : 'ai-roadmap-user'}`}>
                                {msg.text}
                            </div>
                        ))}

                        {isTyping && (
                            <div className="ai-roadmap-typing-indicator">
                                <div className="ai-roadmap-dot"></div>
                                <div className="ai-roadmap-dot"></div>
                                <div className="ai-roadmap-dot"></div>
                            </div>
                        )}
                    </div>


                    {currentOptions.length > 0 && !isTyping && !isGenerating && (
                        <div className="ai-roadmap-options-grid">
                            {currentOptions.map((option, idx) => (
                                <button
                                    key={idx}
                                    className="ai-roadmap-btn-option"
                                    onClick={() => handleUserAnswer(option)}
                                >
                                    {option}
                                </button>
                            ))}
                        </div>
                    )}


                    <div className="ai-roadmap-input-area">
                        <input
                            type="text"
                            placeholder="Type a message or click an option above..."
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleUserAnswer(inputText)}
                            disabled={isTyping || isGenerating}
                            className="ai-roadmap-text-input"
                        />
                        <button
                            className="ai-roadmap-btn-send"
                            onClick={() => handleUserAnswer(inputText)}
                            disabled={isTyping || isGenerating || !inputText.trim()}
                        >
                            <Send />
                        </button>
                    </div>
                </section>
            </main>


            {isGenerating && (
                <div className="ai-roadmap-loading-overlay">
                    <video autoPlay loop muted playsInline className="ai-roadmap-loading-video">
                        <source src="/videos/Robot_Head_Loading_Screen.webm" type="video/webm" />
                    </video>
                </div>
            )}
        </div>
    );
};

export default AiChatbot;