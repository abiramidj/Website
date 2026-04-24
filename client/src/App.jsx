import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useEffect, useState, useCallback } from 'react';
import { useAuth } from './hooks/useAuth.jsx';
import { useSessionTimeout } from './hooks/useSessionTimeout.js';
import Navbar from './components/Navbar.jsx';
import ProtectedRoute, { AdminRoute, SubscribedRoute } from './components/ProtectedRoute.jsx';
import SessionTimeoutModal from './components/SessionTimeoutModal.jsx';

const IDLE_MS   = 5 * 60 * 1000; // 5 minutes of inactivity
const WARN_SECS = 60;              // 60-second countdown before sign-out

function SessionTimeoutManager() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [showWarning, setShowWarning] = useState(false);
  const [countdown, setCountdown]     = useState(WARN_SECS);

  const handleTimeout = useCallback(async () => {
    setShowWarning(false);
    await signOut();
    navigate('/login', { replace: true, state: { sessionExpired: true } });
  }, [signOut, navigate]);

  const handleWarn = useCallback(() => {
    setShowWarning(true);
    setCountdown(WARN_SECS);
  }, []);

  const handleCountdown = useCallback((secs) => {
    setCountdown(secs);
  }, []);

  const { continueSession } = useSessionTimeout({
    enabled:     !!user,
    idleMs:      IDLE_MS,
    warnSecs:    WARN_SECS,
    onWarn:      handleWarn,
    onCountdown: handleCountdown,
    onTimeout:   handleTimeout,
  });

  const handleContinue = useCallback(() => {
    setShowWarning(false);
    setCountdown(WARN_SECS);
    continueSession();
  }, [continueSession]);

  if (!showWarning) return null;
  return (
    <SessionTimeoutModal
      countdown={countdown}
      onContinue={handleContinue}
      onSignOut={handleTimeout}
    />
  );
}

import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import ForgotPassword from './pages/ForgotPassword.jsx';
import ResetPassword from './pages/ResetPassword.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Quiz from './pages/Quiz.jsx';
import QuizLearn from './pages/QuizLearn.jsx';
import QuizTest from './pages/QuizTest.jsx';
import Results from './pages/Results.jsx';
import Subscribe from './pages/Subscribe.jsx';
import SubscribeSuccess from './pages/SubscribeSuccess.jsx';
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import Generate from './pages/admin/Generate.jsx';
import ReviewQueue from './pages/admin/ReviewQueue.jsx';
import ImportQuestions from './pages/admin/ImportQuestions.jsx';
import Chapters from './pages/Chapters.jsx';
import ChapterDetail from './pages/ChapterDetail.jsx';
import ManageChapters from './pages/admin/ManageChapters.jsx';
import Topics from './pages/Topics.jsx';
import History from './pages/History.jsx';

function ServerDownHandler() {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  useEffect(() => {
    async function handleServerDown() {
      await signOut();
      navigate('/login', { replace: true });
    }
    window.addEventListener('server-unavailable', handleServerDown);
    return () => window.removeEventListener('server-unavailable', handleServerDown);
  }, [navigate, signOut]);

  return null;
}

function RootRedirect() {
  const { user, isAdmin, loading } = useAuth();
  if (loading) return <div className="page-loading">Loading…</div>;
  if (user && isAdmin) return <Navigate to="/admin" replace />;
  if (user) return <Navigate to="/dashboard" replace />;
  return <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <ServerDownHandler />
      <SessionTimeoutManager />
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Always accessible to logged-in users */}
          <Route path="/dashboard" element={
            <ProtectedRoute><Dashboard /></ProtectedRoute>
          } />
          <Route path="/subscribe" element={
            <ProtectedRoute><Subscribe /></ProtectedRoute>
          } />
          <Route path="/subscribe/success" element={
            <ProtectedRoute><SubscribeSuccess /></ProtectedRoute>
          } />

          {/* Subscription-gated */}
          <Route path="/topics" element={
            <SubscribedRoute><Topics /></SubscribedRoute>
          } />
          <Route path="/history" element={
            <SubscribedRoute><History /></SubscribedRoute>
          } />
          <Route path="/quiz/:topic/learn" element={
            <SubscribedRoute><QuizLearn /></SubscribedRoute>
          } />
          <Route path="/quiz/:topic/test" element={
            <SubscribedRoute><QuizTest /></SubscribedRoute>
          } />
          <Route path="/quiz/:topic" element={
            <SubscribedRoute><Quiz /></SubscribedRoute>
          } />
          <Route path="/results/:attemptId" element={
            <SubscribedRoute><Results /></SubscribedRoute>
          } />
          <Route path="/library" element={
            <SubscribedRoute><Chapters /></SubscribedRoute>
          } />
          <Route path="/library/:slug" element={
            <SubscribedRoute><ChapterDetail /></SubscribedRoute>
          } />

          {/* Admin-only */}
          <Route path="/admin" element={
            <AdminRoute><AdminDashboard /></AdminRoute>
          } />
          <Route path="/admin/generate" element={
            <AdminRoute><Generate /></AdminRoute>
          } />
          <Route path="/admin/review" element={
            <AdminRoute><ReviewQueue /></AdminRoute>
          } />
          <Route path="/admin/import" element={
            <AdminRoute><ImportQuestions /></AdminRoute>
          } />
          <Route path="/admin/chapters" element={
            <AdminRoute><ManageChapters /></AdminRoute>
          } />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}
