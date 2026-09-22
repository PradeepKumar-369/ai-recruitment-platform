import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';
import { ToastProvider } from './context/ToastContext';
import Register from './pages/Register';
import Login from './pages/Login';
import JobDashboard from './pages/JobDashboard';
import JobDetail from './pages/JobDetail';
import Profile from './pages/Profile';
import RecruiterDashboard from './pages/RecruiterDashboard';
import MyApplications from './pages/MyApplications';
import PostJob from './pages/PostJob';

function App() {
  return (
    <ToastProvider>
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        {/* Navigation Bar */}
        <Navbar />

        {/* Main Content Area */}
        <main style={{ flex: 1 }}>
          <Routes>
            <Route path="/" element={<JobDashboard />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/jobs/:id" element={<JobDetail />} />
            <Route
              path="/profile"
              element={
                <ProtectedRoute roles={['JOB_SEEKER']}>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/recruiter-dashboard"
              element={
                <ProtectedRoute roles={['RECRUITER']}>
                  <RecruiterDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/applications"
              element={
                <ProtectedRoute roles={['JOB_SEEKER']}>
                  <MyApplications />
                </ProtectedRoute>
              }
            />
            <Route
              path="/post-job"
              element={
                <ProtectedRoute roles={['RECRUITER']}>
                  <PostJob />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<div style={{ padding: 40, textAlign: 'center' }}>Page not found.</div>} />
          </Routes>
        </main>
      </div>
    </ToastProvider>
  );
}

export default App;