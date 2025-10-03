import { useState, useMemo } from 'react';
import { login, fetchUser, verifyTwoFactor } from '../auth';
import {
  Box, TextField, Button, Typography, Card, CssBaseline,
  FormControl, FormLabel, Stack, InputAdornment, IconButton
} from '@mui/material';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import { styled, createTheme, ThemeProvider, keyframes } from '@mui/material/styles';
import { Link } from 'react-router-dom';

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
  [theme.breakpoints.up('sm')]: { maxWidth: '450px' },
  position: 'relative'
}));

const SignInContainer = styled(Stack)(({ theme }) => ({
  minHeight: '100vh',
  padding: theme.spacing(2),
  [theme.breakpoints.up('sm')]: { padding: theme.spacing(4) },
  background: 'transparent',
}));

export default function Login({ onLoginSuccess }) {
  const [darkMode, setDarkMode] = useState(false);
  const theme = useMemo(() => createTheme({ palette: { mode: darkMode ? 'dark' : 'light' } }), [darkMode]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [touched, setTouched] = useState({ email: false, password: false });

  const [isTwoFactor, setIsTwoFactor] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [twoFactorEmail, setTwoFactorEmail] = useState('');

  const emailError = touched.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const passwordError = touched.password && password.length < 6;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (emailError || passwordError) return;
    try {
      const response = await login(email, password);
      if (response.twoFactor) {
        setIsTwoFactor(true);
        setTwoFactorEmail(response.email);
        setError('Se envió un código a tu correo. Ingresa el código.');
        return;
      }
      const userData = await fetchUser();
      setError('');
      onLoginSuccess();
      localStorage.setItem('user', JSON.stringify(userData));
    } catch (err) {
      if (err.response?.status === 423 || err.message?.includes('bloqueada')) {
        setError('❌ Cuenta bloqueada. Contacta al DIRECTOR.');
      } else {
        setError('❌ Credenciales incorrectas o algo salió mal.');
      }
    }
  };

  const handleTwoFactorSubmit = async (e) => {
    e.preventDefault();
    try {
      const userData = await verifyTwoFactor(twoFactorEmail, twoFactorCode);
      setIsTwoFactor(false);
      setError('');
      onLoginSuccess();
      localStorage.setItem('user', JSON.stringify(userData));
    } catch (err) {
      if (err.response?.status === 423 || err.message?.includes('bloqueada')) {
        setError('❌ Cuenta bloqueada. Contacta al DIRECTOR.');
      } else {
        setError('❌ Código 2FA incorrecto.');
      }
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <SignInContainer direction="column" justifyContent="center" alignItems="center">
        <StyledCard variant="outlined">
          <IconButton onClick={() => setDarkMode((d) => !d)} sx={{ position: 'absolute', top: 8, right: 8 }}>
            {darkMode ? <Brightness7Icon /> : <Brightness4Icon />}
          </IconButton>

          <Box sx={{ textAlign: 'center', mb: 1 }}>
            <img src="/logo.png" alt="Logo" width={80} style={{ marginBottom: 8 }} />
            <Typography variant="subtitle1" color="text.secondary">Bienvenido de nuevo</Typography>
          </Box>

          <Typography component="h1" variant="h5" sx={{ textAlign: 'center' }}>
            {isTwoFactor ? 'Verificación 2FA' : 'Iniciar sesión'}
          </Typography>

          <Box component="form" onSubmit={isTwoFactor ? handleTwoFactorSubmit : handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {!isTwoFactor && (
              <>
                <FormControl>
                  <FormLabel htmlFor="email">Correo electrónico</FormLabel>
                  <TextField
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onBlur={() => setTouched((t) => ({ ...t, email: true }))}
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
                    onChange={(e) => setPassword(e.target.value)}
                    onBlur={() => setTouched((t) => ({ ...t, password: true }))}
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
                          <IconButton onClick={() => setShowPassword((s) => !s)} edge="end">
                            {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </FormControl>
              </>
            )}

            {isTwoFactor && (
              <FormControl>
                <FormLabel>Código 2FA</FormLabel>
                <Stack direction="row" spacing={1} justifyContent="center">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <TextField
                      key={i}
                      inputProps={{
                        maxLength: 1,
                        style: { textAlign: 'center', fontSize: '1.5rem' },
                        inputMode: 'numeric',
                        pattern: '[0-9]*',
                      }}
                      value={twoFactorCode[i] || ''}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, '');
                        if (!/^[0-9]?$/.test(val)) return;
                        let newCode = twoFactorCode.split('');
                        newCode[i] = val;
                        newCode = newCode.join('');
                        setTwoFactorCode(newCode);
                        if (val && e.target.nextSibling) e.target.nextSibling.querySelector('input')?.focus();
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Backspace' && !twoFactorCode[i] && e.target.previousSibling) {
                          e.target.previousSibling.querySelector('input')?.focus();
                        }
                      }}
                      sx={{ width: 50 }}
                    />
                  ))}
                </Stack>
              </FormControl>
            )}

            <Button type="submit" variant="contained" fullWidth disabled={!isTwoFactor && (emailError || passwordError)}>
              {isTwoFactor ? 'Verificar código' : 'Iniciar sesión'}
            </Button>

            {!isTwoFactor && (
              <Typography variant="body2" sx={{ textAlign: 'center' }}>
                <Link to="/forgot-password">¿Olvidaste tu contraseña?</Link>
              </Typography>
            )}

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
