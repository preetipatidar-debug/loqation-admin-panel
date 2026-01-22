import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../services/api'; 
import { useAuth } from '../context/AuthContext'; 
import '../custom.css';

const SignInPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;

  const handleCallbackResponse = async (response) => {
    try {
      const res = await api.post('/auth/google-signin', {
        credential: response.credential
      });

      if (res.data.success) {
        login(res.data.user, res.data.token);
        toast.success(`Welcome back!`);
        navigate('/dashboard');
      }
    } catch (err) {
      console.error("Google Auth Error:", err.response?.data || err.message);
      toast.error("Google Sign-In failed.");
    }
  };

  useEffect(() => {
    /* global google */
    if (window.google && GOOGLE_CLIENT_ID) {
      google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleCallbackResponse,
      });

      google.accounts.id.renderButton(
        document.getElementById("signInDiv"),
        { 
            theme: "outline", 
            size: "large", 
            width: "100%", // This makes it fill the container
            text: "signin_with",
            shape: "rectangular"
        }
      );
    }
  }, [GOOGLE_CLIENT_ID]);

  return (
    <div className="signin-page-wrapper" style={{ 
        height: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: '#f8f9fa' // Light grey background
    }}>
      <div className="card shadow-lg border-0" style={{ 
          width: '100%', 
          maxWidth: '400px', 
          borderRadius: '15px',
          padding: '2rem'
      }}>
        <div className="card-body text-center">
          {/* Your Logo or Icon could go here */}
          <h2 className="fw-bold mb-2">Loqation</h2>
          <p className="text-muted mb-4">Please sign in to continue</p>

          <div className="d-grid gap-2">
            {/* This is where the Google Button renders */}
            <div id="signInDiv" style={{ display: 'flex', justifyContent: 'center' }}></div>
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