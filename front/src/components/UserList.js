import React, { useState, useEffect, useMemo } from 'react';
import {
  Container, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TablePagination, Stack, IconButton, Avatar, Typography, TextField, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Alert, MenuItem, CircularProgress, Box
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

const API_BASE = 'http://localhost:8000';

function getPhotoSrc(photo) {
  if (!photo) return null;
  if (photo.startsWith('data:image')) return photo;
  return `${API_BASE}/storage/${photo}`;
}

export default function UserList() {
  const [rows, setRows] = useState(null);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);
  const [rpp, setRpp] = useState(10);

  const [openEdit, setOpenEdit] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [editForm, setEditForm] = useState({
    id: null,
    name: '',
    apellido: '',
    email: '',
    phone: '',
    telefono: '',
    ci: '',
    address: '',
    usuario: '',
    estado: 'activo',
    tipo: '',      // nuevo campo
    descripcion: '', // nuevo campo
  });

  const fetchRows = () => {
    fetch(`${API_BASE}/api/personals`, { credentials: 'include' })
      .then(r => r.json())
      .then(setRows)
      .catch(() => setRows([]));
  };

  useEffect(() => { fetchRows(); }, []);

  const filtered = useMemo(() => {
    if (!rows) return [];
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(r =>
      (r.name || '').toLowerCase().includes(q) ||
      (r.apellido || '').toLowerCase().includes(q) ||
      (r.email || '').toLowerCase().includes(q) ||
      (r.usuario || '').toLowerCase().includes(q) ||
      (r.ci || '').toLowerCase().includes(q)
    );
  }, [rows, query]);

  const paged = useMemo(() => {
    const start = page * rpp;
    return filtered.slice(start, start + rpp);
  }, [filtered, page, rpp]);

  const openEditDialog = (u) => {
    setErrors({});
    setEditForm({
      id: u.id,
      name: u.name || '',
      apellido: u.apellido || '',
      email: u.email || '',
      phone: u.phone || '',
      telefono: u.telefono || '',
      ci: u.ci || '',
      address: u.address || '',
      usuario: u.usuario || '',
      estado: u.estado || 'activo',
      tipo: u.tipo || '', // nuevo campo
      descripcion: u.descripcion || '', // nuevo campo
    });
    setOpenEdit(true);
  };
  const closeEditDialog = () => setOpenEdit(false);
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm(f => ({ ...f, [name]: value }));
  };

  const saveEdit = async () => {
    setSaving(true);
    setErrors({});
    try {
      await fetch(`${API_BASE}/sanctum/csrf-cookie`, { credentials: 'include' });

      const payload = {
        name: editForm.name,
        apellido: editForm.apellido || null,
        email: editForm.email,
        phone: editForm.phone || null,
        telefono: editForm.telefono || null,
        ci: editForm.ci || null,
        address: editForm.address || null,
        usuario: editForm.usuario || null,
        estado: editForm.estado || 'activo',
        tipo: editForm.tipo || '',  // agregar tipo
        descripcion: editForm.descripcion || '',  // agregar descripcion
      };

      const res = await fetch(`${API_BASE}/api/personals/${editForm.id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
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
    const ok = window.confirm('¿Eliminar este Padre de Familia? Esta acción no se puede deshacer.');
    if (!ok) return;
    try {
      await fetch(`${API_BASE}/sanctum/csrf-cookie`, { credentials: 'include' });
      const res = await fetch(`${API_BASE}/api/personals/${id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: { Accept: 'application/json' },
      });
      if (!res.ok && res.status !== 204) {
        alert('No se pudo eliminar.');
        return;
      }
      setRows(prev => prev.filter(x => x.id !== id));
    } catch (e) {
      console.error(e);
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
        <Typography variant="h4">Padre de Familia / Familiares</Typography>
        <TextField
          size="small"
          placeholder="Buscar por nombre, email, CI, usuario…"
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
                <TableCell>Foto</TableCell>
                <TableCell>Nombre</TableCell>
                <TableCell>Apellido</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>CI</TableCell>
                <TableCell>Usuario</TableCell>
                <TableCell>Teléfono</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell>Tipo</TableCell> {/* Nueva columna */}
                <TableCell>Descripción</TableCell> {/* Nueva columna */}
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paged.map((u) => {
                const src = getPhotoSrc(u.photo);
                return (
                  <TableRow hover key={u.id}>
                    <TableCell>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Avatar src={src || undefined} alt={u.name} sx={{ width: 40, height: 40 }} />
                      </Stack>
                    </TableCell>
                    <TableCell>{u.name || '—'}</TableCell>
                    <TableCell>{u.apellido || '—'}</TableCell>
                    <TableCell>{u.email || '—'}</TableCell>
                    <TableCell>{u.ci || '—'}</TableCell>
                    <TableCell>{u.usuario || '—'}</TableCell>
                    <TableCell>{u.telefono || u.phone || '—'}</TableCell>
                    <TableCell>
                      <Chip
                        label={u.estado || 'activo'}
                        color={u.estado === 'inactivo' ? 'default' : 'success'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{u.tipo || '—'}</TableCell> {/* Mostrar tipo */}
                    <TableCell>{u.descripcion || '—'}</TableCell> {/* Mostrar descripcion */}
                    <TableCell align="right">
                      <IconButton aria-label="editar" onClick={() => openEditDialog(u)} size="small">
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton aria-label="eliminar" onClick={() => handleDelete(u.id)} size="small" color="error">
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
              {paged.length === 0 && (
                <TableRow>
                  <TableCell colSpan={11}>
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

      <Dialog open={openEdit} onClose={closeEditDialog} fullWidth maxWidth="sm">
        <DialogTitle>Editar Padre de Familia</DialogTitle>
        <DialogContent dividers>
          {errors._msg && <Alert severity="error" sx={{ mb: 2 }}>{errors._msg}</Alert>}
          <Stack spacing={2}>
            <TextField
              label="Nombre" name="name" value={editForm.name} onChange={handleEditChange}
              error={!!errors.name} helperText={errors.name?.join?.(' ') || ''} required fullWidth
            />
            <TextField
              label="Apellido" name="apellido" value={editForm.apellido} onChange={handleEditChange}
              error={!!errors.apellido} helperText={errors.apellido?.join?.(' ') || ''} fullWidth
            />
            <TextField
              label="Correo" name="email" type="email" value={editForm.email} onChange={handleEditChange}
              error={!!errors.email} helperText={errors.email?.join?.(' ') || ''} required fullWidth
            />
            <TextField
              label="Teléfono (phone)" name="phone" value={editForm.phone} onChange={handleEditChange}
              error={!!errors.phone} helperText={errors.phone?.join?.(' ') || ''} fullWidth
            />
            <TextField
              label="Teléfono (nuevo)" name="telefono" value={editForm.telefono} onChange={handleEditChange}
              error={!!errors.telefono} helperText={errors.telefono?.join?.(' ') || ''} fullWidth
            />
            <TextField
              label="CI" name="ci" value={editForm.ci} onChange={handleEditChange}
              error={!!errors.ci} helperText={errors.ci?.join?.(' ') || ''} fullWidth
            />
            <TextField
              label="Dirección" name="address" value={editForm.address} onChange={handleEditChange}
              error={!!errors.address} helperText={errors.address?.join?.(' ') || ''} fullWidth
            />
            <TextField
              label="Usuario" name="usuario" value={editForm.usuario} onChange={handleEditChange}
              error={!!errors.usuario} helperText={errors.usuario?.join?.(' ') || ''} fullWidth
            />
            <TextField select label="Estado" name="estado" value={editForm.estado} onChange={handleEditChange} fullWidth>
              <MenuItem value="activo">activo</MenuItem>
              <MenuItem value="inactivo">inactivo</MenuItem>
            </TextField>

            {/* Tipo */}
            <TextField select label="Tipo" name="tipo" value={editForm.tipo} onChange={handleEditChange} fullWidth>
              <MenuItem value="padre">Padre</MenuItem>
              <MenuItem value="madre">Madre</MenuItem>
              <MenuItem value="tutor">Tutor</MenuItem>
              <MenuItem value="familiar">Familiar</MenuItem>
            </TextField>

            {/* Descripción */}
            <TextField
              label="Descripción" name="descripcion" value={editForm.descripcion} onChange={handleEditChange}
              error={!!errors.descripcion} helperText={errors.descripcion?.join?.(' ') || ''} fullWidth
              multiline rows={4}
            />
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
