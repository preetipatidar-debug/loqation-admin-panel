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
  const initializedRef = useRef(false);

  const handleCallbackResponse = useCallback(
    async (response) => {
      if (!response?.credential) {
        toast.error('Google Sign-In failed.');
        return;
      }

      try {
        const success = await login(response.credential);

        if (success) {
          toast.success('Welcome back!');
          navigate('/dashboard');
        } else {
          toast.error('Sign-In failed. Please try again.');
        }
      } catch (error) {
        console.error('Sign-in error:', error);
        toast.error('An unexpected error occurred.');
      }
    },
    [login, navigate]
  );

  useEffect(() => {
    let attempts = 0;
    const maxAttempts = 10;

    const renderButton = () => {
      try {
        if (!window.google || !signInDivRef.current) {
          if (attempts++ < maxAttempts) {
            setTimeout(renderButton, 250);
          } else {
            toast.error('Google Sign-In failed to load.');
          }
          return;
        }

        if (initializedRef.current) return;

        const width = signInDivRef.current.getBoundingClientRect().width;
        if (width === 0) {
          requestAnimationFrame(renderButton);
          return;
        }

        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleCallbackResponse,
        });

        window.google.accounts.id.renderButton(signInDivRef.current, {
          theme: 'outline',
          size: 'large',
          width,
          text: 'signin_with',
          shape: 'rectangular',
        });

        initializedRef.current = true;
      } catch (error) {
        console.error('Google Sign-In render error:', error);
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
