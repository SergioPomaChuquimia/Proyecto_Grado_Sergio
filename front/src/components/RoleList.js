import React, { useEffect, useState, useCallback } from "react";
import api from "../api";
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Box,
  CircularProgress,
} from "@mui/material";

function RoleList() {
  const [roles, setRoles] = useState([]);
  const [editingRole, setEditingRole] = useState(null);
  const [formData, setFormData] = useState({ name: "", description: "" });
  const [loading, setLoading] = useState(true);

  const fetchRoles = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/roles");
      setRoles(res.data);
    } catch (err) {
      console.error("Error cargando roles:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const handleDelete = async (id) => {
    if (!window.confirm("¿Seguro que quieres eliminar este rol?")) return;
    try {
      await api.delete(`/api/roles/${id}`);
      fetchRoles();
    } catch (err) {
      console.error("Error eliminando rol:", err);
    }
  };

  const handleEditClick = (role) => {
    setEditingRole(role.id);
    setFormData({ name: role.name, description: role.description || "" });
  };

  const handleCancelEdit = () => {
    setEditingRole(null);
    setFormData({ name: "", description: "" });
  };

  const handleSaveEdit = async (id) => {
    try {
      await api.put(`/api/roles/${id}`, formData);
      fetchRoles();
      handleCancelEdit();
    } catch (err) {
      console.error("Error actualizando rol:", err);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" mt={5}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container sx={{ mt: 5 }}>
      <Typography variant="h4" align="center" gutterBottom>
        Lista de Roles
      </Typography>
      <Grid container spacing={3}>
        {roles.map((role) => (
          <Grid item xs={12} md={6} key={role.id}>
            <Card elevation={3} sx={{ p: 2 }}>
              <CardContent>
                {editingRole === role.id ? (
                  <Box display="flex" flexDirection="column" gap={2}>
                    <TextField
                      label="Nombre"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, name: e.target.value }))
                      }
                      fullWidth
                    />
                    <TextField
                      label="Descripción"
                      value={formData.description}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, description: e.target.value }))
                      }
                      fullWidth
                    />
                    <Box display="flex" gap={2}>
                      <Button
                        variant="contained"
                        color="success"
                        onClick={() => handleSaveEdit(role.id)}
                      >
                        Guardar
                      </Button>
                      <Button variant="outlined" color="secondary" onClick={handleCancelEdit}>
                        Cancelar
                      </Button>
                    </Box>
                  </Box>
                ) : (
                  <Box display="flex" flexDirection="column" gap={2}>
                    <Typography variant="h6">{role.name}</Typography>
                    <Typography color="text.secondary">
                      {role.description || "Sin descripción"}
                    </Typography>
                    <Box display="flex" gap={2}>
                      <Button variant="contained" color="primary" onClick={() => handleEditClick(role)}>
                        Editar
                      </Button>
                      <Button variant="contained" color="error" onClick={() => handleDelete(role.id)}>
                        Eliminar
                      </Button>
                    </Box>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}

export default RoleList;
