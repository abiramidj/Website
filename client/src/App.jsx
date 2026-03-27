import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth.jsx';
import Navbar from './components/Navbar.jsx';
import ProtectedRoute, { AdminRoute, SubscribedRoute } from './components/ProtectedRoute.jsx';

import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Quiz from './pages/Quiz.jsx';
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
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

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
