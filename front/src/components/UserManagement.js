// src/components/UserManagement.js
import React, { useEffect, useState } from 'react';
import {
  Container,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Button,
  Typography,
  CircularProgress,
  Select,
  MenuItem,
  Box,
} from '@mui/material';
import api from '../api';
import { unlockUser } from '../auth';

export default function UserManagement({ currentUser }) {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/api/users');
      setUsers(res.data || []);
    } catch (err) {
      console.error('Error al obtener usuarios:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const res = await api.get('/api/roles');
      setRoles(res.data || []);
    } catch (err) {
      console.error('Error al obtener roles:', err);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, []);

  const deleteUser = async (id) => {
    try {
      await api.delete(`/api/users/${id}`);
      setUsers(prev => prev.filter(u => u.id !== id));
    } catch (err) {
      console.error('Error al eliminar usuario:', err);
    }
  };

  const assignRole = async (id, roleId) => {
    try {
      await api.put(`/api/users/${id}/role`, { role_id: roleId });
      fetchUsers();
    } catch (err) {
      console.error('Error al asignar rol:', err);
    }
  };

  if (loading) {
    return (
      <Box sx={{ py: 10, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  const directorUser = users.find(u => (u.role?.name || '').toLowerCase() === 'director');

  return (
    <Container sx={{ py: 3 }}>
      <Typography variant="h5" gutterBottom>
        Gestión de Usuarios
      </Typography>

      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Nombre</TableCell>
            <TableCell>Email</TableCell>
            <TableCell>Rol</TableCell>
            <TableCell align="center">Acciones</TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {users.map((user) => {
            const isDirector = (user.role?.name || '').toLowerCase() === 'director';
            const isSelf = currentUser?.id === user.id;

            return (
              <TableRow key={user.id} hover>
                <TableCell>{user.name || '—'}</TableCell>
                <TableCell>{user.email || '—'}</TableCell>

                <TableCell>
                  <Select
                    value={user.role ? user.role.id : ''}
                    onChange={(e) => assignRole(user.id, e.target.value)}
                    displayEmpty
                    size="small"
                    sx={{ minWidth: 180 }}
                  >
                    <MenuItem value="" disabled>
                      Selecciona un rol
                    </MenuItem>
                    {roles.map((role) => {
                      const roleName = (role.name || '').toLowerCase();
                      // Permitir solo un "director"
                      if (roleName === 'director' && directorUser && directorUser.id !== user.id) {
                        return null;
                      }
                      return (
                        <MenuItem key={role.id} value={role.id}>
                          {role.name}
                        </MenuItem>
                      );
                    })}
                  </Select>
                </TableCell>

                <TableCell align="center">
                  {user.is_blocked && (
                    <Button
                      variant="contained"
                      color="primary"
                      size="small"
                      sx={{ mr: 1 }}
                      onClick={async () => {
                        try {
                          await unlockUser(user.id);
                          alert('✅ Usuario desbloqueado con éxito');
                          fetchUsers();
                        } catch {
                          alert('❌ Error al desbloquear usuario');
                        }
                      }}
                    >
                      Desbloquear
                    </Button>
                  )}

                  <Button
                    variant="outlined"
                    color="error"
                    size="small"
                    onClick={() => deleteUser(user.id)}
                    disabled={isDirector || isSelf}
                  >
                    Eliminar
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Container>
  );
}
