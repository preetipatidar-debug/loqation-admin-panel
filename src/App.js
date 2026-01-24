import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import SignInPage from './pages/SignInPage';
import OverviewPage from './pages/OverviewPage';
import LocationsTopPage from './pages/LocationsTopPage';
import LocationsMainPage from './pages/LocationsMainPage';
import LocationsSubPage from './pages/LocationsSubPage';
import UsersPage from './pages/UsersPage';
import { ToastContainer } from 'react-toastify';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Route */}
          <Route path="/signin" element={<SignInPage />} />

          {/* Protected Routes Wrapper */}
          <Route element={<ProtectedRoute />}>
            {/* These routes will render inside the <Outlet /> of ProtectedRoute */}
            <Route path="/" element={<OverviewPage />} />
            <Route path="/locations-top" element={<LocationsTopPage />} />
            <Route path="/locations-main" element={<LocationsMainPage />} />
            <Route path="/locations-sub" element={<LocationsSubPage />} />
            <Route path="/users" element={<UsersPage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <ToastContainer theme="colored" />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;