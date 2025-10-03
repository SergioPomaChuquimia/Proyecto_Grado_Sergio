import React, { useRef, useState } from 'react';
import { verify2FA, resend2FA, fetchUser } from '../auth';
import {
  Box,
  TextField,
  Button,
  Typography,
  Stack,
  Card,
  CardHeader,
  CardContent,
  Divider,
  Alert,
  Avatar,
} from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import MarkEmailReadIcon from '@mui/icons-material/MarkEmailRead';
import AutorenewIcon from '@mui/icons-material/Autorenew';

const DIGITS = 6;

export default function TwoFactorForm({ email, onSuccess, onCancel }) {
  const [parts, setParts] = useState(Array(DIGITS).fill(''));
  const code = parts.join('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  // refs estables (no se recrean en cada render)
  const inputsRef = useRef(Array.from({ length: DIGITS }, () => React.createRef()));

  const focusAt = (idx) => {
    const el = inputsRef.current[idx]?.current;
    if (el) el.focus();
  };

  const handleChange = (idx, val) => {
    const digit = (val || '').replace(/\D/g, '').slice(0, 1);
    setParts((prev) => {
      const next = [...prev];
      next[idx] = digit || '';
      return next;
    });
    if (digit && idx < DIGITS - 1) focusAt(idx + 1);
  };

  const handleKeyDown = (idx, e) => {
    if (e.key === 'Backspace') {
      if (parts[idx]) {
        setParts((prev) => {
          const next = [...prev];
          next[idx] = '';
          return next;
        });
        e.preventDefault();
      } else if (idx > 0) {
        focusAt(idx - 1);
        setParts((prev) => {
          const next = [...prev];
          next[idx - 1] = '';
          return next;
        });
        e.preventDefault();
      }
    }
    if (e.key === 'ArrowLeft' && idx > 0) focusAt(idx - 1);
    if (e.key === 'ArrowRight' && idx < DIGITS - 1) focusAt(idx + 1);
  };

  const handlePaste = (idx, e) => {
    const text = (e.clipboardData.getData('text') || '').replace(/\D/g, '');
    if (!text) return;
    e.preventDefault();
    setParts((prev) => {
      const next = [...prev];
      for (let i = 0; i < text.length && idx + i < DIGITS; i++) {
        next[idx + i] = text[i];
      }
      return next;
    });
    const last = Math.min(idx + text.length - 1, DIGITS - 1);
    focusAt(last < DIGITS - 1 ? last + 1 : last);
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await verify2FA(email, code);
      const user = await fetchUser();
      onSuccess(user);
    } catch (err) {
      setError(err?.response?.data?.message || 'Código inválido o expirado');
    }
  };

  const handleResend = async () => {
    setSending(true);
    try {
      await resend2FA(email);
    } catch {
      setError('No se pudo reenviar el código');
    } finally {
      setSending(false);
    }
  };

  return (
    <Card elevation={2} sx={{ maxWidth: 520, width: '100%', borderRadius: 4, overflow: 'hidden' }}>
      <CardHeader
        avatar={
          <Avatar sx={{ bgcolor: 'primary.main' }}>
            <LockIcon />
          </Avatar>
        }
        title={<Typography variant="h6" fontWeight={700}>Verificación en dos pasos</Typography>}
        subheader={
          <Stack direction="row" spacing={1} alignItems="center">
            <MarkEmailReadIcon fontSize="small" />
            <Typography variant="body2" color="text.secondary">
              Enviamos un código a <strong>{email}</strong>
            </Typography>
          </Stack>
        }
      />
      <Divider />
      <CardContent>
        <Stack component="form" onSubmit={handleVerify} spacing={2}>
          {error && <Alert severity="error" variant="outlined">{error}</Alert>}

          <Stack direction="row" spacing={1.5} justifyContent="center">
            {parts.map((val, idx) => (
              <TextField
                key={idx}
                value={val}
                onChange={(e) => handleChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                onPaste={(e) => handlePaste(idx, e)}
                inputRef={inputsRef.current[idx]}
                inputProps={{
                  maxLength: 1,
                  inputMode: 'numeric',
                  pattern: '[0-9]*',
                  style: { textAlign: 'center', width: 48 },
                  'aria-label': `Dígito ${idx + 1}`,
                }}
                size="medium"
              />
            ))}
          </Stack>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ xs: 'stretch', sm: 'center' }}>
            <Button type="submit" variant="contained" size="large" disabled={code.length !== DIGITS}>
              Verificar
            </Button>
            <Button
              variant="outlined"
              onClick={handleResend}
              disabled={sending}
              startIcon={<AutorenewIcon />}
            >
              {sending ? 'Reenviando…' : 'Reenviar código'}
            </Button>
            {onCancel && (
              <Button color="inherit" onClick={onCancel}>
                Cancelar
              </Button>
            )}
          </Stack>

          <Box>
            <Typography variant="caption" color="text.secondary">
              Ingrese los {DIGITS} dígitos. Puede pegar el código completo y se distribuirá automáticamente en las casillas.
            </Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}
