import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8000",
  withCredentials: true, // Cookies de sesión (Sanctum)
});

const isDev = process.env.NODE_ENV !== 'production';

// Interceptores de Axios
api.interceptors.request.use((config) => {
  if (isDev) {
    console.log("📤 Request:", config.method?.toUpperCase(), config.url);
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (isDev && error.response) {
      console.error("❌ Error response:", error.response);
    }
    return Promise.reject(error);
  }
);

export default api;

// ========= Funciones de autenticación =========

export async function getCsrf() {
  try {
    await api.get("/sanctum/csrf-cookie");
  } catch (error) {
    if (isDev) console.error("❌ Error al obtener CSRF cookie:", error);
  }
}

export async function login(email, password) {
  await getCsrf();
  try {
    const response = await api.post('/api/login', { email, password });
    return response.data['2fa_required']
      ? { twoFactor: true, email: response.data.email }
      : { twoFactor: false, user: response.data.user };
  } catch (error) {
    if (error.response?.status === 423) {
      throw new Error('Cuenta bloqueada. Contacta al Director.');
    }
    throw error;
  }
}

export async function verifyTwoFactor(email, code) {
  await getCsrf();
  try {
    const response = await api.post("/api/verify-2fa", { email, code });
    return response.data.user;
  } catch (error) {
    if (error.response?.status === 423) {
      throw new Error("Cuenta bloqueada. Contacta al administrador.");
    }
    throw error;
  }
}

export async function register(name, email, password, password_confirmation) {
  await getCsrf();
  return api.post("/api/register", { name, email, password, password_confirmation });
}

export async function logout() {
  try {
    await api.post("/api/logout");
  } catch (error) {
    if (isDev) console.error("❌ Error al cerrar sesión:", error);
  }
}

export async function fetchUser() {
  try {
    const response = await api.get("/api/user");
    return response.data;
  } catch (error) {
    if (error.response?.status === 401) return null;
    throw error;
  }
}

export const requestPasswordReset = async (email) => {
  await getCsrf();
  try {
    return await api.post("/api/forgot-password", { email });
  } catch (error) {
    if (error.response?.status === 423) {
      throw new Error("Cuenta bloqueada. No se puede enviar correo.");
    }
    throw error;
  }
};

export const resetPassword = async ({ email, token, password, password_confirmation }) => {
  await getCsrf();
  try {
    return await api.post("/api/reset-password", { email, token, password, password_confirmation });
  } catch (error) {
    if (error.response?.status === 423) {
      throw new Error("Cuenta bloqueada. No se puede cambiar contraseña.");
    }
    throw error;
  }
};

export async function unlockUser(userId) {
  try {
    const { data } = await api.post(`/api/users/${userId}/unlock`);
    return data;
  } catch (error) {
    if (isDev) console.error("❌ Error desbloqueando usuario:", error);
    throw error;
  }
}
