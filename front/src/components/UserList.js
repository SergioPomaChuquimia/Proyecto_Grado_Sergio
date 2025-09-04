// src/components/UserList.js
import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Card,
  CardMedia,
  CardContent,
  Typography,
  Box,
  CircularProgress,
} from '@mui/material';

const UserList = () => {
  const [users, setUsers] = useState(null);

  useEffect(() => {
    fetch('http://localhost:8000/api/personals', {
      credentials: 'include',
    })
      .then(r => r.json())
      .then(data => setUsers(data))
      .catch(err => {
        console.error(err);
        setUsers([]);
      });
  }, []);

  if (users === null) {
    return (
      <Box
        sx={{
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h4" component="h2" gutterBottom>
        Listado de Usuarios
      </Typography>

      {users.length === 0 ? (
        <Typography variant="body1">No hay usuarios registrados.</Typography>
      ) : (
        <Grid container spacing={4}>
          {users.map((u) => (
            <Grid item key={u.id} xs={12} sm={6} md={4}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  boxShadow: 3,
                }}
              >
                {u.photo && (
                  <CardMedia
                    component="img"
                    image={u.photo}
                    alt={`Foto de ${u.name}`}
                    sx={{
                      height: 200,
                      objectFit: 'cover',
                    }}
                  />
                )}
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" component="h3" gutterBottom>
                    {u.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Email:</strong> {u.email}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Teléfono:</strong> {u.phone || '—'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Dirección:</strong> {u.address || '—'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
};

export default UserList;
