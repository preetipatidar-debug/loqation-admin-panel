import React, { useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import '../custom.css';


const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;

const SignInPage = () => {
 const { login } = useAuth();
 const navigate = useNavigate();
 const signInDivRef = useRef(null);


 const handleCallbackResponse = useCallback(async (response) => {
   if (!response.credential) return;


   try {
     const success = await login(response.credential);
     if (success) {
       toast.success('Welcome back!');
       navigate('/dashboard');
     } else {
       toast.error('Sign-In failed. Please check your credentials and try again.');
     }
   } catch (error) {
     console.error('Sign-in error:', error);
     toast.error('An unexpected error occurred during sign-in.');
   }
 }, [login, navigate]);


 useEffect(() => {
   let attempts = 0;
   const maxAttempts = 10; // Try for ~2.5 seconds


   const renderButton = () => {
     try {
       if (window.google && signInDivRef.current) {
         if (signInDivRef.current.childElementCount > 0) {
           return;
         }


         const width = signInDivRef.current.getBoundingClientRect().width;
         if (width > 0) {
           window.google.accounts.id.initialize({
             client_id: GOOGLE_CLIENT_ID,
             callback: handleCallbackResponse,
           });
           window.google.accounts.id.renderButton(signInDivRef.current, {
             theme: 'outline',
             size: 'large',
             width: width,
             text: 'signin_with',
             shape: 'rectangular',
           });
         } else {
           requestAnimationFrame(renderButton);
         }
       } else if (attempts < maxAttempts) {
         attempts++;
         setTimeout(renderButton, 250);
       } else {
         console.error("Failed to load Google Sign-In button after multiple attempts.");
         toast.error("Could not load Google Sign-In. Please check your connection and try refreshing the page.");
       }
     } catch (error) {
       console.error("Error rendering Google Sign-In button:", error);
     }
   };


   renderButton();


 }, [handleCallbackResponse]);


  return (
    <div
      className="signin-page-wrapper"
      style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f8f9fa',
      }}
    >
      <div
        className="card shadow-lg border-0"
        style={{
          width: '100%',
          maxWidth: '400px',
          borderRadius: '15px',
          padding: '2rem',
        }}
      >
        <div className="card-body text-center">
          <h2 className="fw-bold mb-2">Loqation</h2>
          <p className="text-muted mb-4">Please sign in to continue</p>

          {/* 🔑 FIX: force real width */}
          <div style={{ width: '100%', minHeight: '44px' }}>
            <div
              ref={signInDivRef}
              style={{
                width: '100%',
                display: 'flex',
                justifyContent: 'center',
              }}
            />
          </div>

          <div className="mt-4">
            <small className="text-muted">
              By continuing, you agree to our Terms and Conditions.
            </small>
          </div>
        </div>
      </div>
    </div>
  );
};


export default SignInPage;



