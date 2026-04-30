import React, { useState, useRef, useEffect } from 'react';
import { Mail, Lock, User, ShieldCheck, Users, BookOpen, Zap, Heart, Award, Briefcase, AlignLeft, Info, Sparkles, Map, Code, Cpu, ChevronDown, Check } from 'lucide-react';
import { registerUser, loginUser } from '../api/authService';
import { useNavigate } from 'react-router-dom';
import { useForm, useWatch } from 'react-hook-form';
import logo from '../assets/logo.png';
import './AuthForm.css';

const AuthForm = () => {
    const navigate = useNavigate();
    const [isSignUp, setIsSignUp] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const [loginErrorAPI, setLoginErrorAPI] = useState('');
    const [signUpErrorAPI, setSignUpErrorAPI] = useState('');

    const {
        register: registerLogin,
        handleSubmit: handleSubmitLogin,
        formState: { errors: loginErrors }
    } = useForm();

    const {
        register: registerSignUp,
        handleSubmit: handleSubmitSignUpForm,
        formState: { errors: signUpErrors },
        control
    } = useForm();

    const selectedRole = useWatch({ control, name: 'role' });
    const currentPassword = useWatch({ control, name: 'password' });

    // Student Tags State (Untouched)
    const [skills, setSkills] = useState([]);
    const [skillsInput, setSkillsInput] = useState('');
    const [interests, setInterests] = useState([]);
    const [interestsInput, setInterestsInput] = useState('');

    // --- NEW: Instructor Multi-Select State ---
    const [instructorSkills, setInstructorSkills] = useState([]);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Example predefined skills for the Instructor to choose from
    const availableInstructorSkills = ['Java', 'Spring', 'React', 'Node.js', 'Python', 'Machine Learning', 'UI/UX', 'Security', 'Database', 'Cloud Architecture', 'C++', 'Data Science'];

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleInstructorSkill = (skill) => {
        setInstructorSkills(prev =>
            prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
        );
    };

    const handleTagKeyDown = (e, type) => {
        const isSkills = type === 'skills';
        const inputVal = isSkills ? skillsInput : interestsInput;
        const setList = isSkills ? setSkills : setInterests;
        const list = isSkills ? skills : interests;

        if ((e.key === 'Enter' || e.key === ',') && inputVal.trim()) {
            e.preventDefault();
            setList([...list, inputVal.trim()]);
            isSkills ? setSkillsInput('') : setInterestsInput('');
        } else if (e.key === 'Backspace' && !inputVal) {
            setList(list.slice(0, -1));
        }
    };

    const removeTag = (index, type) => {
        if (type === 'skills') {
            setSkills(skills.filter((_, i) => i !== index));
        } else {
            setInterests(interests.filter((_, i) => i !== index));
        }
    };

    const onLoginSubmit = async (data) => {
        setLoginErrorAPI('');
        try {
            setIsLoading(true);
            const response = await loginUser({ email: data.loginEmail, password: data.loginPassword });
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('studentId', response.id);
            const userRole = response.accountType || response.role || (response.user && response.user.role);
            if (userRole) localStorage.setItem('userRole', userRole.toLowerCase());
            setIsLoading(false);
            if (userRole && userRole.toLowerCase() === 'instructor') {
                navigate('/instructor-home');
            } else {
                navigate('/home');
            }
        } catch (error) {
            setLoginErrorAPI(error.message);
            setIsLoading(false);
        }
    };

    const onSignUpSubmit = async (data) => {
        setSignUpErrorAPI('');

        // Build payload dynamically based on role
        const payload = {
            fullName: data.fullName,
            email: data.email,
            passwordHash: data.password,
            accountType: data.role.toUpperCase(),

            ...(data.role === 'student' && {
                major: data.major,
                skills: skills.join(', '),
                interests: interests.join(', ')
            }),

            ...(data.role === 'instructor' && {
                expertiseField: data.expertiseField,
                yearsOfExperience: Number(data.yearsOfExperience),
                bio: data.bio,
                skills: instructorSkills.join(', ') 
            })
        };

        try {
            setIsLoading(true);
            const response = await registerUser(payload);
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('userRole', data.role.toLowerCase());
            if (response && response.id) localStorage.setItem('studentId', response.id);
            localStorage.setItem('userName', 'Student');
            setTimeout(() => {
                if (data.role === 'student') navigate('/welcome');
                else if (data.role === 'instructor') navigate('/instructor-home');
            }, 800);
        } catch (error) {
            setSignUpErrorAPI(error.message);
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-layout">
            <div className="auth-left">
                <div className="bg-glow glow-blue"></div>
                <div className="bg-glow glow-orange"></div>

                <div className="floating-icon icon-1"><Sparkles size={20} color="#F59E0B" /></div>
                <div className="floating-icon icon-2"><Map size={20} color="#10B981" /></div>
                <div className="floating-icon icon-3"><Code size={20} color="#8B5CF6" /></div>
                <div className="floating-icon icon-4"><Cpu size={20} color="#EC4899" /></div>

                <div className="auth-left-content">
                    <div className="brand-logo">
                        <img src={logo} alt="Logo" className="auth-logo-image" />
                    </div>
                    <div className="badge">✨ AI-POWERED LEARNING</div>
                    <h1 className="hero-title">Your personalized<br /><span className="highlight">roadmap</span> to mastery</h1>
                    <p className="hero-subtitle">Stop guessing where to start. Let AI chart the perfect learning path for your career goals in tech.</p>
                    <ul className="feature-list">
                        <li>Personalized AI roadmaps for your field</li>
                        <li>Frontend, Backend & ML learning paths</li>
                        <li>Track progress with quizzes & milestones</li>
                    </ul>
                </div>
            </div>

            <div className="auth-right">
                <div className="form-container">
                    {!isSignUp ? (
                        <form className="auth-form" onSubmit={handleSubmitLogin(onLoginSubmit)} noValidate>
                            <h2 className="title">Welcome back :)</h2>
                            <p className="subtitle">Sign in to continue your learning journey</p>

                            <div className="input-group">
                                <label>EMAIL ADDRESS</label>
                                <div className="input-field">
                                    <Mail size={18} />
                                    <input type="email" placeholder="you@example.com" autoComplete="email"
                                        {...registerLogin("loginEmail", { required: "Email is required", pattern: { value: /^\S+@\S+$/i, message: "Invalid email" } })} />
                                </div>
                                {loginErrors.loginEmail && <span className="error-text">{loginErrors.loginEmail.message}</span>}
                            </div>

                            <div className="input-group">
                                <label>PASSWORD</label>
                                <div className="input-field">
                                    <Lock size={18} />
                                    <input type="password" placeholder="••••••••"
                                        {...registerLogin("loginPassword", { required: "Password is required" })} />
                                </div>
                                {loginErrors.loginPassword && <span className="error-text">{loginErrors.loginPassword.message}</span>}
                            </div>

                            {loginErrorAPI && <div className="error-text-api">{loginErrorAPI}</div>}

                            <button type="submit" className="btn solid" disabled={isLoading}>
                                {isLoading ? 'Signing In...' : 'Sign In'}
                            </button>

                            <p className="switch-text">Don't have an account? <span onClick={() => setIsSignUp(true)}>Sign up free</span></p>
                        </form>
                    ) : (
                        <form className="auth-form" onSubmit={handleSubmitSignUpForm(onSignUpSubmit)} noValidate>
                            <h2 className="title">Create your account</h2>
                            <p className="subtitle">Start your personalized learning journey today</p>

                            <div className="input-group">
                                <label>FULL NAME</label>
                                <div className="input-field">
                                    <User size={18} />
                                    <input type="text" placeholder="Your full name"
                                        {...registerSignUp("fullName", { required: "Full Name is required" })} />
                                </div>
                                {signUpErrors.fullName && <span className="error-text">{signUpErrors.fullName.message}</span>}
                            </div>

                            <div className="input-group">
                                <label>EMAIL ADDRESS</label>
                                <div className="input-field">
                                    <Mail size={18} />
                                    <input type="email" placeholder="you@example.com"
                                        {...registerSignUp("email", { required: "Email is required", pattern: { value: /^\S+@\S+$/i, message: "Invalid email" } })} />
                                </div>
                                {signUpErrors.email && <span className="error-text">{signUpErrors.email.message}</span>}
                            </div>

                            <div className="form-row">
                                <div className="input-group half">
                                    <label>PASSWORD</label>
                                    <div className="input-field">
                                        <Lock size={18} />
                                        <input type="password" placeholder="Min 8 chars"
                                            {...registerSignUp("password", { required: "Password is required", minLength: { value: 8, message: "Min 8 chars" } })} />
                                    </div>
                                    {signUpErrors.password && <span className="error-text">{signUpErrors.password.message}</span>}
                                </div>
                                <div className="input-group half">
                                    <label>CONFIRM</label>
                                    <div className="input-field">
                                        <ShieldCheck size={18} />
                                        <input type="password" placeholder="Repeat"
                                            {...registerSignUp("confirmPassword", { required: "Required", validate: value => value === currentPassword || "No match" })} />
                                    </div>
                                    {signUpErrors.confirmPassword && <span className="error-text">{signUpErrors.confirmPassword.message}</span>}
                                </div>
                            </div>

                            <div className="role-group">
                                <label><Users size={14} className="inline-icon" /> I AM A...</label>
                                <div className="role-cards">
                                    <label className={`role-card ${selectedRole === 'student' ? 'selected' : ''}`}>
                                        <input type="radio" value="student" {...registerSignUp("role", { required: "Please select a role" })} />
                                        <BookOpen size={24} />
                                        <span>Student</span>
                                    </label>
                                    <label className={`role-card ${selectedRole === 'instructor' ? 'selected' : ''}`}>
                                        <input type="radio" value="instructor" {...registerSignUp("role", { required: "Please select a role" })} />
                                        <Award size={24} />
                                        <span>Instructor</span>
                                    </label>
                                </div>
                                {signUpErrors.role && <span className="error-text">{signUpErrors.role.message}</span>}
                            </div>

                            {/* --- STUDENT SECTION --- */}
                            {selectedRole === 'student' && (
                                <div className="role-specific-container">
                                    <div className="input-group">
                                        <label>FIELD OF STUDY</label>
                                        <div className="input-field">
                                            <BookOpen size={18} />
                                            <input type="text" placeholder="e.g. Computer Science" {...registerSignUp("major", { required: "Major is required for students" })} />
                                        </div>
                                    </div>

                                    <div className="input-group">
                                        <label><Zap size={14} className="inline-icon" /> SKILLS</label>
                                        <div className="tags-wrapper" onClick={() => document.getElementById('skills-input').focus()}>
                                            {skills.map((skill, index) => (
                                                <span key={index} className="tag-item">{skill} <span className="tag-remove" onClick={(e) => { e.stopPropagation(); removeTag(index, 'skills'); }}>×</span></span>
                                            ))}
                                            <input className="tags-input" id="skills-input" value={skillsInput} onChange={(e) => setSkillsInput(e.target.value)} onKeyDown={(e) => handleTagKeyDown(e, 'skills')} placeholder="Type and Enter..." />
                                        </div>
                                    </div>

                                    <div className="input-group">
                                        <label><Heart size={14} className="inline-icon" /> INTERESTS</label>
                                        <div className="tags-wrapper" onClick={() => document.getElementById('interests-input').focus()}>
                                            {interests.map((interest, index) => (
                                                <span key={index} className="tag-item">{interest} <span className="tag-remove" onClick={(e) => { e.stopPropagation(); removeTag(index, 'interests'); }}>×</span></span>
                                            ))}
                                            <input className="tags-input" id="interests-input" value={interestsInput} onChange={(e) => setInterestsInput(e.target.value)} onKeyDown={(e) => handleTagKeyDown(e, 'interests')} placeholder="Type and Enter..." />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* --- INSTRUCTOR SECTION --- */}
                            {selectedRole === 'instructor' && (
                                <div className="role-specific-container">
                                    <div className="helper-note-instructor">
                                        <Info size={15} style={{ flexShrink: 0, marginTop: '1px' }} />
                                        <span>Your instructor account will be reviewed by an admin before activation.</span>
                                    </div>

                                    <div className="input-group">
                                        <label>EXPERTISE FIELD</label>
                                        <div className="input-field">
                                            <Award size={18} />
                                            <input type="text" placeholder="e.g. Machine Learning" {...registerSignUp("expertiseField", { required: "Expertise is required" })} />
                                        </div>
                                    </div>

                                    {/* NEW: INSTRUCTOR SKILLS MULTI-SELECT DROPDOWN */}
                                    <div className="input-group" ref={dropdownRef}>
                                        <label><Zap size={14} className="inline-icon" /> SKILLS</label>
                                        <div
                                            className={`multi-select-trigger ${isDropdownOpen ? 'active' : ''}`}
                                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                        >
                                            {instructorSkills.length === 0 ? (
                                                <span className="placeholder-text">Select your skills...</span>
                                            ) : (
                                                <div className="selected-chips">
                                                    {instructorSkills.map(skill => (
                                                        <span key={skill} className="chip">
                                                            {skill}
                                                            <span
                                                                className="chip-remove"
                                                                onClick={(e) => { e.stopPropagation(); toggleInstructorSkill(skill); }}
                                                            >×</span>
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                            <ChevronDown size={18} className="dropdown-arrow" />
                                        </div>

                                        {isDropdownOpen && (
                                            <div className="multi-select-dropdown">
                                                {availableInstructorSkills.map(skill => (
                                                    <div
                                                        key={skill}
                                                        className={`dropdown-item ${instructorSkills.includes(skill) ? 'selected' : ''}`}
                                                        onClick={() => toggleInstructorSkill(skill)}
                                                    >
                                                        <div className="checkbox-box">
                                                            {instructorSkills.includes(skill) && <Check size={12} strokeWidth={3} />}
                                                        </div>
                                                        {skill}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div className="input-group">
                                        <label>YEARS OF EXPERIENCE</label>
                                        <div className="input-field">
                                            <Briefcase size={18} />
                                            <input type="number" min="0" max="30" placeholder="e.g. 5" {...registerSignUp("yearsOfExperience", { required: "Years of experience is required" })} />
                                        </div>
                                    </div>
                                    <div className="input-group">
                                        <label>BIO</label>
                                        <div className="input-field textarea-field">
                                            <AlignLeft className="input-icon-textarea" size={18} />
                                            <textarea placeholder="Tell students about your background..." {...registerSignUp("bio", { required: "Bio is required" })}></textarea>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {signUpErrorAPI && <div className="error-text-api">{signUpErrorAPI}</div>}

                            <button type="submit" className="btn solid" disabled={isLoading}>
                                {isLoading ? 'Creating...' : 'Create Account →'}
                            </button>

                            <p className="switch-text">Already have an account? <span onClick={() => setIsSignUp(false)}>Sign in</span></p>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AuthForm;