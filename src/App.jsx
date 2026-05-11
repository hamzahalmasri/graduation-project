import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AuthForm from './components/AuthForm';
import SplashScreen from './components/SplashScreen';
import Welcome from './components/Welcome';
import StudentHomePage from './components/StudentHomePage';
import QuizDashboard from './components/QuizDashboard';
import TakeQuiz from './components/TakeQuiz';
import AiChatbot from './components/AiChatbot';
import RoadmapsList from './components/RoadmapsList';
import RoadmapDetail from './components/RoadmapDetail';
import StudentInstructorChat from './components/StudentInstructorChat';
import InstructorsList from './components/InstructorsList';
import InstructorDashboard from './components/InstructorDashboard';
import InstructorStudentChat from './components/InstructorStudentChat';


const ProtectedRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem('isLoggedIn') === 'true';

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  return children;
};

function App() {

  const [showSplash, setShowSplash] = useState(true);

  return (
    <Router>
      <div className="App">

        {showSplash ? (
          <SplashScreen onComplete={() => setShowSplash(false)} />
        ) : null}

        <Routes>

          <Route path="/" element={<AuthForm />} />

          <Route path="/welcome" element={<ProtectedRoute> <Welcome /> </ProtectedRoute>} />

          <Route path="/home" element={<ProtectedRoute> <StudentHomePage /> </ProtectedRoute>} />

          <Route path="/quizzes" element={<ProtectedRoute> <QuizDashboard /> </ProtectedRoute>} />

          <Route path="/take-quiz/:quizId" element={<ProtectedRoute> <TakeQuiz /> </ProtectedRoute>} />

          <Route path="/chat" element={<ProtectedRoute> <AiChatbot /> </ProtectedRoute>} />

          <Route path="/roadmaps" element={<ProtectedRoute> <RoadmapsList /> </ProtectedRoute>} />

          <Route path="/roadmap/:roadmapId" element={<ProtectedRoute> <RoadmapDetail /> </ProtectedRoute>} />

          <Route path="/instructor-chat" element={<ProtectedRoute> <StudentInstructorChat /> </ProtectedRoute>} />

          <Route path="/instructors" element={<ProtectedRoute> <InstructorsList /> </ProtectedRoute>} />

          <Route path="/instructor-home" element={<ProtectedRoute> <InstructorDashboard /> </ProtectedRoute>} />

          <Route path="/messages" element={<ProtectedRoute> <InstructorStudentChat /> </ProtectedRoute>} />

        </Routes>
      </div>
    </Router>
  );
}

export default App;