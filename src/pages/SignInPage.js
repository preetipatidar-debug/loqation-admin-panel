import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import '../custom.css';

const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;

const SignInPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const signInDivRef = useRef(null);

  const handleCallbackResponse = async (response) => {
    if (!response.credential) return;

    try {
      const success = await login(response.credential);
      if (success) {
        toast.success('Welcome back!');
        navigate('/dashboard');
      }
    } catch {
      toast.error('Sign-In failed. Please try again.');
    }
  };

  useEffect(() => {
    if (!window.google || !GOOGLE_CLIENT_ID) return;

    const renderButtonSafely = () => {
      const el = signInDivRef.current;
      if (!el) return;

      const width = el.getBoundingClientRect().width;
      if (width === 0) {
        // layout not ready yet
        requestAnimationFrame(renderButtonSafely);
        return;
      }

      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleCallbackResponse,
      });

      window.google.accounts.id.renderButton(el, {
        theme: 'outline',
        size: 'large',
        width: width,
        text: 'signin_with',
        shape: 'rectangular',
      });
    };

    requestAnimationFrame(renderButtonSafely);
  }, []);

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