import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, ArrowLeft, Search, Paperclip, Phone, Video, MoreVertical, Sparkles, ChevronDown, ChevronRight, Lock, GraduationCap } from 'lucide-react';

// REAL API IMPORTS
import { getStudentAssignment } from '../api/assignmentService';
import { getConversationMessages, sendInstructorMessage, markConversationAsRead } from '../api/messageService';

import './StudentInstructorChat.css';

const StudentInstructorChat = () => {
    const navigate = useNavigate();
    const chatContainerRef = useRef(null);

    // States
    const [isLoading, setIsLoading] = useState(true);
    const [assignments, setAssignments] = useState([]);
    const [selectedAssignmentId, setSelectedAssignmentId] = useState(null);
    const [messages, setMessages] = useState([]); // Holds messages for the CURRENTLY selected chat
    const [inputText, setInputText] = useState('');
    // const [isSending, setIsSending] = useState(false);
    const [isArchivedOpen, setIsArchivedOpen] = useState(true);
    const [error, setError] = useState(null);

    // 1. Initial Load: Fetch Assignments
    useEffect(() => {
        const fetchAssignments = async () => {
            try {
                const assignmentData = await getStudentAssignment();

                if (!assignmentData || assignmentData.length === 0) {
                    setError("You haven't been assigned an instructor yet.");
                    setIsLoading(false);
                    return;
                }

                // FIX: Normalize the data so React definitively knows if it is active!
                // This checks 'active', 'isActive', OR if the status is simply 'APPROVED'
                // STRICT NORMALIZER: Only allow chatting if the backend explicitly says isActive is true!
                const normalizedAssignments = assignmentData.map(a => ({
                    ...a,
                    // If the backend has an 'isActive' boolean, trust it 100%. Otherwise fallback to checking the status.
                    active: a.isActive !== undefined ? a.isActive : (a.active === true || a.status === 'APPROVED')
                }));

                setAssignments(normalizedAssignments);

                // Automatically select the active assignment (or the first one if none are active)
                const activeAssig = normalizedAssignments.find(a => a.active === true);
                if (activeAssig) {
                    setSelectedAssignmentId(activeAssig.id);
                } else {
                    setSelectedAssignmentId(normalizedAssignments[0].id);
                }

            } catch (err) {
                console.error("Failed to load assignments:", err);
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
                // Fetch the chat history for this specific assignment
                const chatHistory = await getConversationMessages(selectedAssignmentId);
                setMessages(chatHistory);

                // Tell the backend we read them!
                markConversationAsRead(selectedAssignmentId).catch(e => console.error("Could not mark read", e));
            } catch (err) {
                console.error("Failed to load messages:", err);
                // FIX: If the API fails (e.g., no messages yet), default to an empty chat so the page still loads!
                setMessages([]);
            } finally {
                // THE MAGIC FIX: Always tell React to stop loading, even if the API threw an error!
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

    // 3. Handle Sending Real Messages
    // 3. Handle Sending Real Messages (With Optimistic UI)
    const handleSendMessage = async (e) => {
        e.preventDefault();
        const activeAssignment = assignments.find(a => a.id === selectedAssignmentId);

        if (!inputText.trim() || !activeAssignment?.active) return;

        const userMsg = inputText.trim();
        setInputText(''); // Clear input instantly for UX

        // 🚀 OPTIMISTIC UPDATE: Create a temporary message to show instantly
        const tempMessageId = `temp-${Date.now()}`;
        const currentUserId = localStorage.getItem('studentId');

        const tempMessage = {
            id: tempMessageId,
            content: userMsg,
            senderId: currentUserId,
            senderRole: 'STUDENT',
            createdAt: new Date().toISOString() // Current time
        };

        // Instantly put it on the screen before the backend even thinks about it!
        setMessages(prev => [...prev, tempMessage]);

        try {
            // Quietly send to Java Backend in the background
            const savedMessage = await sendInstructorMessage(selectedAssignmentId, userMsg);

            // Once the backend replies, swap our temporary message with the real one (so it has the real database ID)
            // If your backend just returns "success", you can delete this setMessages line!
            if (savedMessage && savedMessage.id) {
                setMessages(prev => prev.map(msg =>
                    msg.id === tempMessageId ? savedMessage : msg
                ));
            }

        } catch (err) { // 🚨 FIX: Changed 'alert' to 'err' so the pop-up actually works!
            console.error("Failed to send message to backend:", err);
            window.alert("Failed to send message. Please check your connection.");

            // If the backend failed, remove the fake message and put their text back in the box
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
        if (!name) return "IN";
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
                <button className="sidebar-back-btn" onClick={() => navigate('/home')} style={{ position: 'absolute', top: 20, left: 20 }}>
                    <ArrowLeft size={18} /> Back to Dashboard
                </button>
                <GraduationCap size={48} color="#94A3B8" style={{ marginBottom: 15 }} />
                <h2 style={{ color: '#1E293B' }}>{error}</h2>
            </div>
        );
    }

    // Prepare data for UI
    const activeAssignment = assignments.find(a => a.id === selectedAssignmentId);
    const activeChatsList = assignments.filter(a => a.active);
    const archivedChatsList = assignments.filter(a => !a.active);

    return (
        <div className="full-chat-layout">

            {/* --- LEFT SIDEBAR --- */}
            <aside className="chat-sidebar">
                <div className="sidebar-header">
                    <button onClick={() => navigate('/home')} className="sidebar-back-btn">
                        <ArrowLeft size={18} /> Back to Home
                    </button>
                    <h2>Messages</h2>
                    <div className="search-box">
                        <Search size={16} className="search-icon" />
                        <input type="text" placeholder="Search conversations..." />
                    </div>
                </div>

                <div className="sidebar-conversations">
                    {/* Active Section */}
                    {activeChatsList.length > 0 && (
                        <div className="sidebar-section">
                            <p className="section-label">Active</p>
                            {activeChatsList.map(chat => (
                                <div
                                    key={chat.id}
                                    className={`conv-card ${selectedAssignmentId === chat.id ? 'active' : ''}`}
                                    onClick={() => setSelectedAssignmentId(chat.id)}
                                >
                                    <div className="conv-avatar">
                                        {getInitials(chat.instructor?.fullName)}
                                        <span className="online-badge"></span>
                                    </div>
                                    <div className="conv-info">
                                        <div className="conv-name-row">
                                            <h4>{chat.instructor?.fullName}</h4>
                                        </div>
                                        <p className="conv-role">{chat.instructor?.role || 'Instructor'}</p>
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
                                <span className="section-label" style={{ marginBottom: 0 }}>Previous Conversations</span>
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
                                                {getInitials(chat.instructor?.fullName)}
                                            </div>
                                            <div className="conv-info">
                                                <div className="conv-name-row">
                                                    <h4>{chat.instructor?.fullName}</h4>
                                                </div>
                                                <p className="conv-role">{chat.instructor?.role || 'Instructor'}</p>
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
                            {getInitials(activeAssignment?.instructor?.fullName)}
                        </div>
                        <div className="header-text">
                            <h3>{activeAssignment?.instructor?.fullName}</h3>
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
                        <><Sparkles size={14} /> Ask your instructor anything about your roadmap</>
                    ) : (
                        <><Lock size={14} /> This conversation is closed and read-only</>
                    )}
                </div>

                {/* Messages Container */}
                <div className="messages-scroll-area" ref={chatContainerRef}>
                    {messages.length === 0 && (
                        <div className="system-message">
                            <span>No messages yet. Say hello!</span>
                        </div>
                    )}
                    {messages.map((msg) => {
                        // Backend relies on senderRole to identify who sent it
                        const currentUserId = localStorage.getItem('studentId');

                        // It's you IF the senderId matches your ID, OR if the role explicitly says STUDENT
                        const isStudent = String(msg.senderId) === String(currentUserId) || msg.senderRole?.toUpperCase() === 'STUDENT';

                        // Handle system messages (like "conversation closed")
                        if (msg.type === 'SYSTEM') {
                            return (
                                <div key={msg.id} className="system-message">
                                    <span>{msg.content}</span>
                                </div>
                            );
                        }

                        return (
                            <div key={msg.id} className={`message-row ${isStudent ? 'student-row' : 'instructor-row'}`}>
                                {!isStudent && (
                                    <div className="msg-avatar" style={!activeAssignment?.active ? { background: '#94a3b8' } : {}}>
                                        {getInitials(activeAssignment?.instructor?.fullName)}
                                    </div>
                                )}
                                <div className={`message-bubble ${isStudent ? 'student-bubble' : 'instructor-bubble'} ${!activeAssignment?.active && !isStudent ? 'archived-bubble' : ''}`}>
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
                            /* Removed disabled={isSending} */
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

export default StudentInstructorChat;