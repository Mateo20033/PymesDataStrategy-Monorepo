import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3001/api',
  timeout: 15000,
});

// Adjunta el JWT a cada petición
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('pymes_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Si el servidor devuelve 401, forzar logout
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('pymes_token');
      localStorage.removeItem('pymes_user');
      window.location.href = '/login';
      return; // no propagar el error — ya redirigimos
    }
    return Promise.reject(error);
  }
);

export default api;
