import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:3001/api',
});

// Add token to requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

// Handle errors and redirects
api.interceptors.response.use(
    (response) => response,
    (error) => {
      // 1. Check if we are currently trying to log in
      const isLoginPath = error.config.url.includes('/auth/google-signin');
  
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        // 2. Only redirect if it's NOT a login attempt and NOT already on signin
        if (!isLoginPath && window.location.pathname !== '/signin') {
          localStorage.clear();
          window.location.href = '/signin';
        }
      }
      return Promise.reject(error);
    }
  );

export default api;