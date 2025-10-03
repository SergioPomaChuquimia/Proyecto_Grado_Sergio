import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { resetPassword } from '../auth';
import {
  Box,
  Button,
  Card,
  CssBaseline,
  FormControl,
  FormLabel,
  TextField,
  Typography,
  InputAdornment,
  IconButton,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { styled, keyframes } from '@mui/material/styles';

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const StyledCard = styled(Card)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  padding: theme.spacing(4),
  gap: theme.spacing(2),
  margin: 'auto',
  animation: `${fadeIn} 0.5s ease-out`,
  [theme.breakpoints.up('sm')]: { maxWidth: '450px' },
}));

export default function ResetPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const token = params.get('token') || '';
  const email = decodeURIComponent(params.get('email') || '');

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [msg, setMsg] = useState({ ok: '', err: '' });

  const passwordTooShort = !!password && password.length < 6;
  const passwordsDontMatch = password !== confirm;
  const disabled = !password || passwordTooShort || passwordsDontMatch;

  const onSubmit = async (e) => {
    e.preventDefault();
    setMsg({ ok: '', err: '' });
    try {
      await resetPassword({
        email,
        token,
        password,
        password_confirmation: confirm,
      });
      setMsg({ ok: '✅ Contraseña actualizada. Ya puedes iniciar sesión.', err: '' });
      setTimeout(() => navigate('/'), 1500);
    } catch (err) {
      if (err?.response?.status === 423 || err.message?.includes('bloqueada')) {
        setMsg({ ok: '', err: '❌ Cuenta bloqueada. Contacta al DIRECTOR.' });
      } else {
        setMsg({ ok: '', err: '❌ Token inválido o expirado. Solicita uno nuevo.' });
      }
    }
  };

  return (
    <>
      <CssBaseline />
      <Box
        sx={{
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          p: 2,
          background: 'linear-gradient(135deg, rgba(63,81,181,0.9), rgba(3,169,244,0.7))',
        }}
      >
        <StyledCard variant="outlined">
          <Typography variant="h5" sx={{ mb: 1, textAlign: 'center' }}>
            Restablecer contraseña
          </Typography>
          <Typography variant="body2" sx={{ mb: 2, textAlign: 'center' }}>
            {email}
          </Typography>

          <Box component="form" onSubmit={onSubmit} sx={{ display: 'grid', gap: 2 }}>
            <FormControl>
              <FormLabel>Nueva contraseña</FormLabel>
              <TextField
                type={show ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                error={passwordTooShort}
                helperText={passwordTooShort ? 'Mínimo 6 caracteres' : ''}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton edge="end" onClick={() => setShow((s) => !s)}>
                        {show ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </FormControl>

            <FormControl>
              <FormLabel>Confirmar contraseña</FormLabel>
              <TextField
                type={show ? 'text' : 'password'}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                placeholder="••••••••"
                error={passwordsDontMatch}
                helperText={passwordsDontMatch ? 'Las contraseñas no coinciden' : ''}
              />
            </FormControl>

            <Button type="submit" variant="contained" disabled={disabled}>
              Guardar contraseña
            </Button>

            {msg.ok && (
              <Typography color="primary" sx={{ textAlign: 'center', mt: 1 }}>
                {msg.ok}
              </Typography>
            )}
            {msg.err && (
              <Typography color="error" sx={{ textAlign: 'center', mt: 1 }}>
                {msg.err}
              </Typography>
            )}
          </Box>
        </StyledCard>
      </Box>
    </>
  );
}
