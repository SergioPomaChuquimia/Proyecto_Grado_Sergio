// src/components/Register.js
import { useState } from "react";
import { register } from "../auth";
import {
  Box,
  TextField,
  Button,
  Typography,
  Card,
  CssBaseline,
  FormControl,
  FormLabel,
  Stack,
} from "@mui/material";
import { styled } from "@mui/material/styles";

const StyledCard = styled(Card)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignSelf: "center",
  width: "100%",
  padding: theme.spacing(6), // más padding
  gap: theme.spacing(3),
  margin: "auto",
  [theme.breakpoints.up("sm")]: {
    maxWidth: "600px", // más ancho
  },
  [theme.breakpoints.up("md")]: {
    maxWidth: "700px", // aún más ancho en pantallas grandes
  },
  boxShadow:
    "hsla(0, 0%, 98%, 0.08) 0px 8px 24px, hsla(0, 0%, 89%, 0.08) 0px 20px 40px -5px",
  ...(theme.palette.mode === "dark" && {
    boxShadow:
      "hsla(220, 30%, 5%, 0.6) 0px 8px 24px, hsla(0, 0%, 100%, 0.1) 0px 20px 40px -5px",
  }),
}));

const SignUpContainer = styled(Stack)(({ theme }) => ({
  minHeight: "100vh",
  padding: theme.spacing(4),
  background:
    theme.palette.mode === "light"
      ? "linear-gradient(135deg, #f5f7fa, #c3cfe2)"
      : "linear-gradient(135deg, #1f1c2c, #928dab)",
}));

function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState("");

  // ✅ Validaciones
// ✅ Validaciones
const validateForm = () => {
  const newErrors = {};

if (!name.trim()) {
  newErrors.name = "El nombre es obligatorio.";
} else if (name.length < 3) {
  newErrors.name = "El nombre debe tener al menos 3 caracteres.";
} else if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/.test(name)) {
  newErrors.name = "El nombre solo puede contener letras y espacios.";
}


if (!email.trim()) {
  newErrors.email = "El correo es obligatorio.";
} else if (!/^[^\s@]+@gmail\.com$/.test(email)) {
  newErrors.email = "El correo debe ser una dirección válida de @gmail.com.";
}


  // 🔥 Nuevo regex más flexible
  const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{6,}$/;
  if (!password) {
    newErrors.password = "La contraseña es obligatoria.";
  } else if (!passwordRegex.test(password)) {
    newErrors.password =
      "Debe tener al menos 6 caracteres, una mayúscula, un número y un símbolo.";
  }

  if (password !== passwordConfirmation) {
    newErrors.passwordConfirmation = "Las contraseñas no coinciden.";
  }

  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};


  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess("");
    if (!validateForm()) return;

    try {
      const response = await register(
        name,
        email,
        password,
        passwordConfirmation
      );
      console.log("Registro exitoso:", response);
      setSuccess("Registro exitoso. Ahora puedes iniciar sesión.");
      setErrors({});
      setName("");
      setEmail("");
      setPassword("");
      setPasswordConfirmation("");
    } catch (err) {
      console.error("Error al registrar:", err);
      setErrors({ global: "Hubo un error al registrar. Intenta nuevamente." });
    }
  };

  return (
    <>
      <CssBaseline />
      <SignUpContainer
        direction="column"
        justifyContent="center"
        alignItems="center"
      >
        <StyledCard variant="outlined">
          <Typography component="h1" variant="h4" sx={{ textAlign: "center", mb: 2 }}>
            Crear cuenta
          </Typography>
          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{ display: "flex", flexDirection: "column", gap: 3 }}
          >
            {/* Nombre */}
            <FormControl>
              <FormLabel htmlFor="name">Nombre</FormLabel>
              <TextField
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                fullWidth
                placeholder="Tu nombre"
                error={!!errors.name}
                helperText={errors.name}
              />
            </FormControl>

            {/* Email */}
            <FormControl>
              <FormLabel htmlFor="email">Correo electrónico</FormLabel>
              <TextField
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                fullWidth
                placeholder="correo@ejemplo.com"
                error={!!errors.email}
                helperText={errors.email}
              />
            </FormControl>

            {/* Contraseña */}
            <FormControl>
              <FormLabel htmlFor="password">Contraseña</FormLabel>
              <TextField
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                fullWidth
                placeholder="••••••••"
                error={!!errors.password}
                helperText={errors.password}
              />
            </FormControl>

            {/* Confirmación */}
            <FormControl>
              <FormLabel htmlFor="passwordConfirmation">
                Confirmar Contraseña
              </FormLabel>
              <TextField
                id="passwordConfirmation"
                type="password"
                value={passwordConfirmation}
                onChange={(e) => setPasswordConfirmation(e.target.value)}
                required
                fullWidth
                placeholder="••••••••"
                error={!!errors.passwordConfirmation}
                helperText={errors.passwordConfirmation}
              />
            </FormControl>

            <Button type="submit" variant="contained" size="large" fullWidth>
              Registrarse
            </Button>

            {/* Errores globales */}
            {errors.global && (
              <Typography
                variant="body2"
                sx={{ color: "red", mt: 1, textAlign: "center" }}
              >
                {errors.global}
              </Typography>
            )}

            {/* Mensaje de éxito */}
            {success && (
              <Typography
                variant="body2"
                sx={{ color: "green", mt: 1, textAlign: "center" }}
              >
                {success}
              </Typography>
            )}
          </Box>
        </StyledCard>
      </SignUpContainer>
    </>
  );
}

export default Register;
