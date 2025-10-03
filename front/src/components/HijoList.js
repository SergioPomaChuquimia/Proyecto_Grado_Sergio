// src/components/HijoList.js
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  Container, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TablePagination, Stack, IconButton, Typography, TextField, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Alert, CircularProgress, Box,
  Avatar, Tooltip, Divider
} from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

const API_BASE = 'http://localhost:8000';

// ---------- Utilidades de foto (igual que antes) ----------
function getPhotoSrc(photo) {
  if (!photo) return null;
  if (photo.startsWith('data:image')) return photo;
  return `${API_BASE}/storage/${photo}`;
}

// ---------- Normalización de días ----------
const CANON_DAYS = ['mon','tue','wed','thu','fri','sat','sun']; // formato canónico backend
const ES_UI = ['Lu','Ma','Mi','Ju','Vi','Sa','Do'];             // etiquetas UI
const ES_SHORT = ['Lu','Ma','Mi','Ju','Vi','Sa','Do'];
const ES_LONG  = ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'];
const EN_SHORT = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
const EN_LONG  = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];

const norm = (s) => String(s).normalize('NFD').replace(/\p{Diacritic}/gu,'').toLowerCase();

// string|number -> índice 0..6 (0=mon)
function dayValueToIndex(v) {
  if (typeof v === 'number') {
    if (v >= 0 && v <= 6) return v;
    if (v >= 1 && v <= 7) return v - 1;
  }
  const n = norm(v);
  let i = CANON_DAYS.indexOf(n);        if (i >= 0) return i;
  i = EN_SHORT.map(norm).indexOf(n);    if (i >= 0) return i;
  i = EN_LONG.map(norm).indexOf(n);     if (i >= 0) return i;
  i = ES_SHORT.map(norm).indexOf(n);    if (i >= 0) return i;
  i = ES_LONG.map(norm).indexOf(n);     if (i >= 0) return i;
  return -1;
}

// payload (array) -> índices 0..6
function payloadToIdxs(arr) {
  if (!Array.isArray(arr)) return [];
  const out = [];
  for (const v of arr) {
    const idx = dayValueToIndex(v);
    if (idx >= 0) out.push(idx);
  }
  return Array.from(new Set(out)).sort((a,b)=>a-b);
}

// índices -> payload canónico (minúsculas inglés corto)
function idxsToPayload(idxs) {
  return (Array.isArray(idxs) ? idxs : [])
    .map(i => CANON_DAYS[i])
    .filter(Boolean);
}

export default function HijoList() {
  const [rows, setRows] = useState(null);
  const [personals, setPersonals] = useState([]);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);
  const [rpp, setRpp] = useState(10);

  // edición
  const [openEdit, setOpenEdit] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [editForm, setEditForm] = useState({
    id: null,
    nombre: '',
    apellido: '',
    grado: '',
    fecha_nac: '',
    estado: 'activo',
    ci: '',  // Nuevo campo CI
    personal_ids: [],
  });

  // Nuevos: estado para reglas
  const [ruleIdByTutor, setRuleIdByTutor] = useState({});
  const [pickupDaysByTutor, setPickupDaysByTutor] = useState({});

  const fetchRows = useCallback(() => {
    fetch(`${API_BASE}/api/hijos`, { credentials: 'include' })
      .then((r) => r.json())
      .then(setRows)
      .catch(() => setRows([]));
  }, []);

  const fetchPersonals = useCallback(() => {
    fetch(`${API_BASE}/api/personals`, { credentials: 'include' })
      .then((r) => r.json())
      .then(setPersonals)
      .catch(() => setPersonals([]));
  }, []);

  useEffect(() => {
    fetchRows();
    fetchPersonals();
  }, [fetchRows, fetchPersonals]);

  const filtered = useMemo(() => {
    if (!rows) return [];
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      (r.nombre || '').toLowerCase().includes(q) ||
      (r.apellido || '').toLowerCase().includes(q) ||
      (r.grado || '').toLowerCase().includes(q) ||
      (r.estado || '').toLowerCase().includes(q)
    );
  }, [rows, query]);

  const paged = useMemo(() => {
    const start = page * rpp;
    return filtered.slice(start, start + rpp);
  }, [filtered, page, rpp]);

  const tutorOptions = useMemo(
    () => personals.map((p) => ({ id: p.id, label: `${p.name} (${p.email})` })),
    [personals]
  );

 // --- abrir/cerrar diálogo ---
