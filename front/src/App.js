// App.js
import './App.css';
import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Typography, Button } from '@mui/material';

import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import NavBar from './components/NavBar';
import UserForm from './components/UserForm';
import UserList from './components/UserList';
import RoleForm from './components/RoleForm';
import RoleList from './components/RoleList';
import UserManagement from './components/UserManagement';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import HijoForm from './components/HijoForm';
import HijoList from './components/HijoList';
import RecojoHistory from "./components/RecojoHistory";

import { fetchUser, logout } from './auth';

function App() {
  const [isLogin, setIsLogin] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetchUser()
      .then(u => {
        setLoggedIn(!!u);
        setUser(u);
      })
      .catch(() => setLoggedIn(false))
      .finally(() => setLoading(false));
  }, []);

  const handleLoginSuccess = async () => {
    const loggedUser = await fetchUser();
    setUser(loggedUser);
    setLoggedIn(true);
  };

  const handleLogout = async () => {
    await logout();
    setLoggedIn(false);
    setUser(null);
    localStorage.removeItem('user');
  };

  if (loading) return <div>Cargando...</div>;

  // Único guard: requiere sesión
  const Private = ({ children }) => (loggedIn ? children : <Navigate to="/" replace />);

  return (
    <Router>
      <div className="App">
        {loggedIn && <NavBar onLogout={handleLogout} user={user} />}

        <Routes>
          <Route
            path="/"
            element={
              loggedIn ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <div className="App-header">
                  {isLogin ? (
                    <>
                      <Login onLoginSuccess={handleLoginSuccess} />
                      <Typography variant="body2" sx={{ mt: 2 }}>
                        ¿No tienes cuenta?{' '}
                        <Button
                          variant="text"
                          onClick={() => setIsLogin(false)}
                          sx={{ color: '#ffc107', textTransform: 'none', p: 0, textDecoration: 'underline' }}
                        >
                          Regístrate
                        </Button>
                      </Typography>
                    </>
                  ) : (
                    <>
                      <Register onRegisterSuccess={handleLoginSuccess} />
                      <Typography variant="body2" sx={{ mt: 2 }}>
                        ¿Ya tienes cuenta?{' '}
                        <Button
                          variant="text"
                          onClick={() => setIsLogin(true)}
                          sx={{ color: '#ffc107', textTransform: 'none', p: 0, textDecoration: 'underline' }}
                        >
                          Iniciar sesión
                        </Button>
                      </Typography>
                    </>
                  )}
                </div>
              )
            }
          />

          {/* Rutas protegidas (abiertas para cualquier usuario autenticado) */}
          <Route path="/dashboard"       element={<Private><Dashboard /></Private>} />
          <Route path="/register-user"   element={<Private><UserForm /></Private>} />
          <Route path="/users"           element={<Private><UserList /></Private>} />
          <Route path="/register-role"   element={<Private><RoleForm /></Private>} />
          <Route path="/roles"           element={<Private><RoleList /></Private>} />
          <Route path="/usuarios"        element={<Private><UserManagement currentUser={user} /></Private>} />
          <Route path="/register-child"  element={<Private><HijoForm /></Private>} />
          <Route path="/hijos"           element={<Private><HijoList /></Private>} />
          <Route path="/historial-recojos" element={<Private><RecojoHistory /></Private>} />

          {/* Recuperación de contraseña solo para no logueados */}
          <Route path="/forgot-password" element={!loggedIn ? <ForgotPassword /> : <Navigate to="/dashboard" replace />} />
          <Route path="/reset-password"  element={!loggedIn ? <ResetPassword />  : <Navigate to="/dashboard" replace />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
