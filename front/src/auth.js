// src/auth.js
import api from './api';

// Log para verificar si la función se ejecuta
export async function getCsrf() {
  console.log("Solicitando CSRF cookie...");
  try {
    const response = await api.get('/sanctum/csrf-cookie');
    console.log("CSRF cookie recibida:", response);
  } catch (error) {
    console.error("Error al obtener CSRF cookie:", error);
  }
}

export async function login(email, password) {
  console.log("Intentando iniciar sesión con:", email, password);
  await getCsrf();
  try {
    const response = await api.post('/api/login', { email, password });

    // Log para verificar las cookies del navegador
    console.log('Cookies del navegador:', document.cookie);  // Verifica que las cookies como laravel_session y XSRF-TOKEN estén presentes
    
    // Log para verificar la respuesta del login
    console.log('Respuesta de login:', response.data);
    console.log('Status de la respuesta:', response.status);

    return response;
  } catch (error) {
    console.error("Error en login:", error.response);
    throw error;
  }
}

export async function register(name, email, password, password_confirmation) {
  console.log("Intentando registrarse con:", name, email);
  await getCsrf();
  try {
    const response = await api.post('/api/register', { name, email, password, password_confirmation });
    console.log("Respuesta del registro:", response);
    return response;
  } catch (error) {
    console.error("Error en registro:", error);
    throw error;
  }
}

export async function logout() {
  console.log("Cerrando sesión...");

  try {
    await api.post('/api/logout', {}, { withCredentials: true }); // <-- Asegúrate de enviar cookies
    console.log("Sesión cerrada");
  } catch (error) {
    console.error("Error al cerrar sesión:", error);
  }
}


export async function fetchUser() {
 try {
    const response = await api.get('/api/user', {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    if (error.response?.status === 401) {
      // Usuario no autenticado, es normal tras logout
      return null; // o false, según cómo manejes en React
    }
    throw error; // otros errores sí los lanzas
  }
}
