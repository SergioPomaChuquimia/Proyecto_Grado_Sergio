// NavBar.js
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Button,
  Menu,
  MenuItem,
  Divider,
  Container,
  Box,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  Tooltip,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import MenuIcon from "@mui/icons-material/Menu";
import HomeIcon from "@mui/icons-material/Home";
import AccountCircle from "@mui/icons-material/AccountCircle";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import PersonAddAlt1Icon from "@mui/icons-material/PersonAddAlt1";
import ListAltIcon from "@mui/icons-material/ListAlt";
import ChildCareIcon from "@mui/icons-material/ChildCare";
import ManageAccountsIcon from "@mui/icons-material/ManageAccounts";
import SecurityIcon from "@mui/icons-material/Security";

const NAV_GROUPS = [
  {
    title: "Personal",
    items: [
      { label: "Registrar Padre de Familia", to: "/register-user", icon: <PersonAddAlt1Icon /> },
      { label: "Listado de Padre de Familia", to: "/users", icon: <PeopleAltIcon /> },
    ],
  },
  {
    title: "Hijos",
    items: [
      { label: "Registrar hijo", to: "/register-child", icon: <ChildCareIcon /> },
      { label: "Listado de hijos", to: "/hijos", icon: <ListAltIcon /> },
    ],
  },
  {
    title: "Historial",
    items: [
      { label: "Historial de Recojos", to: "/historial-recojos", icon: <ListAltIcon /> },
    ],
  },
  {
    title: "Seguridad",
    items: [
      { label: "Nuevo rol", to: "/register-role", icon: <SecurityIcon /> },
      { label: "Roles", to: "/roles", icon: <SecurityIcon /> },
      { label: "Usuarios", to: "/usuarios", icon: <ManageAccountsIcon /> },
    ],
  },
];

export default function NavBar({ onLogout, user }) {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [anchorGestion, setAnchorGestion] = useState(null);
  const [anchorProfile, setAnchorProfile] = useState(null);
  const [openDrawer, setOpenDrawer] = useState(false);

  const go = (to) => {
    navigate(to);
    setAnchorGestion(null);
    setOpenDrawer(false);
  };

  return (
    <AppBar position="sticky" color="primary" elevation={1}>
      <Container maxWidth="lg">
        <Toolbar disableGutters sx={{ gap: 1 }}>
          {isMobile && (
            <IconButton color="inherit" onClick={() => setOpenDrawer(true)} edge="start">
              <MenuIcon />
            </IconButton>
          )}

          <Box
            onClick={() => navigate("/dashboard")}
            sx={{ display: "flex", alignItems: "center", cursor: "pointer" }}
          >
            <HomeIcon sx={{ mr: 1 }} />
            <Typography variant="h6" noWrap>Mi App</Typography>
          </Box>

          <Box sx={{ flexGrow: 1 }} />

          {!isMobile && (
            <>
              <Button color="inherit" onClick={() => navigate("/dashboard")}>Dashboard</Button>

              {/* Gestión (SIEMPRE visible para usuarios logueados) */}
              <Button
                color="inherit"
                endIcon={<MenuIcon />}
                onClick={(e) => setAnchorGestion(e.currentTarget)}
              >
                Gestión
              </Button>

              <Menu
                anchorEl={anchorGestion}
                open={Boolean(anchorGestion)}
                onClose={() => setAnchorGestion(null)}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                transformOrigin={{ vertical: "top", horizontal: "right" }}
                PaperProps={{ sx: { minWidth: 260, p: 1 } }}
              >
                {NAV_GROUPS.map((grp, idx) => (
                  <Box key={grp.title}>
                    {idx > 0 && <Divider sx={{ my: 1 }} />}
                    <Typography
                      variant="caption"
                      sx={{ px: 2, py: 0.5, display: "block", color: "text.secondary" }}
                    >
                      {grp.title}
                    </Typography>
                    {grp.items.map((it) => (
                      <MenuItem key={it.label} onClick={() => go(it.to)}>
                        <ListItemIcon sx={{ minWidth: 36 }}>{it.icon}</ListItemIcon>
                        <ListItemText>{it.label}</ListItemText>
                      </MenuItem>
                    ))}
                  </Box>
                ))}
              </Menu>
            </>
          )}

          <Tooltip title={user?.email || "Perfil"}>
            <IconButton color="inherit" onClick={(e) => setAnchorProfile(e.currentTarget)}>
              <AccountCircle />
            </IconButton>
          </Tooltip>

          <Menu
            anchorEl={anchorProfile}
            open={Boolean(anchorProfile)}
            onClose={() => setAnchorProfile(null)}
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            transformOrigin={{ vertical: "top", horizontal: "right" }}
          >
            {user?.email && (
              <MenuItem disabled sx={{ opacity: 1 }}>
                <ListItemText
                  primary={user.name || "Usuario"}
                  secondary={user.email}
                  primaryTypographyProps={{ fontWeight: 600 }}
                />
              </MenuItem>
            )}
            <Divider />
            <MenuItem
              onClick={() => {
                onLogout?.();
                setAnchorProfile(null);
              }}
            >
              Cerrar sesión
            </MenuItem>
          </Menu>
        </Toolbar>
      </Container>

      {/* Drawer móvil (SIEMPRE con todas las secciones) */}
      <Drawer anchor="left" open={openDrawer} onClose={() => setOpenDrawer(false)}>
        <Box sx={{ width: 290 }} role="presentation">
          <List
            subheader={
              <ListSubheader component="div" sx={{ bgcolor: "transparent" }}>
                Navegación
              </ListSubheader>
            }
          >
            <ListItemButton onClick={() => go("/dashboard")}>
              <ListItemIcon><HomeIcon /></ListItemIcon>
              <ListItemText primary="Dashboard" />
            </ListItemButton>
          </List>

          <Divider />
          {NAV_GROUPS.map((grp) => (
            <List
              key={grp.title}
              subheader={
                <ListSubheader component="div" sx={{ bgcolor: "transparent" }}>
                  {grp.title}
                </ListSubheader>
              }
            >
              {grp.items.map((it) => (
                <ListItemButton key={it.label} onClick={() => go(it.to)}>
                  <ListItemIcon>{it.icon}</ListItemIcon>
                  <ListItemText primary={it.label} />
                </ListItemButton>
              ))}
            </List>
          ))}

          <Divider />
          <List
            subheader={
              <ListSubheader component="div" sx={{ bgcolor: "transparent" }}>
                Cuenta
              </ListSubheader>
            }
          >
            <ListItemButton
              onClick={() => {
                onLogout?.();
                setOpenDrawer(false);
              }}
            >
              <ListItemIcon><AccountCircle /></ListItemIcon>
              <ListItemText primary="Cerrar sesión" />
            </ListItemButton>
          </List>
        </Box>
      </Drawer>
    </AppBar>
  );
}
