import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL;

console.log('=== AXIOS CONFIG ===');
console.log('Environment:', process.env.NODE_ENV);
console.log('API URL from env:', process.env.REACT_APP_API_URL);
console.log('Final API Base URL:', API_URL);

const api = axios.create({
  baseURL: API_URL,
  timeout: 1000000,
});

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

api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
