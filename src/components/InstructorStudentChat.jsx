import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, ArrowLeft, Search, Paperclip, Phone, Video, MoreVertical, Sparkles, ChevronDown, ChevronRight, Lock, GraduationCap } from 'lucide-react';
import { getInstructorStudents } from '../api/instructorDashboardService';
import { getConversationMessages, sendInstructorMessage, markConversationAsRead } from '../api/messageService';
import './StudentInstructorChat.css';

const InstructorStudentChat = () => {
    const navigate = useNavigate();
    const chatContainerRef = useRef(null);

    // States
    const [isLoading, setIsLoading] = useState(true);
    const [assignments, setAssignments] = useState([]);
    const [selectedAssignmentId, setSelectedAssignmentId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [isArchivedOpen, setIsArchivedOpen] = useState(true);
    const [error, setError] = useState(null); 

    // 1. Initial Load: Fetch Instructor's Students
    useEffect(() => {
        const fetchAssignments = async () => {
            try {
                const instructorId = localStorage.getItem('instructorId');
                const assignmentData = await getInstructorStudents(instructorId);

                if (!assignmentData || assignmentData.length === 0) {
                    setError("You don't have any students assigned to you yet.");
                    setIsLoading(false);
                    return;
                }

                // Normalize the active status
                const normalizedAssignments = assignmentData.map(a => ({
                    ...a,
                    active: a.isActive !== undefined ? a.isActive : (a.active === true || a.status === 'APPROVED')
                }));

                setAssignments(normalizedAssignments);

                // Automatically select the active assignment (or the first one if none are active)
                const activeAssig = normalizedAssignments.find(a => a.active === true);
                if (activeAssig) {
                    setSelectedAssignmentId(activeAssig.id);
                } else {
                    setSelectedAssignmentId(normalizedAssignments.id);
                }

            } catch (err) {
                console.error("Failed to load students:", err);
                setError("Failed to connect to the server.");
                setIsLoading(false);
            }
        };

        fetchAssignments();
    }, []);

    // 2. Fetch Messages whenever the selected conversation changes
    useEffect(() => {
        const fetchMessagesForSelectedChat = async () => {
            if (!selectedAssignmentId) return;

            try {
                const chatHistory = await getConversationMessages(selectedAssignmentId);
                setMessages(chatHistory);

                // Tell the backend we read them!
                markConversationAsRead(selectedAssignmentId).catch(e => console.error("Could not mark read", e));
            } catch (err) {
                console.error("Failed to load messages:", err);
                setMessages([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchMessagesForSelectedChat();
    }, [selectedAssignmentId]);

    // Bulletproof Auto-scroll
    const scrollToBottom = () => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    };
    useEffect(() => { scrollToBottom(); }, [messages]);

    // 3. Handle Sending Real Messages (With Optimistic UI)
    const handleSendMessage = async (e) => {
        e.preventDefault();
        const activeAssignment = assignments.find(a => a.id === selectedAssignmentId);

        if (!inputText.trim() || !activeAssignment?.active) return;

        const userMsg = inputText.trim();
        setInputText(''); // Clear input instantly for UX

        const tempMessageId = `temp-${Date.now()}`;
        const currentUserId = localStorage.getItem('instructorId');

        const tempMessage = {
            id: tempMessageId,
            content: userMsg,
            senderId: currentUserId,
            senderRole: 'INSTRUCTOR', // 🚨 Note: Changed to Instructor
            createdAt: new Date().toISOString()
        };

        // Instantly put it on the screen
        setMessages(prev => [...prev, tempMessage]);

        try {
            // Send to Java Backend
            const savedMessage = await sendInstructorMessage(selectedAssignmentId, userMsg);

            if (savedMessage && savedMessage.id) {
                setMessages(prev => prev.map(msg =>
                    msg.id === tempMessageId ? savedMessage : msg
                ));
            }
        } catch (err) {
            console.error("Failed to send message to backend:", err);
            window.alert("Failed to send message. Please check your connection.");

            setMessages(prev => prev.filter(msg => msg.id !== tempMessageId));
            setInputText(userMsg);
        }
    };

    // UI Helpers
    const formatTime = (dateString) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const getInitials = (name) => {
        if (!name) return "ST";
        return name.split(' ').map(n => n).join('').substring(0, 2).toUpperCase();
    };

    // --- RENDER SCREENS ---

    if (isLoading) {
        return (
            <div className="full-chat-layout center-layout">
                <div className="loading-spinner"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="full-chat-layout center-layout" style={{ flexDirection: 'column' }}>
                <button className="sidebar-back-btn" onClick={() => navigate('/instructor-home')} style={{ position: 'absolute', top: 20, left: 20 }}>
                    <ArrowLeft size={18} /> Back to Dashboard
                </button>
                <GraduationCap size={48} color="#94A3B8" style={{ marginBottom: 15 }} />
                <h2 style={{ color: '#1E293B' }}>{error}</h2>
            </div>
        );
    }

    const activeAssignment = assignments.find(a => a.id === selectedAssignmentId);
    const activeChatsList = assignments.filter(a => a.active);
    const archivedChatsList = assignments.filter(a => !a.active);

    return (
        <div className="full-chat-layout">

            {/* --- LEFT SIDEBAR --- */}
            <aside className="chat-sidebar">
                <div className="sidebar-header">
                    <button onClick={() => navigate('/instructor-home')} className="sidebar-back-btn">
                        <ArrowLeft size={18} /> Back to Dashboard
                    </button>
                    <h2>My Students</h2>
                    <div className="search-box">
                        <Search size={16} className="search-icon" />
                        <input type="text" placeholder="Search students..." />
                    </div>
                </div>

                <div className="sidebar-conversations">
                    {/* Active Section */}
                    {activeChatsList.length > 0 && (
                        <div className="sidebar-section">
                            <p className="section-label">Active Students</p>
                            {activeChatsList.map(chat => (
                                <div
                                    key={chat.id}
                                    className={`conv-card ${selectedAssignmentId === chat.id ? 'active' : ''}`}
                                    onClick={() => setSelectedAssignmentId(chat.id)}
                                >
                                    <div className="conv-avatar">
                                        {getInitials(chat.student?.fullName)}
                                        <span className="online-badge"></span>
                                    </div>
                                    <div className="conv-info">
                                        <div className="conv-name-row">
                                            <h4>{chat.student?.fullName}</h4>
                                        </div>
                                        <p className="conv-role">{chat.student?.major || 'Student Track'}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Archived Section */}
                    {archivedChatsList.length > 0 && (
                        <div className="sidebar-section">
                            <button
                                className="archived-toggle-btn"
                                onClick={() => setIsArchivedOpen(!isArchivedOpen)}
                            >
                                <span className="section-label" style={{ marginBottom: 0 }}>Dropped / Completed</span>
                                {isArchivedOpen ? <ChevronDown size={16} color="#94A3B8" /> : <ChevronRight size={16} color="#94A3B8" />}
                            </button>

                            {isArchivedOpen && (
                                <div className="archived-list">
                                    {archivedChatsList.map(chat => (
                                        <div
                                            key={chat.id}
                                            className={`conv-card archived ${selectedAssignmentId === chat.id ? 'active' : ''}`}
                                            onClick={() => setSelectedAssignmentId(chat.id)}
                                        >
                                            <div className="conv-avatar archived-avatar">
                                                {getInitials(chat.student?.fullName)}
                                            </div>
                                            <div className="conv-info">
                                                <div className="conv-name-row">
                                                    <h4>{chat.student?.fullName}</h4>
                                                </div>
                                                <p className="conv-role">{chat.student?.major || 'Student Track'}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </aside>

            {/* --- RIGHT MAIN CHAT AREA --- */}
            <main className="chat-main-area">

                {/* Chat Header */}
                <header className="main-chat-header">
                    <div className="header-left">
                        <div className="header-avatar" style={!activeAssignment?.active ? { background: '#94a3b8' } : {}}>
                            {getInitials(activeAssignment?.student?.fullName)}
                        </div>
                        <div className="header-text">
                            <h3>{activeAssignment?.student?.fullName}</h3>
                            {activeAssignment?.active ? (
                                <div className="status-row">
                                    <span className="status-dot"></span>
                                    <p>Online</p>
                                </div>
                            ) : (
                                <div className="status-row">
                                    <p style={{ color: '#94a3b8' }}>Archived Course</p>
                                </div>
                            )}
                        </div>
                    </div>

                </header>

                <div className="prompt-label">
                    {activeAssignment?.active ? (
                        <><Sparkles size={14} /> Provide guidance and answer your student's questions</>
                    ) : (
                        <><Lock size={14} /> This conversation is closed and read-only</>
                    )}
                </div>

                {/* Messages Container */}
                <div className="messages-scroll-area" ref={chatContainerRef}>
                    {messages.length === 0 && (
                        <div className="system-message">
                            <span>No messages yet. Send a welcoming message!</span>
                        </div>
                    )}
                    {messages.map((msg) => {
                        const currentUserId = localStorage.getItem('instructorId');

                        // 🚨 THE FLIP: Now, if YOU (Instructor) sent it, we use the blue bubble classes
                        const isMe = String(msg.senderId) === String(currentUserId) || msg.senderRole?.toUpperCase() === 'INSTRUCTOR';

                        if (msg.type === 'SYSTEM') {
                            return (
                                <div key={msg.id} className="system-message">
                                    <span>{msg.content}</span>
                                </div>
                            );
                        }

                        return (
                            // Note: 'student-row' & 'student-bubble' are just CSS class names for the right-side blue bubble.
                            // We use them here for the Instructor so the sender's text is always blue on the right!
                            <div key={msg.id} className={`message-row ${isMe ? 'student-row' : 'instructor-row'}`}>
                                {!isMe && (
                                    <div className="msg-avatar" style={!activeAssignment?.active ? { background: '#94a3b8' } : {}}>
                                        {getInitials(activeAssignment?.student?.fullName)}
                                    </div>
                                )}
                                <div className={`message-bubble ${isMe ? 'student-bubble' : 'instructor-bubble'} ${!activeAssignment?.active && !isMe ? 'archived-bubble' : ''}`}>
                                    <p>{msg.content}</p>
                                    <span className="msg-time">{formatTime(msg.createdAt)}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Dynamic Input Area */}
                <div className="input-container">
                    {activeAssignment?.active ? (
                        <form className="input-form" onSubmit={handleSendMessage}>

                            <input
                                type="text"
                                placeholder="Type your message..."
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                            />
                            <button type="submit" className="send-btn" disabled={!inputText.trim()}>
                                <Send size={18} />
                            </button>
                        </form>
                    ) : (
                        <div className="read-only-notice">
                            <Lock size={18} />
                            <p>You cannot reply to an archived conversation.</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default InstructorStudentChat;