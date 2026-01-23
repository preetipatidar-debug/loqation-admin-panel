import React from 'react';

import { useAuth } from '../context/AuthContext';
import MasterLayout from '../masterLayout/MasterLayout';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const token = localStorage.getItem('token');

  if (loading) return null; // Wait for the AuthContext to initialize

  // If there's no user in state and no token in storage, kick them to sign-in
  if (!user && !token) {
    return <Navigate to="/signin" replace />;
  }

  // KEY FIX: This is the ONLY place MasterLayout should be called
  return <MasterLayout>{children}</MasterLayout>;
};

export default ProtectedRoute;