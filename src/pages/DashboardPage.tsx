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
  AlertTitle
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  Inventory,
  People,
  Warning,
  Error as ErrorIcon,
  CheckCircle
} from '@mui/icons-material';
import { dashboardService } from '../api/dashboardService';
import type { DashboardStats } from '../types/Dashboard.types';

const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <LinearProgress sx={{ bgcolor: '#303030' }} />
      </Container>
    );
  }

  if (error || !stats) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error">
          <AlertTitle>Error</AlertTitle>
          {error || 'No se pudieron cargar los datos'}
        </Alert>
      </Container>
    );
  }

  return (
    <Box sx={{ bgcolor: '#f5f5f5', minHeight: '100vh', py: 4 }}>
      <Container maxWidth="xl">
        {/* Header */}
        <Box mb={4}>
          <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
            Dashboard
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Resumen general de tu tienda
          </Typography>
        </Box>

        {/* Fila 1: Tarjetas de resumen */}
        <Grid container spacing={3} mb={4}>
          <Grid item xs={12} md={3}>
            <Card sx={{ height: '100%', borderRadius: 2 }}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography color="text.secondary" gutterBottom variant="body2">
                      Total Artistas
                    </Typography>
                    <Typography variant="h3" fontWeight="bold">
                      {stats.totalArtistas}
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: '#303030', width: 64, height: 64 }}>
                    <People sx={{ fontSize: 32 }} />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card sx={{ height: '100%', borderRadius: 2 }}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography color="text.secondary" gutterBottom variant="body2">
                      Total Productos
                    </Typography>
                    <Typography variant="h3" fontWeight="bold">
                      {stats.totalProductos}
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: '#FF6B6B', width: 64, height: 64 }}>
                    <Inventory sx={{ fontSize: 32 }} />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card sx={{ height: '100%', borderRadius: 2 }}>
              <CardContent>
                <Box>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography color="text.secondary" variant="body2">
                      Ventas del mes
                    </Typography>
                    <Chip 
                      label={`${stats.resumenVentas.totalVentasMes} ventas`}
                      size="small"
                      sx={{ bgcolor: '#e0e0e0' }}
                    />
                  </Box>
                  <Typography variant="h3" fontWeight="bold">
                    {stats.resumenVentas.totalVentasMes}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card sx={{ height: '100%', borderRadius: 2 }}>
              <CardContent>
                <Box>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography color="text.secondary" variant="body2">
                      Ingresos del mes
                    </Typography>
                    <Box display="flex" alignItems="center">
                      {stats.resumenVentas.variacionPorcentual >= 0 ? (
                        <TrendingUp sx={{ color: '#4CAF50', mr: 0.5 }} />
                      ) : (
                        <TrendingDown sx={{ color: '#FF6B6B', mr: 0.5 }} />
                      )}
                      <Typography
                        variant="body2"
                        sx={{
                          color: stats.resumenVentas.variacionPorcentual >= 0 ? '#4CAF50' : '#FF6B6B',
                          fontWeight: 'bold'
                        }}
                      >
                        {Math.abs(stats.resumenVentas.variacionPorcentual).toFixed(1)}%
                      </Typography>
                    </Box>
                  </Box>
                  <Typography variant="h3" fontWeight="bold">
                    ${stats.resumenVentas.ingresosMes.toLocaleString('es-MX')}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    vs mes anterior
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Fila 2: Alertas de Stock y Top Productos */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, borderRadius: 2, height: '100%', maxHeight: 500, overflow: 'auto' }}>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Typography variant="h6" fontWeight="bold">
                  Alertas de Stock
                </Typography>
                <Chip
                  icon={<Warning />}
                  label={stats.alertasStock.length}
                  color={stats.alertasStock.length > 0 ? 'warning' : 'success'}
                />
              </Box>

              {stats.alertasStock.length === 0 ? (
                <Box textAlign="center" py={8}>
                  <CheckCircle sx={{ fontSize: 48, color: '#4CAF50', mb: 2 }} />
                  <Typography color="text.secondary">
                    No hay alertas de stock
                  </Typography>
                </Box>
              ) : (
                <List>
                  {stats.alertasStock.map((alerta, index) => (
                    <React.Fragment key={`${alerta.id_producto}-${alerta.talla}`}>
                      <ListItem alignItems="flex-start" sx={{ px: 0 }}>
                        <ListItemAvatar>
                          {alerta.imagen_url ? (
                            <Avatar src={alerta.imagen_url} variant="rounded" />
                          ) : (
                            <Avatar variant="rounded" sx={{ bgcolor: '#f0f0f0' }}>
                              <Inventory />
                            </Avatar>
                          )}
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Box display="flex" alignItems="center" gap={1}>
                              <Typography variant="body1" fontWeight="500">
                                {alerta.nombre}
                              </Typography>
                              {alerta.categoria === 'ropa' && (
                                <Chip label={alerta.talla} size="small" sx={{ bgcolor: '#e0e0e0' }} />
                              )}
                            </Box>
                          }
                          secondary={
                            <Box component="span" display="flex" alignItems="center" gap={1} mt={0.5}>
                              <Chip
                                icon={<ErrorIcon />}
                                label={`Stock: ${alerta.stock_actual}`}
                                size="small"
                                color={alerta.stock_actual === 0 ? 'error' : 'warning'}
                                variant="outlined"
                              />
                              <Typography variant="caption" color="text.secondary">
                                Mín: {alerta.stock_minimo}
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItem>
                      {index < stats.alertasStock.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              )}
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, borderRadius: 2, height: '100%' }}>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Top 3 Productos más Vendidos
              </Typography>
              {stats.topProductos.length === 0 ? (
                <Box textAlign="center" py={8}>
                  <Typography color="text.secondary">
                    No hay ventas para mostrar
                  </Typography>
                </Box>
              ) : (
                <List>
                  {stats.topProductos.map((producto, index) => {
                    const colors = ['#FFD700', '#C0C0C0', '#CD7F32'];
                    return (
                      <ListItem key={producto.id_producto} sx={{ px: 0 }}>
                        <ListItemAvatar>
                          <Avatar
                            sx={{
                              bgcolor: colors[index],
                              color: index === 0 ? '#000' : '#fff',
                              fontWeight: 'bold',
                              width: 40,
                              height: 40
                            }}
                          >
                            {index + 1}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Typography variant="body1" fontWeight="500">
                              {producto.nombre}
                            </Typography>
                          }
                          secondary={
                            <Box display="flex" gap={2} mt={0.5}>
                              <Typography variant="body2" color="text.secondary">
                                {producto.cantidadVendida} unidades
                              </Typography>
                              <Typography variant="body2" fontWeight="bold" color="#303030">
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
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default DashboardPage;