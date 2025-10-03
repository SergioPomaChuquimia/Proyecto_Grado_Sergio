// src/components/HijoForm.js
import React, { useEffect, useMemo, useState } from 'react';
import {
  Container, Card, CardHeader, CardContent, Divider, Typography,
  TextField, Button, Stack, Alert, Box, Grid, Chip, Avatar,
  FormGroup, FormControlLabel, Checkbox
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ChildCareIcon from '@mui/icons-material/ChildCare';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import SchoolIcon from '@mui/icons-material/School';
import PersonIcon from '@mui/icons-material/Person';

const API_BASE = 'http://localhost:8000';
const DAY_KEYS = ['mon','tue','wed','thu','fri','sat','sun'];
const DAY_LABEL = { mon:'Lu', tue:'Ma', wed:'Mi', thu:'Ju', fri:'Vi', sat:'Sa', sun:'Do' };

export default function HijoForm() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    nombre: '',
    apellido: '',
    grado: '',
    fecha_nac: '',
    ci: '',  // Nuevo campo CI
    personal_ids: [],
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [personals, setPersonals] = useState([]);

  // NUEVO: reglas de días por tutor (opcional) -> { [personal_id]: string[] }
  const [rulesByTutor, setRulesByTutor] = useState({});

  // Entrada por CI
  const [ciTutor, setCiTutor] = useState('');
  const [ciError, setCiError] = useState('');

  useEffect(() => {
    fetch(`${API_BASE}/api/personals`, { credentials: 'include' })
      .then(r => r.json())
      .then(data => setPersonals(data || []))
      .catch(() => setPersonals([]));
  }, []);

  const options = useMemo(
    () => personals.map(p => ({ id: p.id, label: `${p.name} (${p.email})`, ci: String(p.ci ?? '').trim() })),
    [personals]
  );

  const byCi = useMemo(() => {
    const m = new Map();
    personals.forEach(p => m.set(String(p.ci ?? '').trim(), p));
    return m;
  }, [personals]);

  const selectedOptions = useMemo(
    () => options.filter(o => form.personal_ids.includes(o.id)),
    [options, form.personal_ids]
  );

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const addTutorByCi = () => {
    setCiError('');
    const ci = ciTutor.trim();
    if (!ci) return setCiError('Ingrese un CI.');
    const p = byCi.get(ci);
    if (!p) return setCiError('No se encontró un tutor con ese CI.');
    if (form.personal_ids.includes(p.id)) return setCiError('Este tutor ya está agregado.');
    if (form.personal_ids.length >= 4) return setCiError('Máximo 4 tutores.');

    setForm(f => ({ ...f, personal_ids: [...f.personal_ids, p.id] }));
    // inicializa regla vacía (opcional)
    setRulesByTutor(prev => ({ ...prev, [p.id]: prev[p.id] ?? [] }));
    setCiTutor('');
  };

  const removeTutor = (id) => {
    setForm(f => ({ ...f, personal_ids: f.personal_ids.filter(x => x !== id) }));
  };

  // toggle de un día para un tutor
  const toggleDay = (personalId, dayKey) => {
    setRulesByTutor(prev => {
      const days = prev[personalId] || [];
      const exists = days.includes(dayKey);
      const nextDays = exists ? days.filter(d => d !== dayKey) : [...days, dayKey];
      return { ...prev, [personalId]: nextDays };
    });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setErrors({});
    setSaving(true);

    try {
      // CSRF
      await fetch(`${API_BASE}/sanctum/csrf-cookie`, { credentials: 'include' });

      // 1) Crear hijo
      const res = await fetch(`${API_BASE}/api/hijos`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(form),
      });

      if (res.status === 422) {
        const payload = await res.json();
        setErrors(payload.errors || { _msg: payload.message || 'Error de validación' });
        setSaving(false);
        return;
      }
      if (!res.ok) throw new Error('create_child_failed');

      const nuevo = await res.json();
      const hijoId = nuevo?.id;
      if (!hijoId) throw new Error('missing_id');

      // 2) Crear reglas solo donde haya días marcados (opcional)
      for (const pid of form.personal_ids) {
        const days = rulesByTutor[pid] || [];
        if (days.length > 0) {
          const rr = await fetch(`${API_BASE}/api/hijos/${hijoId}/pickup-rules`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            body: JSON.stringify({ personal_id: pid, allowed_days: days }),
          });
          // si falla una, continuo para no romper el flujo
          // (opcional: manejar errores específicos)
          await rr.text().catch(() => {});
        }
      }

      navigate('/hijos');
    } catch (err) {
      setErrors({ _msg: 'Error de red.' });
      setSaving(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 6, mb: 6 }}>
      <Card elevation={2} sx={{ borderRadius: 4, overflow: 'hidden' }}>
        <CardHeader
          title={
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar sx={{ bgcolor: 'primary.main' }}><ChildCareIcon /></Avatar>
              <Box>
                <Typography variant="h5" fontWeight={700}>Registro de Hijo</Typography>
                <Typography variant="body2" color="text.secondary">Complete los datos y (opcional) configure recojos especiales</Typography>
              </Box>
            </Stack>
          }
          action={
            form.personal_ids?.length ? (
              <Chip sx={{ mr: 2 }} color="primary" variant="outlined"
                label={`${form.personal_ids.length} tutor${form.personal_ids.length === 1 ? '' : 'es'}`} size="small" />
            ) : null
          }
        />

        <Divider />

        <CardContent>
          {errors._msg && <Alert severity="error" sx={{ mb: 3 }}>{errors._msg}</Alert>}

          <Stack component="form" spacing={3} onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Nombre" name="nombre" value={form.nombre} onChange={handleChange}
                  error={!!errors.nombre} helperText={errors.nombre?.join?.(' ') || ''} fullWidth required size="small"
                  InputProps={{ startAdornment: <PersonIcon fontSize="small" sx={{ mr: 1, color: 'text.disabled' }} /> }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Apellido" name="apellido" value={form.apellido} onChange={handleChange}
                  error={!!errors.apellido} helperText={errors.apellido?.join?.(' ') || ''} fullWidth required size="small"
                  InputProps={{ startAdornment: <PersonIcon fontSize="small" sx={{ mr: 1, color: 'text.disabled' }} /> }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  label="Grado" name="grado" value={form.grado} onChange={handleChange}
                  error={!!errors.grado} helperText={errors.grado?.join?.(' ') || ''} fullWidth size="small"
                  InputProps={{ startAdornment: <SchoolIcon fontSize="small" sx={{ mr: 1, color: 'text.disabled' }} /> }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Fecha de Nacimiento" name="fecha_nac" type="date" value={form.fecha_nac}
                  onChange={handleChange} error={!!errors.fecha_nac} helperText={errors.fecha_nac?.join?.(' ') || ''}
                  InputLabelProps={{ shrink: true }} fullWidth size="small"
                  InputProps={{ startAdornment: <CalendarMonthIcon fontSize="small" sx={{ mr: 1, color: 'text.disabled' }} /> }}
                />
              </Grid>

              {/* Nuevo campo CI */}
              <Grid item xs={12} md={6}>
                <TextField
                  label="CI" name="ci" value={form.ci} onChange={handleChange}
                  error={!!errors.ci} helperText={errors.ci?.join?.(' ') || ''} fullWidth required size="small"
                  InputProps={{ startAdornment: <PersonIcon fontSize="small" sx={{ mr: 1, color: 'text.disabled' }} /> }}
                />
              </Grid>
            </Grid>

            {/* Tutores por CI */}
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ xs: 'stretch', sm: 'flex-start' }}>
              <TextField
                label="CI del tutor" value={ciTutor} onChange={(e) => setCiTutor(e.target.value)}
                error={!!ciError || !!errors.personal_ids} helperText={ciError || errors.personal_ids?.join?.(' ') || ''}
                fullWidth size="small"
              />
              <Button onClick={addTutorByCi} variant="contained" sx={{ whiteSpace: 'nowrap' }}>
                Agregar por CI
              </Button>
            </Stack>

            {selectedOptions.length > 0 && (
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {selectedOptions.map(opt => (
                  <Chip key={opt.id} label={opt.label} onDelete={() => removeTutor(opt.id)} color="secondary" />
                ))}
              </Stack>
            )}

            {/* NUEVO: Casos especiales por tutor (opcional) */}
            {selectedOptions.length > 0 && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>
                  Casos especiales (opcional) — días permitidos por tutor
                </Typography>
                <Stack spacing={1.5}>
                  {selectedOptions.map(opt => {
                    const pid = opt.id;
                    const days = rulesByTutor[pid] || [];
                    return (
                      <Box key={pid} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1.5 }}>
                        <Typography variant="body2" sx={{ mb: 1 }}><strong>{opt.label}</strong></Typography>
                        <FormGroup row>
                          {DAY_KEYS.map(k => (
                            <FormControlLabel
                              key={k}
                              control={
                                <Checkbox
                                  checked={days.includes(k)}
                                  onChange={() => toggleDay(pid, k)}
                                  size="small"
                                />
                              }
                              label={DAY_LABEL[k]}
                            />
                          ))}
                        </FormGroup>
                        <Typography variant="caption" color="text.secondary">
                          Si no marcas nada, este tutor no tendrá restricción (se permite por defecto).
                        </Typography>
                      </Box>
                    );
                  })}
                </Stack>
              </Box>
            )}

            <Divider sx={{ my: 1 }} />
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
              <Button variant="outlined" onClick={() => navigate(-1)}>Cancelar</Button>
              <Button type="submit" variant="contained" disabled={saving}>
                {saving ? 'Guardando…' : 'Registrar'}
              </Button>
            </Box>
          </Stack>
        </CardContent>
      </Card>
    </Container>
  );
}
