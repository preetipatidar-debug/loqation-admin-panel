import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
    const { user, token } = useAuth();
    const location = useLocation();

    // If no user or token exists, redirect to signin
    if (!user || !token) {
        // We save the 'from' location so we can redirect them back after login
        return <Navigate to="/signin" state={{ from: location }} replace />;
    }

    // If they are logged in, show the requested page
    return children;
};

export default ProtectedRoute;