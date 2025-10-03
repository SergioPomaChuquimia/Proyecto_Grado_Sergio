import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000',
  withCredentials: true,
});

// Interceptor de Axios para agregar el token CSRF
api.interceptors.request.use((config) => {
  const token = document.cookie.split('; ').find(row => row.startsWith('XSRF-TOKEN='))?.split('=')[1];
  if (token) config.headers['X-XSRF-TOKEN'] = token;
  return config;
});

export default api;
