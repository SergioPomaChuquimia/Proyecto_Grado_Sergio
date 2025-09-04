import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000',
  withCredentials: true,
});

// Interceptor de Axios para agregar el token CSRF en las solicitudes
api.interceptors.request.use((config) => {
  const token = document.cookie
    .split('; ')
    .find(row => row.startsWith('XSRF-TOKEN='))?.split('=')[1];  // Obtener el token de la cookie

  if (token) {
    config.headers['X-XSRF-TOKEN'] = token;  // Agregar el token CSRF a los encabezados
  }
  return config;
});

export default api;
