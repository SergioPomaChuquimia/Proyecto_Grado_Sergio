// src/components/NavBar.js
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AppBar,
  Toolbar,
  Button,
  Typography,
  IconButton,
  Menu,
  MenuItem,
} from "@mui/material";
import HomeIcon from "@mui/icons-material/Home";
import MenuIcon from "@mui/icons-material/Menu";
import AccountCircle from "@mui/icons-material/AccountCircle";

export default function NavBar({ onLogout, user }) {
  const navigate = useNavigate();

  // Estado para menús
  const [anchorMenu, setAnchorMenu] = useState(null);
  const [anchorProfile, setAnchorProfile] = useState(null);

  const handleOpenMenu = (event) => setAnchorMenu(event.currentTarget);
  const handleCloseMenu = () => setAnchorMenu(null);

  const handleOpenProfile = (event) => setAnchorProfile(event.currentTarget);
  const handleCloseProfile = () => setAnchorProfile(null);

  return (
    <AppBar position="static" color="primary">
      <Toolbar>
        {/* Icono Dashboard */}
        <IconButton
          edge="start"
          color="inherit"
          aria-label="dashboard"
          onClick={() => navigate("/dashboard")}
          sx={{ mr: 2 }}
        >
          <HomeIcon />
        </IconButton>

        {/* Título */}
        <Typography
          variant="h6"
          sx={{ flexGrow: 1, cursor: "pointer" }}
          onClick={() => navigate("/dashboard")}
        >
          Mi App
        </Typography>

        {/* Menú principal solo visible para admin */}
        {user?.email === "admin@gmail.com" && (
          <>
            <Button
              color="inherit"
              startIcon={<MenuIcon />}
              onClick={handleOpenMenu}
            >
              Gestión
            </Button>
            <Menu
              anchorEl={anchorMenu}
              open={Boolean(anchorMenu)}
              onClose={handleCloseMenu}
            >
              <MenuItem
                onClick={() => {
                  navigate("/register-user");
                  handleCloseMenu();
                }}
              >
                Registro
              </MenuItem>
              <MenuItem
                onClick={() => {
                  navigate("/users");
                  handleCloseMenu();
                }}
              >
                Listado
              </MenuItem>
              <MenuItem
                onClick={() => {
                  navigate("/register-role");
                  handleCloseMenu();
                }}
              >
                Nuevo rol
              </MenuItem>
              <MenuItem
                onClick={() => {
                  navigate("/roles");
                  handleCloseMenu();
                }}
              >
                Roles
              </MenuItem>
              <MenuItem
                onClick={() => {
                  navigate("/usuarios");
                  handleCloseMenu();
                }}
              >
                Usuarios
              </MenuItem>
            </Menu>
          </>
        )}

        {/* Menú de perfil */}
        <IconButton color="inherit" onClick={handleOpenProfile}>
          <AccountCircle />
        </IconButton>
        <Menu
          anchorEl={anchorProfile}
          open={Boolean(anchorProfile)}
          onClose={handleCloseProfile}
        >
          <MenuItem
            onClick={() => {
              onLogout();
              handleCloseProfile();
            }}
          >
            Cerrar sesión
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
}
