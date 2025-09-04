// src/components/Login.js
import { useState, useMemo } from 'react';
import { login, fetchUser } from '../auth';
import {
  Box,
  TextField,
  Button,
  Typography,
  Card,
  CssBaseline,
  FormControl,
  FormLabel,
  Stack,
  InputAdornment,
  IconButton,
} from '@mui/material';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import { styled, createTheme, ThemeProvider, keyframes } from '@mui/material/styles';

// Animación de fade-in
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const StyledCard = styled(Card)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignSelf: 'center',
  width: '100%',
  padding: theme.spacing(4),
  gap: theme.spacing(2),
  margin: 'auto',
  animation: `${fadeIn} 0.5s ease-out`,
  [theme.breakpoints.up('sm')]: {
    maxWidth: '450px',
  },
  position: 'relative'
}));

const SignInContainer = styled(Stack)(({ theme }) => ({
  minHeight: '100vh',
  padding: theme.spacing(2),
  [theme.breakpoints.up('sm')]: {
    padding: theme.spacing(4),
  },
  background: 'transparent',
}));

export default function Login({ onLoginSuccess }) {
  const [darkMode, setDarkMode] = useState(false);
  const theme = useMemo(
    () =>
      createTheme({
        palette: { mode: darkMode ? 'dark' : 'light' },
      }),
    [darkMode]
  );

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [touched, setTouched] = useState({ email: false, password: false });

  const emailError = touched.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const passwordError = touched.password && password.length < 6;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (emailError || passwordError) return;
    try {
      await login(email, password);
      const userData = await fetchUser();
      setError('');
      onLoginSuccess();
      localStorage.setItem('user', JSON.stringify(userData));
    } catch {
      setError('Credenciales incorrectas o algo salió mal.');
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <SignInContainer direction="column" justifyContent="center" alignItems="center">
        <StyledCard variant="outlined">
          {/* Toggle modo */}
          <IconButton
            onClick={() => setDarkMode(d => !d)}
            sx={{ position: 'absolute', top: 8, right: 8 }}
          >
            {darkMode ? <Brightness7Icon /> : <Brightness4Icon />}
          </IconButton>

          {/* Logo y subtítulo */}
          <Box sx={{ textAlign: 'center', mb: 1 }}>
            {/* 👇 Usa tu logo desde public/logo.png */}
            <img src="/logo.png" alt="Logo" width={80} style={{ marginBottom: 8 }} />
            <Typography variant="subtitle1" color="textSecondary">
              Bienvenido de nuevo
            </Typography>
          </Box>

          <Typography component="h1" variant="h5" sx={{ textAlign: 'center' }}>
            Iniciar sesión
          </Typography>

          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
          >
            <FormControl>
              <FormLabel htmlFor="email">Correo electrónico</FormLabel>
              <TextField
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onBlur={() => setTouched(t => ({ ...t, email: true }))}
                required
                fullWidth
                placeholder="correo@ejemplo.com"
                error={emailError}
                helperText={emailError ? 'Introduce un email válido' : ''}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </FormControl>

            <FormControl>
              <FormLabel htmlFor="password">Contraseña</FormLabel>
              <TextField
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                onBlur={() => setTouched(t => ({ ...t, password: true }))}
                required
                fullWidth
                placeholder="••••••••"
                error={passwordError}
                helperText={passwordError ? 'Mínimo 6 caracteres' : ''}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword(s => !s)} edge="end">
                        {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </FormControl>

            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={emailError || passwordError}
            >
              Iniciar sesión
            </Button>

            <Typography variant="caption" sx={{ textAlign: 'right' }}>
              <Button variant="text" size="small">¿Olvidaste tu contraseña?</Button>
            </Typography>

            {error && (
              <Typography variant="body2" color="error" sx={{ textAlign: 'center', mt: 1 }}>
                {error}
              </Typography>
            )}
          </Box>
        </StyledCard>
      </SignInContainer>
    </ThemeProvider>
  );
}
