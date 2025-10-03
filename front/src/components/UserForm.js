import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container, Card, CardHeader, CardContent, Divider, Typography, TextField, Button,
  Stack, Grid, Box, Alert, Avatar, Chip, MenuItem, Select, FormControl, InputLabel
} from '@mui/material';
import { styled } from '@mui/material/styles';
import InputAdornment from '@mui/material/InputAdornment';
import PersonIcon from '@mui/icons-material/Person';
import BadgeIcon from '@mui/icons-material/Badge';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIphoneIcon from '@mui/icons-material/PhoneIphone';
import HomeIcon from '@mui/icons-material/Home';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import KeyIcon from '@mui/icons-material/Key';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import CloseIcon from '@mui/icons-material/Close';

const API_BASE = 'http://localhost:8000';

const VideoBox = styled(Box)(({ theme }) => ({
  position: 'relative',
  borderRadius: theme.shape.borderRadius * 1.5,
  overflow: 'hidden',
  background: theme.palette.grey[900],
  minHeight: 240,
  boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.04)',
}));

const Frame = styled('div')(({ theme }) => ({
  position: 'absolute',
  left: '50%',
  top: '50%',
  transform: 'translate(-50%, -50%)',
  width: '70%',
  height: '70%',
  border: `2px dashed ${theme.palette.primary.light}`,
  borderRadius: theme.shape.borderRadius,
  pointerEvents: 'none',
  boxShadow: '0 0 0 9999px rgba(0,0,0,0.25)',
}));

