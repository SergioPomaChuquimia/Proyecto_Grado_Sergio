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
} from '@mui/material';
import api from '../api';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await api.get("/api/users");
      setUsers(res.data);
    } catch (err) {
      console.error("Error al obtener usuarios:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const res = await api.get("/api/roles");
      setRoles(res.data);
    } catch (err) {
      console.error("Error al obtener roles:", err);
    }
  };

  const deleteUser = async (id) => {
    try {
      await api.delete(`/api/users/${id}`);
      setUsers(users.filter(u => u.id !== id));
    } catch (err) {
      console.error("Error al eliminar usuario:", err);
    }
  };

  const assignRole = async (id, roleId) => {
    try {
      await api.put(`/api/users/${id}/role`, { role_id: roleId });
      fetchUsers();
    } catch (err) {
      console.error("Error al asignar rol:", err);
    }
  };

  if (loading) return <CircularProgress />;

  // Ver si ya existe un DIRECTOR en todo el sistema (insensible a mayúsculas)
  const directorUser = users.find(
    u => u.role && u.role.name && u.role.name.toLowerCase() === "director"
  );

  return (
    <Container>
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
            const isAdmin = user.email === "admin@gmail.com";
            const isDirector =
              user.role && user.role.name && user.role.name.toLowerCase() === "director";

            return (
              <TableRow key={user.id}>
                <TableCell>{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>

                {/* Selector dinámico de roles */}
                <TableCell>
                  {isAdmin ? (
                    <Typography variant="body2" color="textSecondary">
                      {user.role ? user.role.name : "Admin"}
                    </Typography>
                  ) : (
                    <Select
                      value={user.role ? user.role.id : ""}
                      onChange={(e) => assignRole(user.id, e.target.value)}
                      displayEmpty
                      size="small"
                      sx={{ minWidth: 150 }}
                    >
                      <MenuItem value="" disabled>
                        Selecciona un rol
                      </MenuItem>
                      {roles.map((role) => {
                        const roleName = role.name ? role.name.toLowerCase() : "";

                        if (roleName === "director") {
                          // Si ya existe un director, solo mostrarlo al usuario que lo tiene
                          if (directorUser && !isDirector) return null;
                        }

                        return (
                          <MenuItem key={role.id} value={role.id}>
                            {role.name}
                          </MenuItem>
                        );
                      })}
                    </Select>
                  )}
                </TableCell>

                <TableCell align="center">
                  {isAdmin ? (
                    <Typography variant="caption" color="textSecondary">
                      Admin protegido
                    </Typography>
                  ) : (
                    <Button
                      variant="outlined"
                      color="error"
                      size="small"
                      onClick={() => deleteUser(user.id)}
                      disabled={isDirector} // proteger al director
                    >
                      Eliminar
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Container>
  );
}
