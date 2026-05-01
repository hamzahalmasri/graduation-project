import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain, Send, Sparkles, ArrowLeft, Target, Zap, Shield, Loader2 } from 'lucide-react';
import { sendRoadmapChatMessage, generateUserRoadmap } from '../api/roadmapService';
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

// 🚨 Define the exact order of questions expected by the backend
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

    const [messages, setMessages] = useState([
        { sender: 'bot', text: "Hello! 👋 Welcome to your Personalized Learning Roadmap Assistant.\n\nI'll ask you a few quick questions to understand your goals, then generate a customized roadmap just for you.\n\nFirst Question:\nWhat learning path are you interested in?\n- Python Programming\n- Frontend Web Development\n- Backend Web Development\n- Machine Learning" }
    ]);
    const [inputText, setInputText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);

    // 🚨 NEW: Track the user's explicit answers
    const [answers, setAnswers] = useState({
        learningPath: "",
        roadmapLength: "",
        learningStyle: "",
        weeklyStudyTime: "",
        mainGoal: "",
        confidenceLevel: ""
    });

    const [currentOptions, setCurrentOptions] = useState(() => {
        return extractOptions(messages?.text || "");
    });

    const scrollToBottom = () => {
        if (chatContainerRef.current) {
            const container = chatContainerRef.current;
            container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
        }
    };

    useEffect(() => { scrollToBottom(); }, [messages, isTyping, currentOptions]);

    // 🚨 NEW: Helper function to save the answer to the correct state key
    const saveAnswer = (userResponse) => {
        // Count how many user messages exist BEFORE this new one is added.
        // If 0 user messages exist, this response maps to index 0 (learningPath), etc.
        const userMessageCount = messages.filter(m => m.sender === 'user').length;

        if (userMessageCount < QUESTION_KEYS.length) {
            const currentKey = QUESTION_KEYS[userMessageCount];
            setAnswers(prev => ({
                ...prev,
                [currentKey]: userResponse
            }));
        }
    };

    const handleOptionClick = async (option) => {
        if (isTyping || isGenerating) return;

        saveAnswer(option); // Save the answer to state!

        setCurrentOptions([]);
        setMessages(prev => [...prev, { sender: 'user', text: option }]);
        setIsTyping(true);

        try {
            const replyText = await sendRoadmapChatMessage(option);
            setMessages(prev => [...prev, { sender: 'bot', text: replyText }]);
            setCurrentOptions(extractOptions(replyText));
        } catch (error) {
            setMessages(prev => [...prev, { sender: 'bot', text: error.message }]);
            setCurrentOptions([]);
        } finally {
            setIsTyping(false);
        }
    };

    const handleSendMessage = async () => {
        if (!inputText.trim() || isTyping) return;

        const userMsg = inputText.trim();
        setInputText('');

        saveAnswer(userMsg); // Save the manually typed answer to state!

        setCurrentOptions([]);
        setMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
        setIsTyping(true);

        try {
            const replyText = await sendRoadmapChatMessage(userMsg);
            setMessages(prev => [...prev, { sender: 'bot', text: replyText }]);
            setCurrentOptions(extractOptions(replyText));
        } catch (error) {
            setMessages(prev => [...prev, { sender: 'bot', text: error.message }]);
            setCurrentOptions([]);
        } finally {
            setIsTyping(false);
        }
    };

    const handleGenerate = async () => {
        const studentId = localStorage.getItem('studentId');
        if (!studentId) {
            alert("Please log in to generate a roadmap.");
            return;
        }

        setIsGenerating(true);
        try {
            // 🚨 NEW: Package the fully tracked answers exactly how the backend requested
            const requestPayload = {
                userId: studentId,
                learningPath: answers.learningPath,
                roadmapLength: answers.roadmapLength,
                learningStyle: answers.learningStyle,
                weeklyStudyTime: answers.weeklyStudyTime,
                mainGoal: answers.mainGoal,
                confidenceLevel: answers.confidenceLevel
            };

            const newRoadmap = await generateUserRoadmap(requestPayload);

            if (newRoadmap && newRoadmap.id) {
                navigate(`/roadmap/${newRoadmap.id}`);
            } else {
                navigate('/roadmaps');
            }
        } catch (error) {
            console.error("Generate error:", error);
            alert("Failed to generate roadmap. Check your roadmaps list in a minute.");
            setIsGenerating(false);
        }
    };

    const isReadyToGenerate = messages.length >= 12 || messages.some(m =>
        m.sender === 'bot' && m.text.toLowerCase().includes('ready to generate')
    );

    return (
        <div className="ai-roadmap-wrapper">

            {/* Top Navigation */}
            <nav className="ai-roadmap-nav">
                <div className="ai-roadmap-nav-left">
                    <img src={logo} alt="EduGuide Logo" className="ai-roadmap-logo" />
                </div>
                <div className="ai-roadmap-nav-center">
                    <span className="ai-roadmap-page-title">EduGuide AI Roadmap Builder</span>
                </div>
                <div className="ai-roadmap-nav-right">
                    <button className="ai-roadmap-btn-back" onClick={() => navigate('/home')}>
                        <ArrowLeft size={16} /> Back to Home
                    </button>
                </div>
            </nav>

            <main className="ai-roadmap-main">
                {/* Left Sidebar */}
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
                            <div className="ai-roadmap-icon-wrap red"><Target size={20} /></div>
                            <div className="ai-roadmap-inst-text">
                                <h4>Choose your option</h4>
                                <p>The more detail you choose, the more tailored your roadmap will be.</p>
                            </div>
                        </div>
                        <div className="ai-roadmap-inst-card">
                            <div className="ai-roadmap-icon-wrap yellow"><Zap size={20} /></div>
                            <div className="ai-roadmap-inst-text">
                                <h4>Quick Answers</h4>
                                <p>Click the suggested options or type your own, both work great!</p>
                            </div>
                        </div>
                        <div className="ai-roadmap-inst-card">
                            <div className="ai-roadmap-icon-wrap green"><Shield size={20} /></div>
                            <div className="ai-roadmap-inst-text">
                                <h4>Private & Safe</h4>
                                <p>Your conversation is only used to generate your personal roadmap.</p>
                            </div>
                        </div>
                    </div>
                </aside>

                {/* Right Chat Area */}
                <section className="ai-roadmap-chat-area">
                    {/* Chat Header */}
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

                    {/* Messages Area */}
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

                        {isReadyToGenerate && !isTyping && (
                            <div className="ai-roadmap-generate-wrap">
                                <button className="ai-roadmap-btn-generate" onClick={handleGenerate} disabled={isGenerating}>
                                    <Sparkles size={16} />
                                    {isGenerating ? 'Building your path...' : 'Generate My Roadmap Now'}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Options Grid */}
                    {currentOptions.length > 0 && !isTyping && !isGenerating && (
                        <div className="ai-roadmap-options-grid">
                            {currentOptions.map((option, idx) => (
                                <button
                                    key={idx}
                                    className="ai-roadmap-btn-option"
                                    onClick={() => handleOptionClick(option)}
                                >
                                    {option}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Input Area */}
                    <div className="ai-roadmap-input-area">
                        <input
                            type="text"
                            placeholder="Type a message or click an option above..."
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                            disabled={isTyping || isGenerating}
                            className="ai-roadmap-text-input"
                        />
                        <button
                            className="ai-roadmap-btn-send"
                            onClick={handleSendMessage}
                            disabled={isTyping || isGenerating || !inputText.trim()}
                        >
                            <Send size={18} />
                        </button>
                    </div>
                </section>
            </main>

            {/* 🎥 Fullscreen Video Loading Overlay */}
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