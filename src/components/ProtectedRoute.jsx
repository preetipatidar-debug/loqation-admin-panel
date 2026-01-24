import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import MasterLayout from '../masterLayout/MasterLayout'; // Ensure path is correct

const ProtectedRoute = () => {
  const { user, loading } = useAuth();
  const token = localStorage.getItem('token');

  if (loading) return null;

  if (!user && !token) {
    return <Navigate to="/signin" replace />;
  }

  return (
    <MasterLayout>
      {/* Outlet renders the specific page (Overview, Users, etc.) inside the layout */}
      <Outlet />
    </MasterLayout>
  );
};

export default ProtectedRoute;