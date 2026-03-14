// src/pages/DashboardPage.tsx
import React, { useEffect, useState } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  Avatar,
  Chip,
  LinearProgress,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
  Alert,
  AlertTitle,
  Fade,
  Zoom,
  useTheme,
  alpha,
  Button
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  TrendingUp,
  TrendingDown,
  Inventory,
  People,
  Warning,
  Error as ErrorIcon,
  CheckCircle,
  AttachMoney,
  ShoppingCart,
  CalendarToday,
  Refresh
} from '@mui/icons-material';
import { dashboardService } from '../api/dashboardService';
import type { DashboardStats } from '../types/Dashboard.types';

// Color corporativo
const CORPORATE_COLOR = '#303030';

// Componentes estilizados
const GradientHeader = styled(Box)(({ theme }) => ({
  background: `linear-gradient(135deg, ${CORPORATE_COLOR} 0%, #1a1a1a 100%)`,
  color: 'white',
  padding: theme.spacing(6),
  marginBottom: theme.spacing(4),
  boxShadow: theme.shadows[3],
  position: 'relative',
  overflow: 'hidden',
  borderRadius: theme.spacing(2),
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    background: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.05"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E") repeat',
    opacity: 0.1,
    pointerEvents: 'none'
  }
}));

const StatsCard = styled(Card)(({ theme }) => ({
  borderRadius: theme.spacing(2),
  transition: 'all 0.3s ease',
  height: '100%',
  position: 'relative',
  overflow: 'hidden',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme.shadows[8]
  }
}));

const StatsCardContent = styled(CardContent)({
  position: 'relative',
  zIndex: 1
});

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: theme.spacing(2),
  height: '100%',
  maxHeight: 500,
  overflow: 'auto',
  transition: 'box-shadow 0.3s ease',
  '&:hover': {
    boxShadow: theme.shadows[4]
  }
}));

