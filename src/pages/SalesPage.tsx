// src/pages/SalesPage.tsx
import React, { useEffect, useState, useRef } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Divider,
  CircularProgress,
  Alert,
  Avatar,
  Fade,
  Zoom,
  useTheme,
  alpha,
  Card,
  CardContent,
  Tooltip,
  Badge
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  Visibility as VisibilityIcon,
  Download as DownloadIcon,
  Search as SearchIcon,
  AttachMoney as AttachMoneyIcon,
  Receipt as ReceiptIcon,
  CalendarToday as CalendarTodayIcon,
  Payment as PaymentIcon,
  ShoppingCart as ShoppingCartIcon,
  Person as PersonIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { es } from 'date-fns/locale';
import { startOfWeek, endOfWeek, format } from 'date-fns';
import * as XLSX from 'xlsx';
import { salesService } from '../api/salesService';
import type { VentaResumen, VentaItem } from '../types/Sales.types';

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

const FilterPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(4),
  borderRadius: theme.spacing(2),
  boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
  transition: 'box-shadow 0.3s ease',
  '&:hover': {
    boxShadow: '0 12px 48px rgba(0,0,0,0.12)'
  }
}));

const StyledTableContainer = styled(TableContainer)(({ theme }) => ({
  borderRadius: theme.spacing(2),
  overflow: 'hidden',
  '& .MuiTableHead-root': {
    backgroundColor: alpha(CORPORATE_COLOR, 0.05),
    '& .MuiTableCell-root': {
      fontWeight: 600,
      color: CORPORATE_COLOR
    }
  }
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  transition: 'background-color 0.2s ease',
  '&:hover': {
    backgroundColor: alpha(CORPORATE_COLOR, 0.02)
  }
}));

const MethodChip = styled(Chip)(({ theme }) => ({
  fontWeight: 500,
  color: 'white',
  '&.efectivo': {
    backgroundColor: '#4CAF50'
  },
  '&.tarjeta': {
    backgroundColor: '#2196F3'
  },
  '&.transferencia': {
    backgroundColor: '#FF9800'
  }
}));

const StatsCard = styled(Card)(({ theme }) => ({
  borderRadius: theme.spacing(2),
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: theme.shadows[4]
  }
}));

const EmptyStateCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(6),
  textAlign: 'center',
  borderRadius: theme.spacing(2),
  background: 'white',
  boxShadow: '0 8px 32px rgba(0,0,0,0.08)'
}));

const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    borderRadius: theme.spacing(2),
    overflow: 'hidden'
  }
}));

