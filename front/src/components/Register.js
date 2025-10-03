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
  padding: theme.spacing(6),
  gap: theme.spacing(3),
  margin: "auto",
  borderRadius: theme.spacing(3),
  backgroundColor: theme.palette.background.paper,
  [theme.breakpoints.up("sm")]: { maxWidth: "600px" },
  [theme.breakpoints.up("md")]: { maxWidth: "700px" },
  boxShadow: "0px 10px 25px rgba(0,0,0,0.1), 0px 4px 15px rgba(0,0,0,0.06)",
  ...(theme.palette.mode === "dark" && {
    boxShadow: "0px 10px 25px rgba(255,255,255,0.08), 0px 4px 15px rgba(255,255,255,0.06)",
  }),
}));

const SignUpContainer = styled(Stack)(({ theme }) => ({
  minHeight: "100vh",
  padding: theme.spacing(4),
  background:
    theme.palette.mode === "light"
      ? "linear-gradient(135deg, #e0eafc, #cfdef3)"
      : "linear-gradient(135deg, #1f1c2c, #928dab)",
}));

const StyledButton = styled(Button)(({ theme }) => ({
  borderRadius: theme.spacing(2),
  textTransform: "none",
  fontWeight: 600,
  fontSize: "1rem",
  padding: theme.spacing(1.5),
  background:
    theme.palette.mode === "light"
      ? "linear-gradient(135deg, #4facfe, #00f2fe)"
      : "linear-gradient(135deg, #667eea, #764ba2)",
  transition: "all 0.3s ease",
  "&:hover": { transform: "translateY(-2px)", boxShadow: "0px 8px 20px rgba(0,0,0,0.15)" },
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
  "& .MuiOutlinedInput-root": {
    borderRadius: theme.spacing(2),
    "&:hover fieldset": { borderColor: theme.palette.primary.main },
  },
}));

function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState("");

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

    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{6,}$/;
    if (!password) {
      newErrors.password = "La contraseña es obligatoria.";
    } else if (!passwordRegex.test(password)) {
      newErrors.password = "Debe tener al menos 6 caracteres, una mayúscula, un número y un símbolo.";
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
      await register(name, email, password, passwordConfirmation);
      setSuccess("Registro exitoso. Ahora puedes iniciar sesión.");
      setErrors({});
      setName("");
      setEmail("");
      setPassword("");
      setPasswordConfirmation("");
    } catch {
      setErrors({ global: "Hubo un error al registrar. Intenta nuevamente." });
    }
  };

  return (
    <>
      <CssBaseline />
      <SignUpContainer direction="column" justifyContent="center" alignItems="center">
        <StyledCard variant="outlined">
          <Typography component="h1" variant="h4" sx={{ textAlign: "center", mb: 1, fontWeight: 700 }}>
            Crear cuenta
          </Typography>
          <Typography variant="body1" sx={{ textAlign: "center", color: "text.secondary", mb: 3 }}>
            Completa el formulario para registrarte
          </Typography>

          <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <FormControl>
              <FormLabel htmlFor="name">Nombre</FormLabel>
              <StyledTextField
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

            <FormControl>
              <FormLabel htmlFor="email">Correo electrónico</FormLabel>
              <StyledTextField
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

            <FormControl>
              <FormLabel htmlFor="password">Contraseña</FormLabel>
              <StyledTextField
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

            <FormControl>
              <FormLabel htmlFor="passwordConfirmation">Confirmar Contraseña</FormLabel>
              <StyledTextField
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

            <StyledButton type="submit" size="large" fullWidth>
              Registrarse
            </StyledButton>

            {errors.global && (
              <Typography variant="body2" sx={{ color: "red", mt: 1, textAlign: "center" }}>
                {errors.global}
              </Typography>
            )}

            {success && (
              <Typography variant="body2" sx={{ color: "green", mt: 1, textAlign: "center" }}>
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
