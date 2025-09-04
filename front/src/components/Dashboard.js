import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Card,
  CircularProgress,
} from '@mui/material';
import { styled } from '@mui/material/styles';

const Overlay = styled('div')(({ theme }) => ({
  position: 'absolute',
  top: '50%',
  left: '50%',
  width: '60%',
  height: '60%',
  transform: 'translate(-50%, -50%)',
  border: `3px dashed ${theme.palette.success.main}`,
  borderRadius: 8,
  pointerEvents: 'none',
}));

export default function Dashboard() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [counter, setCounter] = useState(5);
  const navigate = useNavigate();

  const captureAndVerify = async () => {
    if (loading || !videoRef.current) return;
    setLoading(true);
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const base64Image = canvas.toDataURL('image/jpeg');

    try {
      const res = await fetch('http://localhost:5000/api/verify_face', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64Image }),
      });
      if (res.ok) {
        const data = await res.json();
        setResult(data.result);
      } else {
        setResult('error');
      }
    } catch {
      setResult('error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let stream;
    let verifyInterval;
    let countInterval;

    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) videoRef.current.srcObject = stream;

        // Verificación inicial
        await captureAndVerify();
        setCounter(5);

        // Contador cada segundo
        countInterval = setInterval(
          () => setCounter(prev => (prev > 0 ? prev - 1 : 0)),
          1000
        );
        // Verificación cada 5s
        verifyInterval = setInterval(async () => {
          await captureAndVerify();
          setCounter(5);
        }, 5000);
      } catch (err) {
        console.error('Error cámara:', err);
      }
    })();

    return () => {
      if (stream) stream.getTracks().forEach(t => t.stop());
      clearInterval(verifyInterval);
      clearInterval(countInterval);
    };
  }, []);

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Card sx={{ p: 3, position: 'relative' }}>
        <Box sx={{ position: 'relative' }}>
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            style={{
              width: '100%',
              height: 'auto',
              maxHeight: 600,
              borderRadius: 8,
              background: '#000',
            }}
          />
          <Overlay />
        </Box>

        <canvas ref={canvasRef} style={{ display: 'none' }} />

        <Box sx={{ mt: 2, display: 'flex', alignItems: 'center' }}>
          {loading && <CircularProgress size={24} sx={{ mr: 1 }} />}
          <Typography variant="body1">
            {loading
              ? 'Verificando…'
              : `Próxima verificación en ${counter} s`}
          </Typography>
        </Box>

        {result && (
          <Typography
            variant="h6"
            sx={{
              mt: 1,
              color:
                result === 'registered'
                  ? 'success.main'
                  : result === 'not_registered'
                  ? 'error.main'
                  : result === 'no_face_detected'
                  ? 'warning.main'
                  : 'text.primary',
            }}
          >
            {result === 'registered'
              ? '✅ Rostro registrado'
              : result === 'not_registered'
              ? '❌ Rostro NO registrado'
              : result === 'no_face_detected'
              ? '⚠️ No se detectó rostro'
              : '❌ Error en la verificación'}
          </Typography>
        )}
      </Card>
    </Container>
  );
}