const DashboardPage: React.FC = () => {
  const theme = useTheme();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const data = await dashboardService.obtenerStats();
      setStats(data);
    } catch (err: any) {
      setError(err.message || 'Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await cargarDatos();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <Box sx={{ bgcolor: '#f5f5f5', minHeight: '100vh', py: 4 }}>
        <Container maxWidth="xl">
          <LinearProgress sx={{ 
            bgcolor: alpha(CORPORATE_COLOR, 0.2),
            '& .MuiLinearProgress-bar': {
              bgcolor: CORPORATE_COLOR
            }
          }} />
        </Container>
      </Box>
    );
  }

  if (error || !stats) {
    return (
      <Box sx={{ bgcolor: '#f5f5f5', minHeight: '100vh', py: 4 }}>
        <Container maxWidth="xl">
          <Alert 
            severity="error" 
            sx={{ 
              borderRadius: 2,
              boxShadow: theme.shadows[2]
            }}
          >
            <AlertTitle>Error</AlertTitle>
            {error || 'No se pudieron cargar los datos'}
          </Alert>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: '#f5f5f5', minHeight: '100vh', py: 4 }}>
      <Container maxWidth="xl">
        {/* Header mejorado con gradiente y botón de refrescar */}
        <GradientHeader>
          <Fade in timeout={1000}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Box display="flex" alignItems="center" gap={2}>
                <Zoom in timeout={500}>
                  <Avatar
                    sx={{
                      width: 60,
                      height: 60,
                      bgcolor: 'white',
                      color: CORPORATE_COLOR,
                      boxShadow: theme.shadows[4]
                    }}
                  >
                    <AttachMoney sx={{ fontSize: 32 }} />
                  </Avatar>
                </Zoom>
                <Box>
                  <Typography variant="h3" component="h1" fontWeight="700" gutterBottom>
                    Dashboard
                  </Typography>
                  <Typography variant="h6" sx={{ opacity: 0.9, fontWeight: 400 }}>
                    Resumen general de la tienda
                  </Typography>
                </Box>
              </Box>
              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={handleRefresh}
                disabled={refreshing}
                sx={{
                  color: 'white',
                  borderColor: 'rgba(255,255,255,0.3)',
                  '&:hover': {
                    borderColor: 'white',
                    bgcolor: 'rgba(255,255,255,0.1)'
                  }
                }}
              >
                {refreshing ? 'Actualizando...' : 'Actualizar'}
              </Button>
            </Box>
          </Fade>
        </GradientHeader>

        {/* Fila 1: Tarjetas de resumen con diseño mejorado */}
        <Grid container spacing={3} mb={4}>
          {/* Tarjeta de Artistas */}
          <Grid size={{xs:12, sm:6, md:3}}>
            <StatsCard>
              <StatsCardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography color="text.secondary" gutterBottom variant="body2" sx={{ fontWeight: 500 }}>
                      Total Artistas
                    </Typography>
                    <Typography variant="h3" fontWeight="bold" sx={{ color: CORPORATE_COLOR }}>
                      {stats.totalArtistas}
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: alpha(CORPORATE_COLOR, 0.1), color: CORPORATE_COLOR, width: 56, height: 56 }}>
                    <People sx={{ fontSize: 28 }} />
                  </Avatar>
                </Box>
              </StatsCardContent>
            </StatsCard>
          </Grid>

          {/* Tarjeta de Productos */}
          <Grid size={{xs:12, sm:6, md:3}}>
            <StatsCard>
              <StatsCardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography color="text.secondary" gutterBottom variant="body2" sx={{ fontWeight: 500 }}>
                      Total Productos
                    </Typography>
                    <Typography variant="h3" fontWeight="bold" sx={{ color: '#FF6B6B' }}>
                      {stats.totalProductos}
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: alpha('#FF6B6B', 0.1), color: '#FF6B6B', width: 56, height: 56 }}>
                    <Inventory sx={{ fontSize: 28 }} />
                  </Avatar>
                </Box>
              </StatsCardContent>
            </StatsCard>
          </Grid>

          {/* Tarjeta de Ventas del Mes */}
          <Grid size={{xs:12, sm:6, md:3}}>
            <StatsCard>
              <StatsCardContent>
                <Box display="flex" flexDirection="column" height="100%">
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography color="text.secondary" variant="body2" sx={{ fontWeight: 500 }}>
                      Ventas del mes
                    </Typography>
                    <Chip 
                      label={`${stats.resumenVentas.totalVentasMes} ventas`}
                      size="small"
                      sx={{ 
                        bgcolor: alpha('#4CAF50', 0.1),
                        color: '#4CAF50',
                        fontWeight: 500
                      }}
                    />
                  </Box>
                  <Box display="flex" alignItems="baseline" justifyContent="space-between">
                    <Typography variant="h3" fontWeight="bold" sx={{ color: '#4CAF50' }}>
                      {stats.resumenVentas.totalVentasMes}
                    </Typography>
                    <Avatar sx={{ bgcolor: alpha('#4CAF50', 0.1), color: '#4CAF50', width: 40, height: 40 }}>
                      <ShoppingCart sx={{ fontSize: 20 }} />
                    </Avatar>
                  </Box>
                </Box>
              </StatsCardContent>
            </StatsCard>
          </Grid>

          {/* Tarjeta de Ingresos */}
          <Grid size={{xs:12, sm:6, md:3}}>
            <StatsCard>
              <StatsCardContent>
                <Box>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography color="text.secondary" variant="body2" sx={{ fontWeight: 500 }}>
                      Ingresos del mes
                    </Typography>
                    <Box display="flex" alignItems="center" sx={{ 
                      bgcolor: alpha(stats.resumenVentas.variacionPorcentual >= 0 ? '#4CAF50' : '#FF6B6B', 0.1),
                      borderRadius: 2,
                      px: 1,
                      py: 0.5
                    }}>
                      {stats.resumenVentas.variacionPorcentual >= 0 ? (
                        <TrendingUp sx={{ color: '#4CAF50', fontSize: 16, mr: 0.5 }} />
                      ) : (
                        <TrendingDown sx={{ color: '#FF6B6B', fontSize: 16, mr: 0.5 }} />
                      )}
                      <Typography
                        variant="caption"
                        sx={{
                          color: stats.resumenVentas.variacionPorcentual >= 0 ? '#4CAF50' : '#FF6B6B',
                          fontWeight: 'bold'
                        }}
                      >
                        {Math.abs(stats.resumenVentas.variacionPorcentual).toFixed(1)}%
                      </Typography>
                    </Box>
                  </Box>
                  <Box display="flex" alignItems="baseline" justifyContent="space-between">
                    <Box>
                      <Typography variant="h3" fontWeight="bold" sx={{ color: CORPORATE_COLOR }}>
                        ${stats.resumenVentas.ingresosMes.toLocaleString('es-MX')}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                        vs mes anterior
                      </Typography>
                    </Box>
                    <Avatar sx={{ bgcolor: alpha(CORPORATE_COLOR, 0.1), color: CORPORATE_COLOR, width: 40, height: 40 }}>
                      <AttachMoney sx={{ fontSize: 20 }} />
                    </Avatar>
                  </Box>
                </Box>
              </StatsCardContent>
            </StatsCard>
          </Grid>
        </Grid>

        {/* Fila 2: Alertas de Stock y Top Productos */}
        <Grid container spacing={3}>
          {/* Alertas de Stock */}
          <Grid size={{xs:12, md:6}}>
            <StyledPaper>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Box display="flex" alignItems="center" gap={1}>
                  <Warning sx={{ color: stats.alertasStock.length > 0 ? '#ff9800' : '#4caf50' }} />
                  <Typography variant="h6" fontWeight="bold" sx={{ color: CORPORATE_COLOR }}>
                    Alertas de Stock
                  </Typography>
                </Box>
                <Chip
                  label={stats.alertasStock.length}
                  sx={{
                    bgcolor: stats.alertasStock.length > 0 ? alpha('#ff9800', 0.1) : alpha('#4caf50', 0.1),
                    color: stats.alertasStock.length > 0 ? '#ff9800' : '#4caf50',
                    fontWeight: 'bold'
                  }}
                />
              </Box>

              {stats.alertasStock.length === 0 ? (
                <Fade in timeout={500}>
                  <Box textAlign="center" py={8}>
                    <CheckCircle sx={{ fontSize: 64, color: '#4CAF50', mb: 2, opacity: 0.7 }} />
                    <Typography color="text.secondary" variant="h6" sx={{ fontWeight: 400 }}>
                      ¡Todo en orden!
                    </Typography>
                    <Typography color="text.secondary" variant="body2">
                      No hay alertas de stock pendientes
                    </Typography>
                  </Box>
                </Fade>
              ) : (
                <List>
                  {stats.alertasStock.map((alerta, index) => (
                    <React.Fragment key={`${alerta.id_producto}-${alerta.talla}`}>
                      <ListItem alignItems="flex-start" sx={{ px: 0, py: 1.5 }}>
                        <ListItemAvatar>
                          {alerta.imagen_url ? (
                            <Avatar 
                              src={alerta.imagen_url} 
                              variant="rounded"
                              sx={{ width: 48, height: 48 }}
                            />
                          ) : (
                            <Avatar 
                              variant="rounded" 
                              sx={{ 
                                bgcolor: alpha(CORPORATE_COLOR, 0.1),
                                color: CORPORATE_COLOR,
                                width: 48,
                                height: 48
                              }}
                            >
                              <Inventory />
                            </Avatar>
                          )}
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                              <Typography variant="body1" fontWeight="600">
                                {alerta.nombre}
                              </Typography>
                              {alerta.categoria === 'ropa' && (
                                <Chip 
                                  label={alerta.talla} 
                                  size="small" 
                                  sx={{ 
                                    bgcolor: alpha(CORPORATE_COLOR, 0.1),
                                    color: CORPORATE_COLOR,
                                    fontWeight: 500
                                  }} 
                                />
                              )}
                            </Box>
                          }
                          secondary={
                            <Box component="span" display="flex" alignItems="center" gap={1} mt={1}>
                              <Chip
                                icon={<ErrorIcon sx={{ fontSize: 14 }} />}
                                label={`Stock: ${alerta.stock_actual}`}
                                size="small"
                                sx={{
                                  bgcolor: alerta.stock_actual === 0 ? alpha('#f44336', 0.1) : alpha('#ff9800', 0.1),
                                  color: alerta.stock_actual === 0 ? '#f44336' : '#ff9800',
                                  fontWeight: 500,
                                  '& .MuiChip-icon': {
                                    color: alerta.stock_actual === 0 ? '#f44336' : '#ff9800'
                                  }
                                }}
                              />
                              <Typography variant="caption" color="text.secondary">
                                Mínimo: {alerta.stock_minimo}
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItem>
                      {index < stats.alertasStock.length - 1 && <Divider sx={{ my: 1 }} />}
                    </React.Fragment>
                  ))}
                </List>
              )}
            </StyledPaper>
          </Grid>

          {/* Top Productos */}
          <Grid size={{xs:12, md:6}}>
            <StyledPaper>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <TrendingUp sx={{ color: CORPORATE_COLOR }} />
                <Typography variant="h6" fontWeight="bold" sx={{ color: CORPORATE_COLOR }}>
                  Top 3 Productos más Vendidos
                </Typography>
              </Box>

              {stats.topProductos.length === 0 ? (
                <Fade in timeout={500}>
                  <Box textAlign="center" py={8}>
                    <ShoppingCart sx={{ fontSize: 64, color: alpha(CORPORATE_COLOR, 0.3), mb: 2 }} />
                    <Typography color="text.secondary" variant="h6" sx={{ fontWeight: 400 }}>
                      Sin ventas
                    </Typography>
                    <Typography color="text.secondary" variant="body2">
                      No hay ventas registradas para mostrar
                    </Typography>
                  </Box>
                </Fade>
              ) : (
                <List>
                  {stats.topProductos.map((producto, index) => {
                    const colors = [
                      { bg: '#FFD700', color: '#000', medal: '🥇' },
                      { bg: '#C0C0C0', color: '#000', medal: '🥈' },
                      { bg: '#CD7F32', color: '#fff', medal: '🥉' }
                    ];
                    return (
                      <ListItem key={producto.id_producto} sx={{ px: 0, py: 1.5 }}>
                        <ListItemAvatar>
                          <Avatar
                            sx={{
                              bgcolor: colors[index].bg,
                              color: colors[index].color,
                              fontWeight: 'bold',
                              width: 48,
                              height: 48
                            }}
                          >
                            {colors[index].medal}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Typography variant="body1" fontWeight="600">
                              {producto.nombre}
                            </Typography>
                          }
                          secondary={
                            <Box display="flex" alignItems="center" gap={2} mt={1}>
                              <Box display="flex" alignItems="center" gap={0.5}>
                                <ShoppingCart sx={{ fontSize: 14, color: 'text.secondary' }} />
                                <Typography variant="body2" color="text.secondary">
                                  {producto.cantidadVendida} uds
                                </Typography>
                              </Box>
                              <Box sx={{ width: 1, height: 4, bgcolor: alpha(CORPORATE_COLOR, 0.2) }} />
                              <Typography variant="body2" fontWeight="bold" sx={{ color: CORPORATE_COLOR }}>
                                ${producto.totalVendido.toLocaleString('es-MX')}
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItem>
                    );
                  })}
                </List>
              )}
            </StyledPaper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default DashboardPage;