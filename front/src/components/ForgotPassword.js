import { useState, useMemo } from 'react';
import { requestPasswordReset } from '../auth';
import {
  Box,
  Button,
  Card,
  CssBaseline,
  FormControl,
  FormLabel,
  TextField,
  Typography,
  Stack,
  IconButton,
  InputAdornment,
} from '@mui/material';
import EmailIcon from '@mui/icons-material/Email';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import { styled, createTheme, ThemeProvider, keyframes } from '@mui/material/styles';

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
  position: 'relative',
}));

const ForgotContainer = styled(Stack)(({ theme }) => ({
  minHeight: '100vh',
  padding: theme.spacing(2),
  [theme.breakpoints.up('sm')]: { padding: theme.spacing(4) },
  background: 'transparent',
}));

export default function ForgotPassword() {
  const [darkMode, setDarkMode] = useState(false);
  const theme = useMemo(() => createTheme({ palette: { mode: darkMode ? 'dark' : 'light' } }), [darkMode]);

  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [touched, setTouched] = useState(false);

  const emailError = touched && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await requestPasswordReset(email);
      setSent(true);
    } catch (err) {
      setError(
        err.response?.status === 423 || err.message?.includes('bloqueada')
          ? '❌ Cuenta bloqueada. Contacta al DIRECTOR.'
          : 'No se pudo enviar el correo. Intenta nuevamente.'
      );
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ForgotContainer direction="column" justifyContent="center" alignItems="center">
        <StyledCard variant="outlined">
          <IconButton onClick={() => setDarkMode((d) => !d)} sx={{ position: 'absolute', top: 8, right: 8 }}>
            {darkMode ? <Brightness7Icon /> : <Brightness4Icon />}
          </IconButton>

          <Box sx={{ textAlign: 'center', mb: 1 }}>
            <img src="/logo.png" alt="Logo" width={80} style={{ marginBottom: 8 }} />
            <Typography variant="subtitle1" color="text.secondary">
              Recupera el acceso a tu cuenta
            </Typography>
          </Box>

          <Typography component="h1" variant="h5" sx={{ textAlign: 'center' }}>
            Recuperar contraseña
          </Typography>

          {sent ? (
            <Typography sx={{ textAlign: 'center' }}>
              Si el correo existe, te enviamos instrucciones para restablecer tu contraseña.
            </Typography>
          ) : (
            <Box component="form" onSubmit={onSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <FormControl>
                <FormLabel htmlFor="email">Correo electrónico</FormLabel>
                <TextField
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => setTouched(true)}
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

              <Button type="submit" variant="contained" fullWidth disabled={emailError}>
                Enviar instrucciones
              </Button>

              {error && (
                <Typography color="error" variant="body2" sx={{ textAlign: 'center', mt: 1 }}>
                  {error}
                </Typography>
              )}
            </Box>
          )}
        </StyledCard>
      </ForgotContainer>
    </ThemeProvider>
  );
}
