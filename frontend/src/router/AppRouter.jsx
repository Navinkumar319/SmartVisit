import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import MainLayout from '../layouts/MainLayout';

// Import Pages
import Login from '../pages/Login';
import Dashboard from '../pages/Dashboard';
import RegisterVisitor from '../pages/RegisterVisitor';
import VisitorList from '../pages/VisitorList';
import EditVisitor from '../pages/EditVisitor';
import VisitorDetails from '../pages/VisitorDetails';
import SecurityDesk from '../pages/SecurityDesk';
import Reports from '../pages/Reports';
import UserManagement from '../pages/UserManagement';
import SettingsPage from '../pages/SettingsPage';

// Route Guard Component to protect routes based on login and roles
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, logout } = useAuth();

  if (!user) {
    // Redirect to login if unauthenticated
    return <Navigate to="/login" replace />;
  }

  if (user.role !== 'ROLE_ADMIN' && user.role !== 'ROLE_RECEPTION' && user.role !== 'ROLE_SECURITY') {
    // If user has an outdated/unsupported role, log them out and go to login
    logout();
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // If authenticated but role not allowed, redirect to default page for their role
    return <Navigate to={user.role === 'ROLE_ADMIN' ? '/dashboard' : '/visitors'} replace />;
  }

  return <MainLayout>{children}</MainLayout>;
};

const AppRouter = () => {
  const { user, logout } = useAuth();

  // Auto-logout if a user with an invalid role is loaded
  React.useEffect(() => {
    if (user && user.role !== 'ROLE_ADMIN' && user.role !== 'ROLE_RECEPTION' && user.role !== 'ROLE_SECURITY') {
      logout();
    }
  }, [user, logout]);

  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/login"
        element={user && (user.role === 'ROLE_ADMIN' || user.role === 'ROLE_RECEPTION' || user.role === 'ROLE_SECURITY') ? <Navigate to={user.role === 'ROLE_ADMIN' ? '/dashboard' : '/visitors'} replace /> : <Login />}
      />
      <Route
        path="/signup"
        element={<Navigate to="/login" replace />}
      />

      {/* Protected Routes - ADMIN only */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute allowedRoles={['ROLE_ADMIN']}>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports"
        element={
          <ProtectedRoute allowedRoles={['ROLE_ADMIN']}>
            <Reports />
          </ProtectedRoute>
        }
      />
      <Route
        path="/users"
        element={
          <ProtectedRoute allowedRoles={['ROLE_ADMIN']}>
            <UserManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute allowedRoles={['ROLE_ADMIN']}>
            <SettingsPage />
          </ProtectedRoute>
        }
      />

      {/* Protected Routes - Reception only */}
      <Route
        path="/register-visitor"
        element={
          <ProtectedRoute allowedRoles={['ROLE_RECEPTION']}>
            <RegisterVisitor />
          </ProtectedRoute>
        }
      />
      <Route
        path="/visitors/edit/:id"
        element={
          <ProtectedRoute allowedRoles={['ROLE_RECEPTION']}>
            <EditVisitor />
          </ProtectedRoute>
        }
      />


      {/* Protected Routes - Security & Admin */}
      <Route
        path="/security-desk"
        element={
          <ProtectedRoute allowedRoles={['ROLE_SECURITY', 'ROLE_ADMIN']}>
            <SecurityDesk />
          </ProtectedRoute>
        }
      />

      {/* Protected Routes - Shared by Admin, Reception, and Security */}
      <Route
        path="/visitors"
        element={
          <ProtectedRoute allowedRoles={['ROLE_ADMIN', 'ROLE_RECEPTION', 'ROLE_SECURITY']}>
            <VisitorList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/visitors/:id"
        element={
          <ProtectedRoute allowedRoles={['ROLE_ADMIN', 'ROLE_RECEPTION', 'ROLE_SECURITY']}>
            <VisitorDetails />
          </ProtectedRoute>
        }
      />

      {/* Fallback routes */}
      <Route
        path="*"
        element={<Navigate to={user && (user.role === 'ROLE_ADMIN' || user.role === 'ROLE_RECEPTION' || user.role === 'ROLE_SECURITY') ? (user.role === 'ROLE_ADMIN' ? '/dashboard' : '/visitors') : '/login'} replace />}
      />
    </Routes>
  );
};

export default AppRouter;
