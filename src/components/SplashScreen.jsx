import React, { useEffect, useState } from 'react';
import { Star, Rocket, Sparkles, BookOpen, Compass, Lightbulb, Zap, BrainCircuit } from 'lucide-react';
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

            {/* Existing Icons */}
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

            {/* New Added Icons */}
            <Compass
                className="floating-icon icon-compass"
                size={30}
                color="#8B5CF6"
            />


            <Zap
                className="floating-icon icon-zap"
                size={28}
                color="#3B82F6"
                fill="#3B82F6"
            />

            <BrainCircuit
                className="floating-icon icon-brain"
                size={34}
                color="#EC4899"
            />

            <Star className="floating-icon icon-star-2" size={20} color="#F43F5E" fill="#F43F5E" />
            <Sparkles className="floating-icon icon-sparkle-2" size={24} color="#14B8A6" fill="#14B8A6" />
            <BookOpen className="floating-icon icon-book-2" size={32} color="#8B5CF6" />
            <Compass className="floating-icon icon-compass-2" size={22} color="#F97316" />
            <Lightbulb className="floating-icon icon-lightbulb-2" size={20} color="#06B6D4" />
            <Zap className="floating-icon icon-zap-2" size={18} color="#EAB308" fill="#EAB308" />


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