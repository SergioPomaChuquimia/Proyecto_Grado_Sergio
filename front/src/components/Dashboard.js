// dashboard.js
import React, { useRef, useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Card,
  CircularProgress,
  Chip,
  Divider,
  Tooltip
} from '@mui/material';
import { styled } from '@mui/material/styles';

// =======================
// Constantes
// =======================
const FACE_API = 'http://127.0.0.1:5000';
const LARAVEL_API = 'http://localhost:8000';
const THRESH_CONFIDENCE = 0.95;
const THRESH_SHARPNESS = 100;
const THRESH_MIN_SIZE = 120;

// =======================
// Estilos
// =======================
const Overlay = styled('div')(() => ({
  position: 'absolute',
  top: '50%',
  left: '50%',
  width: '60%',
  height: '60%',
  transform: 'translate(-50%, -50%)',
  borderRadius: 8,
  pointerEvents: 'none',
  transition: 'border-color 120ms ease',
}));

const BigHint = styled('div')(() => ({
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  fontSize: '2rem',
  fontWeight: 800,
  color: '#fff',
  textShadow: '0 2px 6px rgba(0,0,0,.8)',
  padding: '0.25rem 0.75rem',
  borderRadius: 8,
  background: 'rgba(0,0,0,0.25)',
  pointerEvents: 'none',
}));

