import React, { useEffect, useState } from 'react';
import { Star, Rocket, Sparkles, BookOpen } from 'lucide-react';
import './SplashScreen.css';
import logo from '../assets/logo.png';

const SplashScreen = ({ onComplete }) => {
    const [progress, setProgress] = useState(0);

    // Simulate the loading progress bar
    useEffect(() => {
        const duration = 3000; // 3 seconds loading time
        const intervalTime = 30;
        const steps = duration / intervalTime;
        let currentStep = 0;

        const timer = setInterval(() => {
            currentStep++;
            setProgress(Math.min((currentStep / steps) * 100, 100));

            if (currentStep >= steps) {
                clearInterval(timer);
                setTimeout(() => {
                    if (onComplete) onComplete();
                }, 400); // Small pause at 100% before transitioning
            }
        }, intervalTime);

        return () => clearInterval(timer);
    }, [onComplete]);

    return (
        <div className="splash-screen-wrapper">

            {/* Floating Background Icons (Inline SVGs so you don't need extra files) */}
            <Star
                className="floating-icon icon-star"
                size={28}
                color="#F97316"
                fill="#F97316"
            />

            <Rocket
                className="floating-icon icon-rocket"
                size={32}
                color="#06B6D4"
            />

            <Sparkles
                className="floating-icon icon-sparkle"
                size={36}
                color="#FBBF24"
                fill="#FBBF24"
            />

            <BookOpen
                className="floating-icon icon-book"
                size={28}
                color="#10B981"
            />

            {/* Main Content */}
            <main className="splash-main-content">
                <div className="logo-container">
                    <img src={logo} alt="EduGuide Logo" className="splash-robot-img" />
                </div>



                <h2 className="splash-subtitle">Adventures in Learning</h2>
                <p className="splash-tagline">Powered by AI magic</p>
            </main>

            {/* Bottom Progress Bar */}
            <footer className="splash-footer">
                <div className="progress-text-container">
                    <span className="progress-text">Plotting your path...</span>
                </div>
                <div className="progress-track">
                    <div
                        className="progress-fill"
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>
            </footer>
        </div>
    );
};

export default SplashScreen;