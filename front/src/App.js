import './App.css';
import { useState, useEffect } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate
} from 'react-router-dom';
import { Typography, Button } from '@mui/material';

import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import NavBar from './components/NavBar';
import UserForm from './components/UserForm';
import UserList from './components/UserList';
import { fetchUser, logout } from './auth';
import RoleForm from './components/RoleForm';
import RoleList from './components/RoleList';
import UserManagement from './components/UserManagement';

function App() {
  const [isLogin, setIsLogin] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null); // 👈 Guardamos usuario autenticado

  useEffect(() => {
    fetchUser()
      .then(user => {
        setLoggedIn(!!user);
        setUser(user);
      })
      .catch(() => {
        setLoggedIn(false);
        setUser(null);
      })
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

  return (
    <Router>
      <div className="App">
        {loggedIn && <NavBar onLogout={handleLogout} user={user} />}

        <Routes>
          <Route
            path="/"
            element={
              loggedIn
                ? <Navigate to="/dashboard" replace />
                : (
                  <div className="App-header">
                    {isLogin ? (
                      <>
                        <Login onLoginSuccess={handleLoginSuccess} />

                        <Typography variant="body2" sx={{ mt: 2 }}>
                          ¿No tienes cuenta?{' '}
                          <Button
                            variant="text"
                            onClick={() => setIsLogin(false)}
                            sx={{
                              color: '#ffc107',
                              textTransform: 'none',
                              p: 0,
                              textDecoration: 'underline'
                            }}
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
                            sx={{
                              color: '#ffc107',
                              textTransform: 'none',
                              p: 0,
                              textDecoration: 'underline'
                            }}
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

          <Route
            path="/dashboard"
            element={
              loggedIn
                ? <Dashboard />
                : <Navigate to="/" replace />
            }
          />

          <Route
            path="/register-user"
            element={
              loggedIn
                ? <UserForm />
                : <Navigate to="/" replace />
            }
          />

          <Route
            path="/users"
            element={
              loggedIn && user?.email === "admin@gmail.com"
                ? <UserList />
                : <Navigate to="/dashboard" replace />
            }
          />

          <Route
            path="/register-role"
            element={
              loggedIn && user?.email === "admin@gmail.com"
                ? <RoleForm />
                : <Navigate to="/dashboard" replace />
            }
          />

          <Route
            path="/roles"
            element={
              loggedIn && user?.email === "admin@gmail.com"
                ? <RoleList />
                : <Navigate to="/dashboard" replace />
            }
          />

          <Route
            path="/usuarios"
            element={
              loggedIn && user?.email === "admin@gmail.com"
                ? <UserManagement />
                : <Navigate to="/dashboard" replace />
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
