import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { authStore } from './store/authStore';
import { authApi } from './api/auth.api';
import Navbar from './components/layout/Navbar';
import { ToastProvider } from './components/common/Toast';

// Public pages
import Landing from './pages/public/Landing';
import Login from './pages/public/Login';
import Register from './pages/public/Register';
import NotFound from './pages/public/NotFound';

// User pages
import UserDashboard from './pages/user/Dashboard';
import BookHall from './pages/user/BookHall';
import MyBookings from './pages/user/MyBookings';
import BookingDetails from './pages/user/BookingDetails';
import Profile from './pages/user/Profile';
import HallAvailability from './pages/user/HallAvailability';
import CheckInOut from './pages/user/CheckInOut';
import Feedback from './pages/user/Feedback';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageBookings from './pages/admin/ManageBookings';
import ManageHalls from './pages/admin/ManageHalls';
import ManageInstitutes from './pages/admin/ManageInstitutes';
import ManageDepartments from './pages/admin/ManageDepartments';
import ManageUsers from './pages/admin/ManageUsers';
import ViewCheckInOut from './pages/admin/ViewCheckInOut';
import ViewFeedback from './pages/admin/ViewFeedback';
import Reports from './pages/admin/Reports';

function ProtectedRoute({ children, adminOnly = false }) {
  const isAuthed = authStore.isAuthenticated();
  const isAdmin = authStore.isAdmin();

  if (!isAuthed) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

function PublicRoute({ children }) {
  return authStore.isAuthenticated() ? <Navigate to="/dashboard" replace /> : children;
}

function AppContent() {
  const location = useLocation();
  const isAuthPage = ['/login', '/register', '/'].includes(location.pathname);
  const isAuthed = authStore.isAuthenticated();

  return (
    <div className="app">
      {isAuthed && !isAuthPage && <Navbar />}
      <main className={!isAuthed || isAuthPage ? 'auth-page-wrapper' : ''}>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<PublicRoute><Landing /></PublicRoute>} />
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

          {/* User routes */}
          <Route path="/dashboard" element={<ProtectedRoute><UserDashboard /></ProtectedRoute>} />
          <Route path="/book" element={<ProtectedRoute><BookHall /></ProtectedRoute>} />
          <Route path="/availability/:hallId" element={<ProtectedRoute><HallAvailability /></ProtectedRoute>} />
          <Route path="/bookings" element={<ProtectedRoute><MyBookings /></ProtectedRoute>} />
          <Route path="/bookings/:id" element={<ProtectedRoute><BookingDetails /></ProtectedRoute>} />
          <Route path="/checkin/:id" element={<ProtectedRoute><CheckInOut /></ProtectedRoute>} />
          <Route path="/feedback/:id" element={<ProtectedRoute><Feedback /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

          {/* Admin routes */}
          <Route path="/admin" element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/bookings" element={<ProtectedRoute adminOnly><ManageBookings /></ProtectedRoute>} />
          <Route path="/admin/halls" element={<ProtectedRoute adminOnly><ManageHalls /></ProtectedRoute>} />
          <Route path="/admin/institutes" element={<ProtectedRoute adminOnly><ManageInstitutes /></ProtectedRoute>} />
          <Route path="/admin/departments" element={<ProtectedRoute adminOnly><ManageDepartments /></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute adminOnly><ManageUsers /></ProtectedRoute>} />
          <Route path="/admin/checkins" element={<ProtectedRoute adminOnly><ViewCheckInOut /></ProtectedRoute>} />
          <Route path="/admin/feedback" element={<ProtectedRoute adminOnly><ViewFeedback /></ProtectedRoute>} />
          <Route path="/admin/reports" element={<ProtectedRoute adminOnly><Reports /></ProtectedRoute>} />

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <Router>
        <AppContent />
      </Router>
    </ToastProvider>
  );
}