const SalesPage: React.FC = () => {
  const theme = useTheme();
  const [ventas, setVentas] = useState<VentaResumen[]>([]);
  const [detalleCompleto, setDetalleCompleto] = useState<VentaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedVenta, setSelectedVenta] = useState<VentaResumen | null>(null);
  const [detalleOpen, setDetalleOpen] = useState(false);
  
  // Referencia para mantener la página actual después de recargar
  const currentPageRef = useRef(page);

  // Fechas por defecto: semana actual
  const [fechaInicio, setFechaInicio] = useState<Date>(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [fechaFin, setFechaFin] = useState<Date>(endOfWeek(new Date(), { weekStartsOn: 1 }));

  useEffect(() => {
    cargarVentas();
  }, []);

  // Actualizar la referencia cuando cambia la página
  useEffect(() => {
    currentPageRef.current = page;
  }, [page]);

  const cargarVentas = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const fechaInicioStr = format(fechaInicio, 'yyyy-MM-dd');
      const fechaFinStr = format(fechaFin, 'yyyy-MM-dd');
      
      const data = await salesService.obtenerVentas(fechaInicioStr, fechaFinStr);
      setVentas(data.resumen);
      setDetalleCompleto(data.detalle);
    } catch (err: any) {
      setError(err.message || 'Error al cargar ventas');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await cargarVentas();
    setRefreshing(false);
  };

  const handleBuscar = () => {
    setPage(0);
    cargarVentas();
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleVerDetalle = (venta: VentaResumen) => {
    setSelectedVenta(venta);
    setDetalleOpen(true);
  };

  const formatMoneda = (valor: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2
    }).format(valor);
  };

  const formatFecha = (fechaStr: string) => {
    const fecha = new Date(fechaStr);
    return format(fecha, 'dd/MM/yyyy HH:mm');
  };

  const exportarAExcel = () => {
    if (detalleCompleto.length === 0) return;
    
    // Preparar datos para Excel
    const datosExcel = detalleCompleto.map(item => ({
      'ID Venta': item.id_venta,
      'Fecha': formatFecha(item.fecha_hora),
      'Producto': item.nombre_producto,
      'Artista': item.nombre_artista,
      'Talla': item.talla,
      'Cantidad': item.cantidad,
      'Precio Unitario': item.precio_unitario,
      'Subtotal': item.subtotal,
      'Método de Pago': item.metodo_pago,
      'Ganancia Artista': item.ganancia_producto,
      'Notas': item.notas
    }));
    
    // Crear hoja de cálculo
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(datosExcel);
    
    // Ajustar ancho de columnas
    const colWidths = [
      { wch: 15 }, // ID Venta
      { wch: 20 }, // Fecha
      { wch: 30 }, // Producto
      { wch: 25 }, // Artista
      { wch: 10 }, // Talla
      { wch: 10 }, // Cantidad
      { wch: 15 }, // Precio Unitario
      { wch: 15 }, // Subtotal
      { wch: 15 }, // Método de Pago
      { wch: 15 }, // Ganancia Artista
      { wch: 30 }, // Notas
    ];
    ws['!cols'] = colWidths;
    
    XLSX.utils.book_append_sheet(wb, ws, 'Ventas');
    
    // Descargar archivo
    const fechaInicioStr = format(fechaInicio, 'yyyyMMdd');
    const fechaFinStr = format(fechaFin, 'yyyyMMdd');
    XLSX.writeFile(wb, `ventas_${fechaInicioStr}_${fechaFinStr}.xlsx`);
  };

  // Calcular estadísticas
  const totalVentas = ventas.length;
  const totalIngresos = ventas.reduce((sum, v) => sum + v.total, 0);
  const totalProductosVendidos = detalleCompleto.reduce((sum, item) => sum + item.cantidad, 0);
  const metodosPago = ventas.reduce((acc, v) => {
    acc[v.metodo_pago] = (acc[v.metodo_pago] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <Box sx={{ bgcolor: '#f5f5f5', minHeight: '100vh' }}>
      {/* Header mejorado con gradiente */}
      <GradientHeader>
        <Container maxWidth="xl">
          <Fade in timeout={1000}>
            <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
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
                    <ReceiptIcon sx={{ fontSize: 32 }} />
                  </Avatar>
                </Zoom>
                <Box>
                  <Typography variant="h3" component="h1" fontWeight="700">
                    Reporte de Ventas
                  </Typography>
                  <Typography variant="h6" sx={{ opacity: 0.9, fontWeight: 400 }}>
                    Visualiza y exporta las ventas realizadas
                  </Typography>
                </Box>
              </Box>
              <Box display="flex" gap={2}>
                <Button
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={handleRefresh}
                  disabled={refreshing || loading}
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
                <Button
                  variant="contained"
                  startIcon={<DownloadIcon />}
                  onClick={exportarAExcel}
                  disabled={detalleCompleto.length === 0}
                  sx={{
                    bgcolor: 'white',
                    color: CORPORATE_COLOR,
                    '&:hover': { 
                      bgcolor: '#f0f0f0',
                      transform: 'scale(1.02)'
                    },
                    transition: 'transform 0.2s ease'
                  }}
                >
                  Exportar Excel
                </Button>
              </Box>
            </Box>
          </Fade>
        </Container>
      </GradientHeader>

      <Container maxWidth="xl" sx={{ pb: 4 }}>
        {/* Filtros mejorados */}
        <FilterPaper>
          <Grid container spacing={3} alignItems="flex-end">
            <Grid size={{xs:12, md:4}}>
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
                <DatePicker
                  label="Fecha inicio"
                  value={fechaInicio}
                  onChange={(newValue) => newValue && setFechaInicio(newValue)}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      variant: 'outlined',
                      InputProps: {
                        startAdornment: <CalendarTodayIcon sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} />
                      },
                      sx: {
                        backgroundColor: 'white',
                        borderRadius: 1.5,
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 1.5
                        }
                      }
                    }
                  }}
                />
              </LocalizationProvider>
            </Grid>

            <Grid size={{xs:12, md:4}}>
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
                <DatePicker
                  label="Fecha fin"
                  value={fechaFin}
                  onChange={(newValue) => newValue && setFechaFin(newValue)}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      variant: 'outlined',
                      InputProps: {
                        startAdornment: <CalendarTodayIcon sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} />
                      },
                      sx: {
                        backgroundColor: 'white',
                        borderRadius: 1.5,
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 1.5
                        }
                      }
                    }
                  }}
                />
              </LocalizationProvider>
            </Grid>

            <Grid size={{xs:12, md:4}}>
              <Button
                fullWidth
                variant="contained"
                size="large"
                onClick={handleBuscar}
                disabled={loading}
                startIcon={<SearchIcon />}
                sx={{
                  height: 56,
                  background: `linear-gradient(45deg, ${CORPORATE_COLOR} 30%, #1a1a1a 90%)`,
                  boxShadow: '0 3px 5px 2px rgba(48,48,48,0.3)',
                  '&:hover': {
                    background: `linear-gradient(45deg, ${CORPORATE_COLOR} 30%, #000000 90%)`,
                  }
                }}
              >
                {loading ? 'Buscando...' : 'Buscar'}
              </Button>
            </Grid>
          </Grid>
        </FilterPaper>

        {/* Tarjetas de estadísticas */}
        {!loading && ventas.length > 0 && (
          <Fade in timeout={800}>
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid size={{xs:12, md:3}}>
                <StatsCard>
                  <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ bgcolor: alpha(CORPORATE_COLOR, 0.1), color: CORPORATE_COLOR }}>
                      <ReceiptIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Total Ventas
                      </Typography>
                      <Typography variant="h5" fontWeight="bold" sx={{ color: CORPORATE_COLOR }}>
                        {totalVentas}
                      </Typography>
                    </Box>
                  </CardContent>
                </StatsCard>
              </Grid>
              <Grid size={{xs:12, md:3}}>
                <StatsCard>
                  <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ bgcolor: alpha('#FF6B6B', 0.1), color: '#FF6B6B' }}>
                      <AttachMoneyIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Total Ingresos
                      </Typography>
                      <Typography variant="h5" fontWeight="bold" sx={{ color: '#FF6B6B' }}>
                        {formatMoneda(totalIngresos)}
                      </Typography>
                    </Box>
                  </CardContent>
                </StatsCard>
              </Grid>
              <Grid size={{xs:12, md:3}}>
                <StatsCard>
                  <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ bgcolor: alpha('#4CAF50', 0.1), color: '#4CAF50' }}>
                      <ShoppingCartIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Productos Vendidos
                      </Typography>
                      <Typography variant="h5" fontWeight="bold" sx={{ color: '#4CAF50' }}>
                        {totalProductosVendidos}
                      </Typography>
                    </Box>
                  </CardContent>
                </StatsCard>
              </Grid>
              <Grid size={{xs:12, md:3}}>
                <StatsCard>
                  <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ bgcolor: alpha('#2196F3', 0.1), color: '#2196F3' }}>
                      <PaymentIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Métodos de Pago
                      </Typography>
                      <Box display="flex" gap={0.5} flexWrap="wrap">
                        {Object.entries(metodosPago).map(([metodo, count]) => (
                          <Chip
                            key={metodo}
                            label={`${metodo}: ${count}`}
                            size="small"
                            sx={{ 
                              bgcolor: alpha(
                                metodo === 'efectivo' ? '#4CAF50' :
                                metodo === 'tarjeta' ? '#2196F3' : '#FF9800',
                                0.1
                              ),
                              color: metodo === 'efectivo' ? '#4CAF50' :
                                     metodo === 'tarjeta' ? '#2196F3' : '#FF9800',
                              fontSize: '0.7rem'
                            }}
                          />
                        ))}
                      </Box>
                    </Box>
                  </CardContent>
                </StatsCard>
              </Grid>
            </Grid>
          </Fade>
        )}

        {/* Tabla de ventas mejorada */}
        {loading ? (
          <Fade in timeout={500}>
            <Box display="flex" justifyContent="center" py={8}>
              <CircularProgress sx={{ color: CORPORATE_COLOR }} />
            </Box>
          </Fade>
        ) : error ? (
          <Fade in timeout={500}>
            <Alert 
              severity="error" 
              sx={{ 
                borderRadius: 2,
                boxShadow: theme.shadows[2]
              }}
              onClose={() => setError(null)}
            >
              {error}
            </Alert>
          </Fade>
        ) : ventas.length === 0 ? (
          <Fade in timeout={800}>
            <EmptyStateCard>
              <Zoom in timeout={600}>
                <Avatar
                  sx={{
                    width: 80,
                    height: 80,
                    bgcolor: alpha(CORPORATE_COLOR, 0.1),
                    color: CORPORATE_COLOR,
                    margin: '0 auto 16px'
                  }}
                >
                  <ReceiptIcon sx={{ fontSize: 40 }} />
                </Avatar>
              </Zoom>
              <Typography variant="h5" fontWeight="600" gutterBottom>
                No hay ventas en el período seleccionado
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Prueba con otro rango de fechas o selecciona una semana diferente
              </Typography>
            </EmptyStateCard>
          </Fade>
        ) : (
          <Fade in timeout={500}>
            <Paper elevation={0} sx={{ borderRadius: 2, overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.08)' }}>
              <StyledTableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>ID Venta</strong></TableCell>
                      <TableCell><strong>Fecha</strong></TableCell>
                      <TableCell><strong>Método de Pago</strong></TableCell>
                      <TableCell align="right"><strong>Total</strong></TableCell>
                      <TableCell align="center"><strong>Productos</strong></TableCell>
                      <TableCell align="center"><strong>Acciones</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {ventas
                      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                      .map((venta, index) => (
                        <StyledTableRow 
                          key={venta.id_venta}
                          sx={{
                            animation: `fadeInUp 0.5s ease ${index * 0.05}s both`,
                            '@keyframes fadeInUp': {
                              from: {
                                opacity: 0,
                                transform: 'translateY(10px)'
                              },
                              to: {
                                opacity: 1,
                                transform: 'translateY(0)'
                              }
                            }
                          }}
                        >
                          <TableCell>
                            <Typography variant="body2" fontWeight="600" sx={{ color: CORPORATE_COLOR }}>
                              {venta.id_venta}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Box display="flex" alignItems="center" gap={1}>
                              <CalendarTodayIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                              <Typography variant="body2">
                                {formatFecha(venta.fecha_hora)}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={venta.metodo_pago}
                              size="small"
                              className={venta.metodo_pago}
                              sx={{
                                bgcolor: 
                                  venta.metodo_pago === 'efectivo' ? alpha('#4CAF50', 0.9) :
                                  venta.metodo_pago === 'tarjeta' ? alpha('#2196F3', 0.9) : alpha('#FF9800', 0.9),
                                color: 'white',
                                fontWeight: 500
                              }}
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Typography fontWeight="bold" sx={{ color: '#FF6B6B' }}>
                              {formatMoneda(venta.total)}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Badge
                              badgeContent={venta.productos.length}
                              color="primary"
                              sx={{
                                '& .MuiBadge-badge': {
                                  bgcolor: CORPORATE_COLOR,
                                  color: 'white'
                                }
                              }}
                            >
                              <ShoppingCartIcon sx={{ color: alpha(CORPORATE_COLOR, 0.5) }} />
                            </Badge>
                          </TableCell>
                          <TableCell align="center">
                            <Tooltip title="Ver detalles">
                              <IconButton
                                size="small"
                                onClick={() => handleVerDetalle(venta)}
                                sx={{ 
                                  color: CORPORATE_COLOR,
                                  '&:hover': {
                                    bgcolor: alpha(CORPORATE_COLOR, 0.1)
                                  }
                                }}
                              >
                                <VisibilityIcon />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </StyledTableRow>
                      ))}
                  </TableBody>
                </Table>
              </StyledTableContainer>
              <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
                component="div"
                count={ventas.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                labelRowsPerPage="Filas por página"
                sx={{
                  borderTop: `1px solid ${alpha(CORPORATE_COLOR, 0.1)}`,
                  '& .MuiTablePagination-select': {
                    borderRadius: 1
                  }
                }}
              />
            </Paper>
          </Fade>
        )}
      </Container>

      {/* Modal de detalle de venta mejorado */}
      <StyledDialog
        open={detalleOpen}
        onClose={() => setDetalleOpen(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedVenta && (
          <>
            <DialogTitle sx={{
              background: `linear-gradient(135deg, ${CORPORATE_COLOR} 0%, #1a1a1a 100%)`,
              color: 'white',
              py: 2
            }}>
              <Box display="flex" alignItems="center" gap={1}>
                <ReceiptIcon />
                <Typography variant="h6" fontWeight="bold">
                  Detalle de Venta
                </Typography>
              </Box>
            </DialogTitle>
            
            <DialogContent sx={{ p: 3, bgcolor: '#f8f9fa' }}>
              <Fade in timeout={500}>
                <Box>
                  <Paper elevation={0} sx={{ p: 2, mb: 3, bgcolor: 'white', borderRadius: 2 }}>
                    <Grid container spacing={2}>
                      <Grid size={{xs:12, sm:6}}>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          ID Venta
                        </Typography>
                        <Typography variant="body1" fontWeight="bold" sx={{ color: CORPORATE_COLOR }}>
                          {selectedVenta.id_venta}
                        </Typography>
                      </Grid>
                      <Grid size={{xs:12, sm:6}}>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          Fecha
                        </Typography>
                        <Box display="flex" alignItems="center" gap={1}>
                          <CalendarTodayIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                          <Typography variant="body1">
                            {formatFecha(selectedVenta.fecha_hora)}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid size={{xs:12, sm:6}}>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          Método de Pago
                        </Typography>
                        <Chip
                          label={selectedVenta.metodo_pago}
                          size="small"
                          sx={{
                            bgcolor: 
                              selectedVenta.metodo_pago === 'efectivo' ? alpha('#4CAF50', 0.9) :
                              selectedVenta.metodo_pago === 'tarjeta' ? alpha('#2196F3', 0.9) : alpha('#FF9800', 0.9),
                            color: 'white',
                            fontWeight: 500
                          }}
                        />
                      </Grid>
                      <Grid size={{xs:12, sm:6}}>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          Total
                        </Typography>
                        <Typography variant="h6" fontWeight="bold" sx={{ color: '#FF6B6B' }}>
                          {formatMoneda(selectedVenta.total)}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Paper>

                  <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ color: CORPORATE_COLOR }}>
                    Productos
                  </Typography>

                  <List sx={{ bgcolor: 'white', borderRadius: 2, overflow: 'hidden' }}>
                    {selectedVenta.productos.map((producto, index) => (
                      <React.Fragment key={`${producto.id_producto}-${index}`}>
                        <ListItem sx={{ py: 2 }}>
                          <ListItemText
                            primary={
                              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                                <Typography variant="body1" fontWeight="600" sx={{ color: CORPORATE_COLOR }}>
                                  {producto.nombre_producto}
                                </Typography>
                                {producto.talla !== 'UNICA' && (
                                  <Chip
                                    label={`Talla: ${producto.talla}`}
                                    size="small"
                                    sx={{ bgcolor: alpha(CORPORATE_COLOR, 0.1), color: CORPORATE_COLOR }}
                                  />
                                )}
                              </Box>
                            }
                            secondary={
                              <Box>
                                <Grid container spacing={2} sx={{ mb: 1 }}>
                                  <Grid size={{xs:4}}>
                                    <Typography variant="caption" color="text.secondary">
                                      Cantidad
                                    </Typography>
                                    <Typography variant="body2" fontWeight="500">
                                      {producto.cantidad}
                                    </Typography>
                                  </Grid>
                                  <Grid size={{xs:4}}>
                                    <Typography variant="caption" color="text.secondary">
                                      Precio Unit.
                                    </Typography>
                                    <Typography variant="body2" fontWeight="500">
                                      {formatMoneda(producto.precio_unitario)}
                                    </Typography>
                                  </Grid>
                                  <Grid size={{xs:4}}>
                                    <Typography variant="caption" color="text.secondary">
                                      Subtotal
                                    </Typography>
                                    <Typography variant="body2" fontWeight="bold" sx={{ color: '#FF6B6B' }}>
                                      {formatMoneda(producto.subtotal)}
                                    </Typography>
                                  </Grid>
                                </Grid>
                                <Box display="flex" alignItems="center" gap={1}>
                                  <PersonIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                                  <Typography variant="caption" color="text.secondary">
                                    {producto.nombre_artista}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">•</Typography>
                                  <AttachMoneyIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                                  <Typography variant="caption" color="text.secondary">
                                    Ganancia: {formatMoneda(producto.ganancia_producto)}
                                  </Typography>
                                </Box>
                              </Box>
                            }
                          />
                        </ListItem>
                        {index < selectedVenta.productos.length - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                  </List>

                  {selectedVenta.productos[0]?.notas && (
                    <>
                      <Divider sx={{ my: 2 }} />
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Notas
                      </Typography>
                      <Paper variant="outlined" sx={{ p: 2, bgcolor: 'white', borderRadius: 2 }}>
                        <Typography variant="body2">
                          {selectedVenta.productos[0].notas}
                        </Typography>
                      </Paper>
                    </>
                  )}
                </Box>
              </Fade>
            </DialogContent>
            
            <DialogActions sx={{ p: 3, bgcolor: '#f8f9fa', borderTop: `1px solid ${alpha(CORPORATE_COLOR, 0.1)}` }}>
              <Button
                onClick={() => setDetalleOpen(false)}
                variant="contained"
                sx={{
                  bgcolor: CORPORATE_COLOR,
                  '&:hover': { bgcolor: '#1a1a1a' },
                  px: 4
                }}
              >
                Cerrar
              </Button>
            </DialogActions>
          </>
        )}
      </StyledDialog>
    </Box>
  );
};

export default SalesPage;