import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, MessageSquare, Map, TrendingUp, AlertCircle, FileText, User } from 'lucide-react';
import { getUserNotifications, getUnreadCount, markAsRead } from '../api/notificationService';
import './NotificationBell.css';

const NotificationBell = () => {
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const dropdownRef = useRef(null);
    const studentId = localStorage.getItem('studentId');

    // Fetch data initially and set up polling
    useEffect(() => {
        if (!studentId) return;

        const fetchData = async () => {
            try {
                const count = await getUnreadCount(studentId);
                setUnreadCount(count);
                const notifs = await getUserNotifications(studentId);
                setNotifications(notifs);
            } catch (error) {
                console.error("Error fetching notifications", error);
            }
        };

        fetchData();

        // Polling: Check for new notifications every 15 seconds
        const interval = setInterval(fetchData, 15000);
        return () => clearInterval(interval);
    }, [studentId]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleNotificationClick = async (notif) => {
        setIsOpen(false); // Close dropdown

        // 1. Mark as read in the backend (Unless it's a CHAT, which is handled in bulk)
        if (notif.type !== 'CHAT' && !notif.isRead) {
            try {
                await markAsRead(notif.id);
                // Update local state instantly for snappy UI
                setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, isRead: true } : n));
                setUnreadCount(prev => Math.max(0, prev - 1));
            } catch (e) {
                console.error("Failed to mark read", e);
            }
        }

        // 2. Navigation Logic based on Backend Types and your App.jsx routes
        switch (notif.type) {
            case 'CHAT':
            case 'INSTRUCTOR':
                // Note: The backend expects you to call markChatAsRead when this page actually opens!
                navigate(`/instructor-chat`);
                break;
            case 'ROADMAP':
            case 'PROGRESS':
            case 'REMINDER':
                navigate(`/roadmap/${notif.relatedId}`);
                break;
            case 'NOTE':
                // You don't have a /notes route in App.jsx yet, routing to chat as fallback
                navigate(`/instructor-chat`);
                break;
            default:
                navigate('/home');
        }
    };

    const getIconForType = (type) => {
        switch (type) {
            case 'CHAT': return <MessageSquare size={16} className="notif-icon text-blue" />;
            case 'INSTRUCTOR': return <User size={16} className="notif-icon text-purple" />;
            case 'ROADMAP': return <Map size={16} className="notif-icon text-green" />;
            case 'PROGRESS': return <TrendingUp size={16} className="notif-icon text-orange" />;
            case 'NOTE': return <FileText size={16} className="notif-icon text-yellow" />;
            case 'REMINDER': return <AlertCircle size={16} className="notif-icon text-red" />;
            default: return <Bell size={16} className="notif-icon text-gray" />;
        }
    };

    return (
        <div className="notification-wrapper" ref={dropdownRef}>
            <button className="icon-btn" onClick={() => setIsOpen(!isOpen)}>
                <Bell size={20} />
                {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
            </button>

            {isOpen && (
                <div className="notification-dropdown">
                    <div className="dropdown-header">
                        <h3>Notifications</h3>
                    </div>
                    <div className="dropdown-body">
                        {notifications.length === 0 ? (
                            <div className="empty-notifs">No notifications yet</div>
                        ) : (
                            notifications.map((notif) => (
                                <div
                                    key={notif.id}
                                    className={`notif-item ${!notif.isRead ? 'unread' : ''}`}
                                    onClick={() => handleNotificationClick(notif)}
                                >
                                    <div className="notif-icon-wrap">
                                        {getIconForType(notif.type)}
                                    </div>
                                    <div className="notif-content">
                                        <h4>{notif.title}</h4>
                                        <p>{notif.message}</p>
                                        <span className="notif-time">
                                            {new Date(notif.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                    {!notif.isRead && <div className="unread-dot"></div>}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationBell;