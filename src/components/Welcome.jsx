import React from 'react';
import { useNavigate } from 'react-router-dom';
import StudentHomePage from './StudentHomePage';
import './Welcome.css';

const ROADMAP_STEPS = [
    { id: 1, text: "Talk to AI" },
    { id: 2, text: "Wait for AI analysis" },
    { id: 3, text: "Get your roadmap and start" }
];

const Welcome = () => {
    const navigate = useNavigate();

    const renderStepsSequence = (ariaHidden = false) => (
        <div className="ticker-sequence" aria-hidden={ariaHidden}>
            {ROADMAP_STEPS.map((step) => (
                <React.Fragment key={step.id}>
                    <span className="step-item">
                        <span className="step-number">{step.id}</span> {step.text}
                    </span>
                    <span className="step-dot">•</span>
                </React.Fragment>
            ))}
        </div>
    );

    return (
        <div className="welcome-split-container">

            <div className="welcome-left">
                <div className="welcome-content-wrapper">
                    <h1 className="welcome-title">Welcome to AI Learning Roadmap</h1>
                    <p className="welcome-description">
                        We are thrilled to have you here. Our intelligent platform is designed to understand your unique goals, skill level, and interests to craft the perfect, personalized curriculum just for you.
                    </p>

                    <div className="steps-ticker-container">
                        <div className="steps-ticker-track">
                            {renderStepsSequence(false)}
                            {renderStepsSequence(true)}
                        </div>
                    </div>

                    <button className="btn-get-started" onClick={() => navigate('/chat')}>
                        Lets Get Started
                    </button>
                </div>
            </div>

            <div className="welcome-right">
                <video className="robot-video" autoPlay loop muted playsInline>
                    <source src="/videos/robot_tes2.mp4" type="video/mp4" />
                    Your browser does not support the video tag.
                </video>
            </div>

        </div>
    );
};

export default Welcome;