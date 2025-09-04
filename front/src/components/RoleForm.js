import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container, Card, CardContent, Typography,
  TextField, Button, Stack, Box, Alert
} from '@mui/material';

export default function RoleForm() {
  const [form, setForm] = useState({ name: '', description: '' });
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setErrors({});

    // Preflight CSRF (Sanctum)
    await fetch('http://localhost:8000/sanctum/csrf-cookie', { credentials: 'include' });

    const res = await fetch('http://localhost:8000/api/roles', {
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
      alert('Error al crear el rol.');
      return;
    }

    await res.json();
    navigate('/roles');
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 4, mb: 4 }}>
      <Card>
        <CardContent>
          <Typography variant="h5" gutterBottom>Nuevo Rol</Typography>

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
              label="Descripción"
              name="description"
              value={form.description}
              onChange={handleChange}
              error={!!errors.description}
              helperText={errors.description?.join(' ')}
              fullWidth
              multiline
              minRows={3}
            />

            <Button type="submit" variant="contained" size="large">
              Registrar Rol
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Container>
  );
}
