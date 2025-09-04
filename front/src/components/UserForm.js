// src/components/UserForm.js
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Stack,
  Box,
  Alert,
} from '@mui/material';
import { styled } from '@mui/material/styles';

const VideoBox = styled(Box)(({ theme }) => ({
  position: 'relative',
  borderRadius: theme.shape.borderRadius,
  overflow: 'hidden',
  background: '#000',
}));

export default function UserForm() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    photo: '',
  });
  const [errors, setErrors] = useState({});
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [stream, setStream] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const navigate = useNavigate();

  // bind stream to video element
  useEffect(() => {
    if (isCameraOpen && stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [isCameraOpen, stream]);

  const openCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      setStream(mediaStream);
      setIsCameraOpen(true);
    } catch {
      alert('No se pudo acceder a la cámara.');
    }
  };

  const closeCamera = () => {
    if (stream) stream.getTracks().forEach(t => t.stop());
    setStream(null);
    setIsCameraOpen(false);
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg');
    setForm(f => ({ ...f, photo: dataUrl }));
    closeCamera();
  };

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setErrors({});

    // Preflight CSRF
    await fetch('http://localhost:8000/sanctum/csrf-cookie', {
      credentials: 'include',
    });

    const res = await fetch('http://localhost:8000/api/personals', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(form),
    });

    if (res.status === 422) {
      const { errors } = await res.json();
      setErrors(errors);
      return;
    }
    if (!res.ok) {
      alert('Error al crear el usuario.');
      return;
    }

    await res.json();
    navigate('/users');
  };

  // stop camera on unmount
  useEffect(() => () => {
    if (stream) stream.getTracks().forEach(t => t.stop());
  }, [stream]);

  return (
    <Container maxWidth="sm" sx={{ mt: 4, mb: 4 }}>
      <Card>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            Registro de Usuario
          </Typography>

          {/* Validation Errors */}
          {Object.keys(errors).length > 0 && (
            <Alert severity="error" sx={{ mb: 2 }}>
              Corrige los campos marcados.
            </Alert>
          )}

          <Stack component="form" spacing={2} onSubmit={handleSubmit}>
            <TextField
              label="Nombre"
              name="name"
              value={form.name}
              onChange={handleChange}
              error={!!errors.name}
              helperText={errors.name?.join(' ')}
              fullWidth
              required
            />
            <TextField
              label="Correo electrónico"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              error={!!errors.email}
              helperText={errors.email?.join(' ')}
              fullWidth
              required
            />
            <TextField
              label="Teléfono"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              error={!!errors.phone}
              helperText={errors.phone?.join(' ')}
              fullWidth
            />
            <TextField
              label="Dirección"
              name="address"
              value={form.address}
              onChange={handleChange}
              error={!!errors.address}
              helperText={errors.address?.join(' ')}
              fullWidth
            />

            {/* Camera Controls */}
            <VideoBox>
              {isCameraOpen ? (
                <video
                  ref={videoRef}
                  autoPlay
                  style={{ width: '100%', height: 'auto' }}
                />
              ) : (
                <Box
                  sx={{
                    width: '100%',
                    height: 240,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: 'grey.100',
                    color: 'text.secondary',
                  }}
                >
                  Previsualización de cámara
                </Box>
              )}
              <Box sx={{ position: 'absolute', top: 8, right: 8 }}>
                {isCameraOpen ? (
                  <Button size="small" onClick={capturePhoto} variant="contained" sx={{ mr: 1 }}>
                    Capturar
                  </Button>
                ) : null}
                <Button
                  size="small"
                  onClick={isCameraOpen ? closeCamera : openCamera}
                  variant="outlined"
                >
                  {isCameraOpen ? 'Cerrar cámara' : 'Abrir cámara'}
                </Button>
              </Box>
            </VideoBox>

            {/* Hidden canvas */}
            <canvas ref={canvasRef} style={{ display: 'none' }} />

            {/* Photo Preview */}
            {form.photo && (
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="subtitle2">Foto capturada:</Typography>
                <Box
                  component="img"
                  src={form.photo}
                  alt="Captura"
                  sx={{
                    width: 150,
                    height: 'auto',
                    border: 1,
                    borderColor: 'grey.300',
                    borderRadius: 1,
                    mt: 1,
                  }}
                />
              </Box>
            )}

            <Button type="submit" variant="contained" size="large">
              Registrar
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Container>
  );
}