export default function Dashboard() {
  // Refs
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const analyzeTimerRef = useRef(null);
  const tickTimerRef = useRef(null);

  // Estado principal
  const [result, setResult] = useState('');
  const [loadingVerify, setLoadingVerify] = useState(false);
  const [faceOK, setFaceOK] = useState(false);
  const [qualityMsg, setQualityMsg] = useState('Buscando rostro…');
  const [counter, setCounter] = useState(null);
  const [match, setMatch] = useState(null);
  const [children, setChildren] = useState([]);

  // Control: verificación por botón único (3s)
  const [sessionArmed, setSessionArmed] = useState(false);

  // Mensajes UI
  const [infoMsg, setInfoMsg] = useState('');  // p.ej. "Su registro y recojo..."
  const [bigMsg, setBigMsg] = useState('');    // p.ej. "Su hijo ya fue retirado por una persona."
  const [pickedDetail, setPickedDetail] = useState(null); // { picked_child, picked_by, picked_at }

  const overlayBorder = faceOK ? '3px dashed #2e7d32' : '3px dashed #ed6c02';

  // =======================
  // Helpers de imagen
  // =======================
  const getFrameBase64 = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !video.videoWidth || !video.videoHeight) return null;
    const ctx = canvas.getContext('2d');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg');
  };

  // =======================
  // Análisis de calidad (Flask)
  // =======================
  const analyzeFrame = async () => {
    const base64Image = getFrameBase64();
    if (!base64Image) return { ok: false, reason: 'no_frame' };

    try {
      const res = await fetch(`${FACE_API}/api/embed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_base64: base64Image }),
      });

      if (!res.ok) return { ok: false, reason: 'flask_unreachable' };

      const data = await res.json();
      const faces = data.faces_detected ?? 0;

      if (faces !== 1) {
        setFaceOK(false);
        setQualityMsg('No se detectó rostro. Centra tu cara en el marco.');
        return { ok: false, reason: 'no_face' };
      }

      const conf = Number(data.confidence || 0);
      const sharp = Number(data.sharpness || 0);
      const w = Number(data.size?.w || 0);
      const h = Number(data.size?.h || 0);

      if (conf < THRESH_CONFIDENCE) {
        setFaceOK(false);
        setQualityMsg('Detección poco confiable. Acércate y mira al frente.');
        return { ok: false, reason: 'low_conf' };
      }

      if (Math.min(w, h) < THRESH_MIN_SIZE) {
        setFaceOK(false);
        setQualityMsg('Rostro muy pequeño. Acércate a la cámara.');
        return { ok: false, reason: 'small_face' };
      }

      if (sharp < THRESH_SHARPNESS) {
        setFaceOK(false);
        setQualityMsg('Imagen borrosa. Más luz y evita moverte.');
        return { ok: false, reason: 'blurry' };
      }

      setFaceOK(true);
      setQualityMsg('Rostro detectado. ¡Quédese quieto!');
      return { ok: true };
    } catch {
      setFaceOK(false);
      setQualityMsg('Error analizando rostro.');
      return { ok: false, reason: 'exception' };
    }
  };

  // =======================
  // Verificación (Laravel)
  // =======================
  const verifyNow = async () => {
    if (loadingVerify || !faceOK) {
      setResult('no_face_detected');
      return;
    }

    setLoadingVerify(true);

    try {
      const base64Image = getFrameBase64();
      if (!base64Image) throw new Error('No frame');

      await fetch(`${LARAVEL_API}/sanctum/csrf-cookie`, { credentials: 'include' });

      const res = await fetch(`${LARAVEL_API}/api/verify`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ image: base64Image }),
      });

      if (!res.ok) throw new Error('Verification failed');

      const data = await res.json();
      setResult(data.result);

      // reset mensajes por cada verificación
      setInfoMsg('');
      setBigMsg('');
      setPickedDetail(null);

      if (data.result === 'registered') {
        setMatch(data.match ?? null);
        setChildren(Array.isArray(data.children) ? data.children : []);
      } else if (data.result === 'already_registered') {
        if (data.match) setMatch(data.match);
        if (Array.isArray(data.children)) setChildren(data.children);
        setInfoMsg(data.message || 'Su registro y recojo a su hijo ya fue registrado.');
      } else if (data.result === 'picked_by_other') {
        if (data.match) setMatch(data.match);
        if (Array.isArray(data.children)) setChildren(data.children);
        setBigMsg(data.message || 'Su hijo ya fue retirado por una persona.');
        setPickedDetail({
          picked_child: data.picked_child || null,
          picked_by: data.picked_by || null,
          picked_at: data.picked_at || null,
        });
      } else if (data.result === 'not_registered') {
        setMatch(null);
        setChildren([]);
      }
    } catch {
      setResult('error');
    } finally {
      setLoadingVerify(false);
    }
  };

  // =======================
  // Efectos
  // =======================
  useEffect(() => {
    let stream;
    (async () => {
      try {
        await fetch(`${LARAVEL_API}/sanctum/csrf-cookie`, { credentials: 'include' });
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) videoRef.current.srcObject = stream;
        analyzeTimerRef.current = setInterval(analyzeFrame, 1500);
      } catch {
        setQualityMsg('No se pudo acceder a la cámara.');
      }
    })();

    return () => {
      if (stream) stream.getTracks().forEach(t => t.stop());
      clearInterval(analyzeTimerRef.current);
      clearInterval(tickTimerRef.current);
    };
  }, []);

  // Cuenta regresiva 3s solo si hay rostro OK y la sesión fue armada
  useEffect(() => {
    if (!sessionArmed || !faceOK) {
      clearInterval(tickTimerRef.current);
      tickTimerRef.current = null;
      setCounter(null);
      return;
    }

    setCounter(3);
    clearInterval(tickTimerRef.current);
    tickTimerRef.current = setInterval(() => {
      setCounter(prev => {
        if (prev === null) return null;
        const next = prev - 1;
        if (next <= 0) {
          verifyNow();
          clearInterval(tickTimerRef.current);
          tickTimerRef.current = null;
          setSessionArmed(false); // requerirá nuevo click
          return null;
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(tickTimerRef.current);
  }, [faceOK, sessionArmed]);

  // Botón único: iniciar/refrescar verificación
  const armVerification = () => {
    if (loadingVerify) return;
    setResult('');
    setInfoMsg('');
    setBigMsg('');
    setPickedDetail(null);
    setSessionArmed(true);
    setQualityMsg('Buscando rostro…');
  };

  // =======================
  // Utilidades de UI
  // =======================
  const dayLabel = {
    mon: 'Lu', tue: 'Ma', wed: 'Mi', thu: 'Ju', fri: 'Vi', sat: 'Sa', sun: 'Do',
  };

  const formatDays = (days) =>
    Array.isArray(days) && days.length
      ? days.map(d => dayLabel[d] || d).join(', ')
      : 'Sin restricciones';

  const startBtnLabel = sessionArmed
    ? 'Verificación en curso…'
    : (result ? 'Refrescar verificación' : 'Iniciar verificación');

  // =======================
  // Render
  // =======================
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Card sx={{ p: 3 }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' }, gap: 2 }}>
          {/* Columna: Video + Estado */}
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
            <Overlay style={{ border: overlayBorder }} />
            {faceOK && <BigHint>¡Quédese quieto!</BigHint>}
            <canvas ref={canvasRef} style={{ display: 'none' }} />

            {/* Estado + Botón único */}
            <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              {loadingVerify && <CircularProgress size={24} />}
              <Typography variant="body1">
                {counter === null ? 'Esperando rostro…' : `Próxima verificación en ${counter} s`}
              </Typography>
              <Chip
                label={qualityMsg}
                size="small"
                color={faceOK ? 'success' : 'warning'}
                variant={faceOK ? 'filled' : 'outlined'}
              />
              <button
                onClick={armVerification}
                disabled={loadingVerify || sessionArmed}
                style={{
                  padding: '6px 12px',
                  background: sessionArmed ? '#9e9e9e' : '#2e7d32',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 4,
                  cursor: (loadingVerify || sessionArmed) ? 'not-allowed' : 'pointer'
                }}
              >
                {startBtnLabel}
              </button>
            </Box>

            {/* Resultado global (etiqueta superior) */}
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
                      : result === 'already_registered'
                      ? 'info.main'
                      : result === 'picked_by_other'
                      ? 'error.main'
                      : 'text.primary',
                }}
              >
                {result === 'registered'
                  ? '✅ Rostro registrado'
                  : result === 'already_registered'
                  ? 'ℹ️ Registro ya existente'
                  : result === 'picked_by_other'
                  ? '⚠️ Hijo ya retirado'
                  : result === 'not_registered'
                  ? '❌ Rostro NO registrado'
                  : result === 'no_face_detected'
                  ? '⚠️ No se detectó rostro'
                  : '❌ Error en la verificación'}
              </Typography>
            )}
          </Box>

          {/* Columna: Panel de resultados */}
          <Box
            sx={{
              p: 2,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
              minHeight: 200,
            }}
          >
            {/* Banner GRANDE si fue retirado por otra persona */}
            {result === 'picked_by_other' && (
              <Box
                sx={{
                  mb: 2,
                  p: 2,
                  borderRadius: 2,
                  bgcolor: 'error.light',
                  border: '2px solid',
                  borderColor: 'error.main',
                  textAlign: 'center',
                }}
              >
                <Typography variant="h5" sx={{ fontWeight: 900 }} color="error.contrastText">
                  {bigMsg || 'Su hijo ya fue retirado por una persona.'}
                </Typography>

                {/* Detalles opcionales si el backend los envía */}
                {pickedDetail && (
                  <Typography variant="body2" sx={{ mt: 1 }} color="error.contrastText">
                    {pickedDetail.picked_child
                      ? `Estudiante: ${pickedDetail.picked_child.nombre} ${pickedDetail.picked_child.apellido ?? ''}. `
                      : ''}
                    {pickedDetail.picked_by
                      ? `Retirado por: ${pickedDetail.picked_by.name} ${pickedDetail.picked_by.apellido ?? ''} (${pickedDetail.picked_by.tipo}). `
                      : ''}
                    {pickedDetail.picked_at
                      ? `Hora: ${new Date(pickedDetail.picked_at).toLocaleTimeString()}.`
                      : ''}
                  </Typography>
                )}
              </Box>
            )}

            <Typography variant="h6" gutterBottom>
              Persona detectada
            </Typography>
            <Divider sx={{ mb: 2 }} />

            {match ? (
              <>
                <Typography variant="body1">
                  <strong>Persona:</strong> {match.name} {match.apellido}
                </Typography>
                <Typography variant="body1">
                  <strong>CI:</strong> {match.ci}
                </Typography>
                <Typography variant="body1">
                  <strong>Tipo de Familiar:</strong> {match.tipo}
                </Typography>
                {(match.tipo === 'tutor' || match.tipo === 'familiar') && match.descripcion && (
                  <Typography variant="body1">
                    <strong>Descripción:</strong> {match.descripcion}
                  </Typography>
                )}
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle1" sx={{ mb: 1 }}>
                  Hijos vinculados
                </Typography>
                {children.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No hay hijos vinculados o sin reglas.
                  </Typography>
                ) : (
                  <Box sx={{ display: 'grid', gap: 1 }}>
                    {children.map((c) => (
                      <Box
                        key={c.id}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          border: '1px solid',
                          borderColor: 'divider',
                          borderRadius: 1,
                          p: 1,
                          flexWrap: 'wrap'
                        }}
                      >
                        <Box sx={{ minWidth: 0 }}>
                          <Typography variant="body2">
                            <strong>{c.nombre}</strong>
                            {c.apellido ? ` ${c.apellido}` : ''} — Grado: {c.grado ?? '—'}
                          </Typography>

                          {/* Mensaje pequeño si el MISMO tutor ya registró */}
                          {result === 'already_registered' && infoMsg && c.allowed_today && (
                            <Typography
                              variant="caption"
                              color="info.main"
                              sx={{ display: 'block', mt: 0.5 }}
                            >
                              {infoMsg}
                            </Typography>
                          )}
                        </Box>
                        <Tooltip title={`Días: ${formatDays(c.days)}`} arrow placement="top">
                          <Chip
                            size="small"
                            label={c.allowed_today ? 'Permitido hoy' : 'No permitido hoy'}
                            color={c.allowed_today ? 'success' : 'warning'}
                            variant={c.allowed_today ? 'filled' : 'outlined'}
                          />
                        </Tooltip>
                      </Box>
                    ))}
                  </Box>
                )}
              </>
            ) : (
              <Typography variant="body2" color="text.secondary">
                Aún no hay coincidencia. Mantén tu rostro dentro del marco.
              </Typography>
            )}
          </Box>
        </Box>
      </Card>
    </Container>
  );
}
