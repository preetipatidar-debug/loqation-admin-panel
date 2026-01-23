import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import SignInPage from './pages/SignInPage';
import OverviewPage from './pages/OverviewPage';
import LocationsTopPage from './pages/LocationsTopPage';
import LocationsMainPage from './pages/LocationsMainPage';
import LocationsSubPage from './pages/LocationsSubPage';
import UsersPage from './pages/UsersPage';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Logic to decide which routes to show
const AppRoutes = () => {
  const { user, loading } = useAuth();

  if (loading) return null;

  return (
    <Routes>
      {/* 1. Public Route: If logged in, this UNMOUNTS and redirects to / */}
      <Route 
        path="/signin" 
        element={!user ? <SignInPage /> : <Navigate to="/" replace />} 
      />

      {/* 2. Protected Routes: All wrapped in ProtectedRoute for consistent layout */}
      <Route path="/" element={<ProtectedRoute><OverviewPage /></ProtectedRoute>} />
      <Route path="/locations-top" element={<ProtectedRoute><LocationsTopPage /></ProtectedRoute>} />
      <Route path="/locations-main" element={<ProtectedRoute><LocationsMainPage /></ProtectedRoute>} />
      <Route path="/locations-sub" element={<ProtectedRoute><LocationsSubPage /></ProtectedRoute>} />
      <Route path="/users" element={<ProtectedRoute><UsersPage /></ProtectedRoute>} />

      {/* 3. Fallback */}
      <Route path="*" element={<Navigate to={user ? "/" : "/signin"} replace />} />
    </Routes>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <ToastContainer theme="colored" position="top-right" />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;