import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Signup from './pages/Signup';
import DashboardLayout from './components/layout/DashboardLayout';
import Dashboard from './pages/Dashboard';
import Subjects from './pages/Subjects';
import Pomodoro from './pages/Pomodoro';
import Notes from './pages/Notes';
import Goals from './pages/Goals';
import Leaderboard from './pages/Leaderboard';
import Settings from './pages/Settings';
import Analytics from './pages/Analytics';
import Feedback from './pages/Feedback';
import FeedbackDashboard from './pages/FeedbackDashboard';
import AIChat from './pages/AIChat';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen bg-[#030712] flex items-center justify-center">
      <div className="relative">
        <div className="w-20 h-20 border-4 border-blue-500/30 rounded-full animate-spin border-t-blue-500"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-blue-400 text-xs font-bold">LOADING</span>
        </div>
      </div>
    </div>
  );
  return user ? children : <Navigate to="/login" />;
}

function PublicRoute({ children }) {
  const { user } = useAuth();
  return user ? <Navigate to="/dashboard" /> : children;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            style: { background: '#0f172a', color: '#f8fafc', border: '1px solid rgba(255,255,255,0.1)' },
            success: { iconTheme: { primary: '#22d3ee', secondary: '#030712' } },
            error:   { iconTheme: { primary: '#f87171', secondary: '#030712' } },
          }}
        />
        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/login"  element={<PublicRoute><Login  /></PublicRoute>} />
          <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
          <Route path="/" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
            <Route path="dashboard"  element={<Dashboard  />} />
            <Route path="subjects"   element={<Subjects   />} />
            <Route path="analytics"  element={<Analytics  />} />
            <Route path="pomodoro"   element={<Pomodoro   />} />
            <Route path="notes"      element={<Notes      />} />
            <Route path="goals"      element={<Goals      />} />
            <Route path="leaderboard" element={<Leaderboard />} />
            <Route path="settings"   element={<Settings   />} />
            <Route path="feedback"   element={<Feedback   />} />
            <Route path="feedback-admin" element={<FeedbackDashboard />} />
            <Route path="ai-chat"   element={<AIChat />} />
          </Route>
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