const openEditDialog = async (h) => {
  setErrors({});
  const selectedTutorIds = (h.personals || []).map(p => p.id).slice(0, 4);

  setEditForm({
    id: h.id,
    nombre: h.nombre || '',
    apellido: h.apellido || '',
    grado: h.grado || '',
    fecha_nac: h.fecha_nac || '',
    estado: h.estado || 'activo',
    ci: h.ci || '',  // Añadir el CI al estado del formulario
    personal_ids: selectedTutorIds,
  });

  try {
    const r = await fetch(`${API_BASE}/api/hijos/${h.id}/pickup-rules`, { credentials: 'include' });
    const data = r.ok ? await r.json() : { rules: [] };
    const rules = Array.isArray(data) ? data : (data.rules || []);

    const ridMap = {};
    const daysMap = {};

    for (const rule of rules) {
      const pid = rule.personal_id;

      let arr = rule.allowed_days;
      if (!Array.isArray(arr)) {
        if (typeof arr === 'string') {
          try { arr = JSON.parse(arr); } catch { arr = []; }
        } else {
          arr = [];
        }
      }

      const idxs = payloadToIdxs(arr);
      ridMap[pid] = rule.id;
      daysMap[pid] = new Set(idxs);
    }

    for (const pid of selectedTutorIds) {
      if (!daysMap[pid]) daysMap[pid] = new Set();
    }

    setRuleIdByTutor(ridMap);
    setPickupDaysByTutor(daysMap);
  } catch {
    const empty = {};
    for (const pid of selectedTutorIds) empty[pid] = new Set();
    setRuleIdByTutor({});
    setPickupDaysByTutor(empty);
  }

  setOpenEdit(true);
};

  const closeEditDialog = () => setOpenEdit(false);

  // --- cambios básicos hijo ---
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((f) => ({ ...f, [name]: value }));
  };

  // --- helpers de reglas ---
  const postRule = (childId, pid, idxs) => {
    const body = { personal_id: pid, allowed_days: idxsToPayload(idxs) };
    return fetch(`${API_BASE}/api/hijos/${childId}/pickup-rules`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body),
    });
  };

  const putRule = (childId, ruleId, pid, idxs) => {
    const body = { personal_id: pid, allowed_days: idxsToPayload(idxs) };
    return fetch(`${API_BASE}/api/hijos/${childId}/pickup-rules/${ruleId}`, {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body),
    });
  };

  const delRule = (childId, ruleId) => {
    return fetch(`${API_BASE}/api/hijos/${childId}/pickup-rules/${ruleId}`, {
      method: 'DELETE',
      credentials: 'include',
      headers: { Accept: 'application/json' },
    });
  };

  // --- guardar edición ---
  const saveEdit = async () => {
    setSaving(true);
    setErrors({});
    const childId = editForm.id;

    try {
      await fetch(`${API_BASE}/sanctum/csrf-cookie`, { credentials: 'include' });

      const payloadChild = {
        nombre: editForm.nombre,
        apellido: editForm.apellido || null,
        grado: editForm.grado || null,
        fecha_nac: editForm.fecha_nac || null,
        estado: editForm.estado || 'activo',
        ci: editForm.ci,  // Incluir CI al enviar
        personal_ids: editForm.personal_ids,
      };

      const res = await fetch(`${API_BASE}/api/hijos/${childId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payloadChild),
      });

      if (res.status === 422) {
        const data = await res.json();
        setErrors(data.errors || { _msg: data.message || 'Error de validación' });
        setSaving(false);
        return;
      }
      if (!res.ok) {
        setErrors({ _msg: 'No se pudo guardar los cambios.' });
        setSaving(false);
        return;
      }

      const selectedIds = new Set(editForm.personal_ids);
      const ops = [];

      for (const pid of selectedIds) {
        const idxs = Array.from(pickupDaysByTutor[pid] || []);
        const ruleId = ruleIdByTutor[pid];

        if (idxs.length === 0) {
          if (ruleId) {
            ops.push(delRule(childId, ruleId));
          }
        } else {
          if (ruleId) {
            ops.push(putRule(childId, ruleId, pid, idxs));
          } else {
            ops.push(postRule(childId, pid, idxs));
          }
        }
      }

      for (const [pidStr, ruleId] of Object.entries(ruleIdByTutor)) {
        const pid = parseInt(pidStr, 10);
        if (!selectedIds.has(pid)) {
          ops.push(delRule(childId, ruleId));
        }
      }

      const results = await Promise.allSettled(ops);
      const bad = results.find(r => r.status === 'rejected' || (r.value && !r.value.ok));
      if (bad && bad.value && bad.value.status === 422) {
        const data = await bad.value.json().catch(()=>null);
        setErrors({ _msg: data?.message || 'Error de validación en reglas', ...(data?.errors||{}) });
        setSaving(false);
        return;
      }

      setOpenEdit(false);
      setSaving(false);
      fetchRows();
    } catch (e) {
      console.error(e);
      setErrors({ _msg: 'Error de red.' });
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar este hijo? Esta acción no se puede deshacer.')) return;
    try {
      await fetch(`${API_BASE}/sanctum/csrf-cookie`, { credentials: 'include' });
      const res = await fetch(`${API_BASE}/api/hijos/${id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: { Accept: 'application/json' },
      });
      if (!res.ok && res.status !== 204) {
        alert('No se pudo eliminar.');
        return;
      }
      setRows((prev) => prev.filter((x) => x.id !== id));
    } catch {
      alert('Error de red al eliminar.');
    }
  };

  if (rows === null) {
    return (
      <Box sx={{ height: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container sx={{ py: 4 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Typography variant="h4">Hijos</Typography>
        <TextField
          size="small"
          placeholder="Buscar por nombre, apellido, grado, estado…"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setPage(0); }}
          sx={{ width: 360 }}
        />
      </Stack>

      <Paper variant="outlined" sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: 560 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell>Nombre</TableCell>
                <TableCell>Apellido</TableCell>
                <TableCell>CI</TableCell> {/* Nueva columna para el CI */}
                <TableCell>Grado</TableCell>
                <TableCell>Fecha Nac.</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell>Tutores</TableCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paged.map((h) => {
                const tutors = h.personals || [];
                const visible = tutors.slice(0, 2);
                const extra = Math.max(0, tutors.length - 2);
                return (
                  <TableRow hover key={h.id}>
                    <TableCell>{h.nombre}</TableCell>
                    <TableCell>{h.apellido}</TableCell>
                    <TableCell>{h.ci}</TableCell> {/* Mostrar CI */}
                    <TableCell>{h.grado || '—'}</TableCell>
                    <TableCell>{h.fecha_nac || '—'}</TableCell>
                    <TableCell>
                      <Chip
                        label={h.estado || 'activo'}
                        color={h.estado === 'inactivo' ? 'default' : 'success'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
                        {visible.map((p) => {
                          const src = getPhotoSrc(p.photo);
                          return (
                            <Stack
                              key={p.id}
                              direction="row"
                              spacing={1}
                              alignItems="center"
                              sx={{ px: 1, py: 0.5, borderRadius: 1, bgcolor: 'grey.50', border: '1px solid', borderColor: 'grey.200' }}
                            >
                              <Avatar src={src || undefined} alt={p.name} sx={{ width: 28, height: 28, fontSize: 14 }} >
                                {p.name?.[0]?.toUpperCase() || '?'}
                              </Avatar>
                              <Tooltip title={p.email || ''}>
                                <Typography variant="body2" noWrap sx={{ maxWidth: 140 }}>
                                  {p.name}
                                </Typography>
                              </Tooltip>
                            </Stack>
                          );
                        })}
                        {extra > 0 && <Chip label={`+${extra}`} size="small" />}
                      </Stack>
                    </TableCell>
                    <TableCell align="right">
                      <IconButton aria-label="editar" onClick={() => openEditDialog(h)} size="small">
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton aria-label="eliminar" onClick={() => handleDelete(h.id)} size="small" color="error">
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
              {paged.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7}>
                    <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 4 }}>
                      Sin resultados.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={filtered.length}
          rowsPerPage={rpp}
          page={page}
          onPageChange={(_, p) => setPage(p)}
          onRowsPerPageChange={(e) => { setRpp(parseInt(e.target.value, 10)); setPage(0); }}
        />
      </Paper>

      {/* Diálogo de edición */}
      <Dialog open={openEdit} onClose={closeEditDialog} fullWidth maxWidth="sm">
        <DialogTitle>Editar Hijo</DialogTitle>
        <DialogContent dividers>
          {errors._msg && <Alert severity="error" sx={{ mb: 2 }}>{errors._msg}</Alert>}

          <Stack spacing={2}>
            <TextField
              label="Nombre" name="nombre" value={editForm.nombre} onChange={handleEditChange}
              error={!!errors.nombre} helperText={errors.nombre?.join?.(' ') || ''} required fullWidth
            />
            <TextField
              label="Apellido" name="apellido" value={editForm.apellido} onChange={handleEditChange}
              error={!!errors.apellido} helperText={errors.apellido?.join?.(' ') || ''} required fullWidth
            />
            <TextField
              label="CI" name="ci" value={editForm.ci} onChange={handleEditChange}
              error={!!errors.ci} helperText={errors.ci?.join?.(' ') || ''} required fullWidth
            />
            <TextField
              label="Grado" name="grado" value={editForm.grado} onChange={handleEditChange}
              error={!!errors.grado} helperText={errors.grado?.join?.(' ') || ''} fullWidth
            />
            <TextField
              label="Fecha de Nacimiento" name="fecha_nac" type="date" value={editForm.fecha_nac || ''}
              onChange={handleEditChange} error={!!errors.fecha_nac} helperText={errors.fecha_nac?.join?.(' ') || ''}
              InputLabelProps={{ shrink: true }} fullWidth
            />

            <Autocomplete
              multiple
              options={tutorOptions}
              value={tutorOptions.filter((o) => editForm.personal_ids.includes(o.id))}
              onChange={(_, newVal) => {
                const limited = newVal.slice(0, 4);
                const newIds = limited.map(v => v.id);
                setEditForm((f) => ({ ...f, personal_ids: newIds }));
                setPickupDaysByTutor(prev => {
                  const next = { ...prev };
                  for (const id of newIds) {
                    if (!next[id]) next[id] = new Set();
                  }
                  return next;
                });
              }}
              getOptionLabel={(o) => o.label}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Tutores (máximo 4)"
                  error={!!errors.personal_ids}
                  helperText={errors.personal_ids?.join?.(' ') || ''}
                />
              )}
            />

            {/* Casos especiales (opcional) */}
            <Divider sx={{ mt: 1 }} />
            <Typography variant="subtitle1" sx={{ mt: 1 }}>
              Casos especiales (opcional): días permitidos por tutor
            </Typography>

            <Stack spacing={1}>
              {editForm.personal_ids.length === 0 && (
                <Typography variant="body2" color="text.secondary">
                  Selecciona al menos un tutor para configurar los días.
                </Typography>
              )}

              {editForm.personal_ids.map((pid) => {
                const opt = tutorOptions.find(o => o.id === pid);
                const label = opt?.label || `Tutor ${pid}`;
                const set = pickupDaysByTutor[pid] || new Set();

                return (
                  <Box key={pid} sx={{ p: 1, border: '1px dashed', borderColor: 'divider', borderRadius: 1 }}>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      {label}
                    </Typography>
                    <Stack direction="row" flexWrap="wrap">
                      {ES_UI.map((txt, idx) => {
                        const selected = set.has(idx);
                        return (
                          <Chip
                            key={idx}
                            label={txt}
                            color={selected ? 'primary' : 'default'}
                            variant={selected ? 'filled' : 'outlined'}
                            onClick={() => {
                              setPickupDaysByTutor(prev => {
                                const next = { ...prev };
                                const cur = new Set(next[pid] || []);
                                if (cur.has(idx)) cur.delete(idx); else cur.add(idx);
                                next[pid] = cur;
                                return next;
                              });
                            }}
                            sx={{ mr: 0.75, mb: 0.75 }}
                          />
                        );
                      })}
                    </Stack>
                  </Box>
                );
              })}
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeEditDialog}>Cancelar</Button>
          <Button variant="contained" onClick={saveEdit} disabled={saving}>
            {saving ? 'Guardando…' : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
