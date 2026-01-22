import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Page Imports
import SignInPage from './pages/SignInPage';
import OverviewPage from './pages/OverviewPage'; // New Dashboard Home
import LocationsTopPage from './pages/LocationsTopPage';
import LocationsMainPage from './pages/LocationsMainPage';
import LocationsSubPage from './pages/LocationsSubPage';

// Toast Notifications
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  return (
    <BrowserRouter>
      {/* 1. Global Auth Context to track login state across all components */}
      <AuthProvider>
        <Routes>
          {/* 2. Public Route: Google Sign-In */}
          <Route path="/signin" element={<SignInPage />} />

          {/* 3. Protected Routes: Locked behind Google Auth */}
          {/* Dashboard Home */}
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <OverviewPage />
              </ProtectedRoute>
            } 
          />

          {/* Top Areas (Drawing Tools) */}
          <Route 
            path="/locations-top" 
            element={
              <ProtectedRoute>
                <LocationsTopPage />
              </ProtectedRoute>
            } 
          />

          {/* Business Profiles (Main Locations) */}
          <Route 
            path="/locations-main" 
            element={
              <ProtectedRoute>
                <LocationsMainPage />
              </ProtectedRoute>
            } 
          />

          {/* Units & ATMs (Radius Discovery) */}
          <Route 
            path="/locations-sub" 
            element={
              <ProtectedRoute>
                <LocationsSubPage />
              </ProtectedRoute>
            } 
          />

          {/* 4. Fallback: If route not found, send to Dashboard Home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        {/* Global Toast Container for Success/Error Alerts */}
        <ToastContainer 
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="colored"
        />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;