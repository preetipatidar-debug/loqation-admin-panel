import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3001/api',
});

// Attach token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth failures
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLoginRequest =
      error.config?.url?.includes('/auth/google-signin');
      console.log(error.response);
    if (
      error.response &&
      (error.response.status === 401 ||
        error.response.status === 403)
    ) {
      if (!isLoginRequest && window.location.pathname !== '/signin') {
        localStorage.clear();
        window.location.href = '/signin';
      }
    }

    return Promise.reject(error);
  }
);

export default api;
