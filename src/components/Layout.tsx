import React, { useState } from 'react';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  useTheme,
  useMediaQuery
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ArtistsIcon from '@mui/icons-material/People';
import ProductsIcon from '@mui/icons-material/Inventory';
import InventoryIcon from '@mui/icons-material/Storage';
import DashboardIcon from '@mui/icons-material/Dashboard';
import SettingsIcon from '@mui/icons-material/Settings';
import AssessmentIcon from '@mui/icons-material/Assessment';
import ReceiptIcon from '@mui/icons-material/Receipt';
import LogoutIcon from '@mui/icons-material/Logout';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const drawerWidth = 280;

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
    { text: 'Artistas', icon: <ArtistsIcon />, path: '/artistas' },
    { text: 'Productos', icon: <ProductsIcon />, path: '/productos' },
    { text: 'Inventario', icon: <InventoryIcon />, path: '/inventario' },
    { text: 'Reportes', icon: <AssessmentIcon />, path: '/reportes' },
    { text: 'Ventas', icon: <ReceiptIcon />, path: '/ventas' },
  ];

  const bottomMenuItems = [
    { text: 'Configuración', icon: <SettingsIcon />, path: '/configuracion' },
  ];

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleSidebarCollapse = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const handleLogout = () => {
    logout();  // ← LLAMAR A LA FUNCIÓN LOGOUT DEL CONTEXTO
    navigate('/login');
  };

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Logo y título */}
      <Toolbar sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: sidebarCollapsed ? 'center' : 'space-between',
        px: 2,
        bgcolor: '#303030',
        color: 'white'
      }}>
        {!sidebarCollapsed && (
          <Box display="flex" alignItems="center">
            <Avatar 
              sx={{ bgcolor: 'white', color: '#303030', mr: 1, width: 32, height: 32 }}
            >
              T
            </Avatar>
            <Typography variant="h6" noWrap component="div">
              TPV System
            </Typography>
          </Box>
        )}
        {sidebarCollapsed && (
          <Avatar 
            sx={{ bgcolor: 'white', color: '#303030', width: 40, height: 40 }}
          >
            T
          </Avatar>
        )}
        {!isMobile && (
          <IconButton onClick={handleSidebarCollapse} sx={{ color: 'white' }}>
            {sidebarCollapsed ? <MenuIcon /> : <ChevronLeftIcon />}
          </IconButton>
        )}
      </Toolbar>

      {/* Información del usuario (solo cuando no está colapsado) */}
      {!sidebarCollapsed && user && (
        <Box sx={{ p: 2, bgcolor: '#f5f5f5' }}>
          <Typography variant="subtitle2" color="text.secondary">
            Conectado como:
          </Typography>
          <Typography variant="body2" fontWeight="bold">
            {user.nombre}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            @{user.username}
          </Typography>
        </Box>
      )}

      <Divider />

      {/* Menú principal */}
      <List sx={{ flex: 1, pt: 2 }}>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding sx={{ display: 'block', mb: 0.5 }}>
            <ListItemButton
              onClick={() => handleNavigation(item.path)}
              selected={location.pathname === item.path}
              sx={{
                minHeight: 48,
                justifyContent: sidebarCollapsed ? 'center' : 'initial',
                px: 2.5,
                mx: 1,
                borderRadius: 2,
                '&.Mui-selected': {
                  bgcolor: '#303030',
                  color: 'white',
                  '&:hover': {
                    bgcolor: '#1a1a1a',
                  },
                  '& .MuiListItemIcon-root': {
                    color: 'white',
                  },
                },
                '&:hover': {
                  bgcolor: 'rgba(48, 48, 48, 0.04)',
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  mr: sidebarCollapsed ? 0 : 2,
                  justifyContent: 'center',
                  color: location.pathname === item.path ? 'white' : '#303030',
                }}
              >
                {item.icon}
              </ListItemIcon>
              {!sidebarCollapsed && (
                <ListItemText 
                  primary={item.text} 
                  primaryTypographyProps={{
                    fontWeight: location.pathname === item.path ? 600 : 400,
                  }}
                />
              )}
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      <Divider />

      {/* Menú inferior */}
      <List sx={{ pb: 2 }}>
        {bottomMenuItems.map((item) => (
          <ListItem key={item.text} disablePadding sx={{ display: 'block', mb: 0.5 }}>
            <ListItemButton
              onClick={() => handleNavigation(item.path)}
              sx={{
                minHeight: 48,
                justifyContent: sidebarCollapsed ? 'center' : 'initial',
                px: 2.5,
                mx: 1,
                borderRadius: 2,
                '&:hover': {
                  bgcolor: 'rgba(48, 48, 48, 0.04)',
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  mr: sidebarCollapsed ? 0 : 2,
                  justifyContent: 'center',
                  color: '#303030',
                }}
              >
                {item.icon}
              </ListItemIcon>
              {!sidebarCollapsed && <ListItemText primary={item.text} />}
            </ListItemButton>
          </ListItem>
        ))}
        
        {/* Botón de Cerrar Sesión */}
        <ListItem disablePadding sx={{ display: 'block', mb: 0.5 }}>
          <ListItemButton
            onClick={handleLogout}
            sx={{
              minHeight: 48,
              justifyContent: sidebarCollapsed ? 'center' : 'initial',
              px: 2.5,
              mx: 1,
              borderRadius: 2,
              color: '#d32f2f',
              '&:hover': {
                bgcolor: '#ffebee',
              },
            }}
          >
            <ListItemIcon
              sx={{
                minWidth: 0,
                mr: sidebarCollapsed ? 0 : 2,
                justifyContent: 'center',
                color: '#d32f2f',
              }}
            >
              <LogoutIcon />
            </ListItemIcon>
            {!sidebarCollapsed && <ListItemText primary="Cerrar Sesión" />}
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* App Bar para móvil */}
      <AppBar
        position="fixed"
        sx={{
          display: { sm: 'none' },
          bgcolor: '#303030',
          boxShadow: 3,
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div">
            TPV System
          </Typography>
        </Toolbar>
      </AppBar>

      {/* Drawer para móvil */}
      <Box
        component="nav"
        sx={{ width: { sm: sidebarCollapsed ? 80 : drawerWidth }, flexShrink: { sm: 0 } }}
      >
        {/* Drawer móvil */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              bgcolor: '#f8f9fa'
            },
          }}
        >
          {drawer}
        </Drawer>

        {/* Drawer permanente para escritorio */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: sidebarCollapsed ? 80 : drawerWidth,
              bgcolor: '#f8f9fa',
              borderRight: '1px solid rgba(0, 0, 0, 0.08)',
              transition: 'width 0.2s',
              overflowX: 'hidden'
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Contenido principal */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { sm: `calc(100% - ${sidebarCollapsed ? 80 : drawerWidth}px)` },
          ml: { sm: `${sidebarCollapsed ? 80 : drawerWidth}px` },
          transition: 'margin 0.2s, width 0.2s',
          bgcolor: '#f5f5f5',
          minHeight: '100vh'
        }}
      >
        {/* Toolbar espaciador para móvil */}
        <Toolbar sx={{ display: { sm: 'none' } }} />
        
        {/* Contenido de la página */}
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
};

export default Layout;