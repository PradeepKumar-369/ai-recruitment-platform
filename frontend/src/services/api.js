import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Automatically attach JWT token if present
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token expiry and auto-refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 Unauthorized, and we haven't already retried this request
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refresh');

      if (refreshToken) {
        try {
          // Attempt to refresh the token
          const res = await axios.post(`${API_BASE_URL}auth/refresh/`, {
            refresh: refreshToken
          });

          // Save the new access token
          localStorage.setItem('access', res.data.access);

          // If the backend also returns a new refresh token, save it
          if (res.data.refresh) {
            localStorage.setItem('refresh', res.data.refresh);
          }

          // Update the authorization header for the original request and retry
          originalRequest.headers.Authorization = `Bearer ${res.data.access}`;
          return api(originalRequest);
        } catch (refreshError) {
          // Refresh token has expired or is invalid, force logout
          localStorage.removeItem('access');
          localStorage.removeItem('refresh');
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
          return Promise.reject(refreshError);
        }
      } else {
        // No refresh token available, force clear
        localStorage.removeItem('access');
        localStorage.removeItem('refresh');
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;