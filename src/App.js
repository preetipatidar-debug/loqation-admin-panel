import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import SignInPage from './pages/SignInPage';
import OverviewPage from './pages/OverviewPage';
//import LocationsTopPage from './pages/LocationsTopPage';
import LocationsTopListPage from "./pages/LocationsTopListPage";
import LocationsTopFormPage from "./pages/LocationsTopFormPage";
//import LocationsMainPage from './pages/LocationsMainPage';
import LocationsMainListPage from "./pages/LocationsMainListPage";
import LocationsMainFormPage from "./pages/LocationsMainFormPage";
//import LocationsSubPage from './pages/LocationsSubPage';
import LocationsSubListPage from "./pages/LocationsSubListPage";
import LocationsSubFormPage from "./pages/LocationsSubFormPage";
import LocationsGooglePage from './pages/LocationsGooglePage';
import GooglePlaceForm from './pages/GooglePlaceForm';
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
            <Route path="/locations-google" element={<LocationsGooglePage />} />
            <Route path="/google-places/new" element={<GooglePlaceForm />} />
            <Route path="/google-places/:id/edit" element={<GooglePlaceForm />} />
            <Route path="/locations-top" element={<LocationsTopListPage />} />
            <Route path="/locations-top/new" element={<LocationsTopFormPage />} />
            <Route path="/locations-top/:id/edit" element={<LocationsTopFormPage />} />
            {/* <Route path="/locations-top" element={<LocationsTopPage />} /> */}
            <Route path="/locations-main" element={<LocationsMainListPage />} />
            <Route path="/locations-main/new" element={<LocationsMainFormPage />} />
            <Route path="/locations-main/:id/edit" element={<LocationsMainFormPage />} />
            {/* <Route path="/locations-main" element={<LocationsMainPage />} /> */}
            <Route path="/locations-sub" element={<LocationsSubListPage />} />
            <Route path="/locations-sub/new" element={<LocationsSubFormPage />} />
            <Route path="/locations-sub/:id/edit" element={<LocationsSubFormPage />} />
            {/* <Route path="/locations-sub" element={<LocationsSubPage />} /> */}
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

 