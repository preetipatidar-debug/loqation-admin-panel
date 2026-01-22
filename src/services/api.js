import axios from 'axios';

// 1. Determine the Base URL dynamically
// Locally, hostname is 'localhost'. In production, it's your Google Cloud URL.
const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

const api = axios.create({
    // If local, point to port 3001. If production, use relative path '/api'.
    baseURL: isLocal ? 'http://localhost:3001/api' : '/api',
});

// REQUEST INTERCEPTOR: Automatically adds the token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// RESPONSE INTERCEPTOR: Handles session expiration
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Handle 401 (Unauthorized) or 403 (Forbidden)
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
            console.warn("Session expired or invalid. Logging out...");
            
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            
            // Avoid redirect loops if already on signin page
            if (window.location.pathname !== '/signin') {
                window.location.href = '/signin';
            }
        }
        return Promise.reject(error);
    }
);

export default api;