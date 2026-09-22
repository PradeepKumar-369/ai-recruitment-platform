import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

/**
 * Gates a route behind login, and optionally behind a set of allowed roles.
 * Usage: <ProtectedRoute roles={['RECRUITER']}><RecruiterDashboard /></ProtectedRoute>
 */
export default function ProtectedRoute({ roles, children }) {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return null;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