export default function UserForm() {
  const [form, setForm] = useState({
    name: '',
    apellido: '',
    email: '',
    telefono: '',
    ci: '',
    direccion: '',
    usuario: '',
    password: '',
    photo: '',
    tipo: '',
    descripcion: '',
  });

  const [errors, setErrors] = useState({});
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [stream, setStream] = useState(null);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const navigate = useNavigate();

  // helpers
  const errTxt = (k) => errors?.[k]?.join?.(' ') || '';

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  // cámara
  const openCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      setStream(mediaStream);
      setIsCameraOpen(true);
    } catch {
      alert('No se pudo acceder a la cámara.');
    }
  }, []);

  const closeCamera = useCallback(() => {
    if (stream) stream.getTracks().forEach((t) => t.stop());
    if (videoRef.current) videoRef.current.srcObject = null;
    setStream(null);
    setIsCameraOpen(false);
  }, [stream]);

  const capturePhoto = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !video.videoWidth || !video.videoHeight) {
      alert('No hay video disponible para capturar.');
      return;
    }
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg');
    setForm((f) => ({ ...f, photo: dataUrl }));
    closeCamera();
  }, [closeCamera]);

  useEffect(() => {
    if (isCameraOpen && stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [isCameraOpen, stream]);

  useEffect(() => {
    return () => {
      if (stream) stream.getTracks().forEach((t) => t.stop());
    };
  }, [stream]);

  // submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    await fetch(`${API_BASE}/sanctum/csrf-cookie`, { credentials: 'include' });

    const res = await fetch(`${API_BASE}/api/personals`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(form),
    });

    if (res.status === 422) {
      const data = await res.json();
      setErrors(data.errors || {});
      return;
    }
    if (!res.ok) {
      alert('Error al crear el usuario.');
      return;
    }

    await res.json();
    navigate('/users');
  };

  return (
    <Container maxWidth="md" sx={{ mt: 6, mb: 6 }}>
      <Card elevation={2} sx={{ overflow: 'hidden', borderRadius: 4 }}>
        <CardHeader
          title={
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar sx={{ bgcolor: 'primary.main' }}>
                <AccountCircleIcon />
              </Avatar>
              <Box>
                <Typography variant="h5" fontWeight={700}>
                  Registro de Padres o Familiares
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Complete la información y capture una fotografía para el expediente
                </Typography>
              </Box>
            </Stack>
          }
          action={
            form.photo ? (
              <Stack direction="row" spacing={1} alignItems="center" sx={{ pr: 2 }}>
                <Chip label="Foto lista" color="success" size="small" />
                <Avatar src={form.photo} alt="Captura" variant="rounded" sx={{ width: 40, height: 40 }} />
              </Stack>
            ) : null
          }
        />

        <Divider />

        <CardContent>
          {Object.keys(errors).length > 0 && (
            <Alert severity="error" variant="outlined" sx={{ mb: 3 }}>
              Corrija los campos marcados.
            </Alert>
          )}

          <Stack component="form" spacing={3} onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              {/* fila 1 */}
              <Grid item xs={12} md={6}>
                <TextField
                  label="Nombre"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  error={!!errors.name}
                  helperText={errTxt('name')}
                  fullWidth
                  required
                  size="small"
                  autoComplete="given-name"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonIcon fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Apellido"
                  name="apellido"
                  value={form.apellido}
                  onChange={handleChange}
                  error={!!errors.apellido}
                  helperText={errTxt('apellido')}
                  fullWidth
                  required
                  size="small"
                  autoComplete="family-name"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <BadgeIcon fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              {/* fila 2 */}
              <Grid item xs={12} md={6}>
                <TextField
                  label="Correo electrónico"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  error={!!errors.email}
                  helperText={errTxt('email')}
                  fullWidth
                  required
                  size="small"
                  autoComplete="email"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailIcon fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Teléfono"
                  name="telefono"
                  value={form.telefono}
                  onChange={handleChange}
                  error={!!errors.telefono}
                  helperText={errTxt('telefono')}
                  fullWidth
                  required
                  size="small"
                  autoComplete="tel"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PhoneIphoneIcon fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              {/* fila 3 */}
              <Grid item xs={12} md={6}>
                <TextField
                  label="CI"
                  name="ci"
                  value={form.ci}
                  onChange={handleChange}
                  error={!!errors.ci}
                  helperText={errTxt('ci')}
                  fullWidth
                  required
                  size="small"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <BadgeIcon fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Dirección"
                  name="direccion"
                  value={form.direccion}
                  onChange={handleChange}
                  error={!!errors.direccion}
                  helperText={errTxt('direccion')}
                  fullWidth
                  size="small"
                  autoComplete="street-address"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <HomeIcon fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              {/* fila 4 */}
              <Grid item xs={12} md={6}>
                <TextField
                  label="Usuario"
                  name="usuario"
                  value={form.usuario}
                  onChange={handleChange}
                  error={!!errors.usuario}
                  helperText={errTxt('usuario')}
                  fullWidth
                  required
                  size="small"
                  autoComplete="username"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <AccountCircleIcon fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Contraseña"
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handleChange}
                  error={!!errors.password}
                  helperText={errTxt('password')}
                  fullWidth
                  required
                  size="small"
                  autoComplete="new-password"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <KeyIcon fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              {/* fila 5: tipo + (opcional) descripción */}
              <Grid item xs={12} md={form.tipo === 'tutor' || form.tipo === 'familiar' ? 4 : 6}>
                <FormControl fullWidth size="small" required error={!!errors.tipo}>
                  <InputLabel id="tipo-label">Tipo</InputLabel>
                  <Select
                    labelId="tipo-label"
                    id="tipo"
                    label="Tipo"
                    name="tipo"
                    value={form.tipo}
                    onChange={handleChange}
                  >
                    <MenuItem value="padre">Padre</MenuItem>
                    <MenuItem value="madre">Madre</MenuItem>
                    <MenuItem value="tutor">Tutor</MenuItem>
                    <MenuItem value="familiar">Familiar</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {(form.tipo === 'familiar' || form.tipo === 'tutor') && (
                <Grid item xs={12} md={8}>
                  <TextField
                    label="Descripción (obligatoria para tutor o familiar)"
                    name="descripcion"
                    value={form.descripcion}
                    onChange={handleChange}
                    error={!!errors.descripcion}
                    helperText={errTxt('descripcion')}
                    fullWidth
                    size="small"
                    multiline
                    minRows={2}
                    maxRows={6}
                  />
                </Grid>
              )}
            </Grid>

            {/* fotografía */}
            <Box>
              <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>
                Fotografía
              </Typography>

              <VideoBox>
                {isCameraOpen ? (
                  <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    style={{ width: '100%', height: 'auto', display: 'block' }}
                  />
                ) : (
                  <Box
                    sx={{
                      width: '100%',
                      minHeight: 240,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: 'grey.900',
                      color: 'grey.400',
                      letterSpacing: 0.3,
                    }}
                  >
                    Previsualización de cámara
                  </Box>
                )}

                <Frame />

                <Stack direction="row" spacing={1} sx={{ position: 'absolute', right: 12, bottom: 12 }}>
                  {isCameraOpen && (
                    <Button size="small" onClick={capturePhoto} variant="contained" startIcon={<CameraAltIcon />}>
                      Capturar
                    </Button>
                  )}
                  <Button
                    size="small"
                    onClick={isCameraOpen ? closeCamera : openCamera}
                    variant={isCameraOpen ? 'outlined' : 'contained'}
                    color={isCameraOpen ? 'inherit' : 'secondary'}
                    startIcon={isCameraOpen ? <CloseIcon /> : <CameraAltIcon />}
                  >
                    {isCameraOpen ? 'Cerrar cámara' : 'Abrir cámara'}
                  </Button>
                </Stack>
              </VideoBox>

              <canvas ref={canvasRef} style={{ display: 'none' }} />

              {form.photo && (
                <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 2 }}>
                  <Avatar src={form.photo} alt="Captura" variant="rounded" sx={{ width: 64, height: 64 }} />
                  <Typography variant="body2" color="text.secondary">
                    Se ha capturado una fotografía para el registro.
                  </Typography>
                </Stack>
              )}
            </Box>

            <Divider sx={{ my: 1 }} />

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} justifyContent="flex-end">
              <Button type="submit" variant="contained" size="large">
                Registrar
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    </Container>
  );
}
