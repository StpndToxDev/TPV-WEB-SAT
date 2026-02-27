import React, { useEffect, useState } from 'react';
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
  TextField
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  Download as DownloadIcon,
  PictureAsPdf as PdfIcon,
  TableChart as ExcelIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { es } from 'date-fns/locale';
import { subDays, startOfWeek, endOfWeek, format } from 'date-fns';
import * as XLSX from 'xlsx';
import { salesService } from '../api/salesService';
import type { VentaResumen, VentaItem } from '../types/Sales.types';

const SalesPage: React.FC = () => {
  const [ventas, setVentas] = useState<VentaResumen[]>([]);
  const [detalleCompleto, setDetalleCompleto] = useState<VentaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedVenta, setSelectedVenta] = useState<VentaResumen | null>(null);
  const [detalleOpen, setDetalleOpen] = useState(false);
  
  // Fechas por defecto: semana actual
  const [fechaInicio, setFechaInicio] = useState<Date>(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [fechaFin, setFechaFin] = useState<Date>(endOfWeek(new Date(), { weekStartsOn: 1 }));

  useEffect(() => {
    cargarVentas();
  }, []);

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

  return (
    <Box sx={{ bgcolor: '#f5f5f5', minHeight: '100vh' }}>
      {/* Header */}
      <Box sx={{ bgcolor: '#303030', color: 'white', py: 4, mb: 4, boxShadow: 3 }}>
        <Container maxWidth="xl">
          <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
            <Box>
              <Typography variant="h4" component="h1" fontWeight="bold">
                Reporte de Ventas
              </Typography>
              <Typography variant="subtitle1" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                Visualiza y exporta las ventas realizadas
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<DownloadIcon />}
              onClick={exportarAExcel}
              disabled={detalleCompleto.length === 0}
              sx={{
                bgcolor: 'white',
                color: '#303030',
                '&:hover': { bgcolor: '#f0f0f0' }
              }}
            >
              Exportar Excel
            </Button>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="xl">
        {/* Filtros */}
        <Paper sx={{ p: 3, mb: 4, borderRadius: 2 }}>
          <Grid container spacing={3} alignItems="flex-end">
            <Grid item xs={12} md={4}>
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
                <DatePicker
                  label="Fecha inicio"
                  value={fechaInicio}
                  onChange={(newValue) => newValue && setFechaInicio(newValue)}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      variant: 'outlined'
                    }
                  }}
                />
              </LocalizationProvider>
            </Grid>

            <Grid item xs={12} md={4}>
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
                <DatePicker
                  label="Fecha fin"
                  value={fechaFin}
                  onChange={(newValue) => newValue && setFechaFin(newValue)}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      variant: 'outlined'
                    }
                  }}
                />
              </LocalizationProvider>
            </Grid>

            <Grid item xs={12} md={4}>
              <Button
                fullWidth
                variant="contained"
                size="large"
                onClick={handleBuscar}
                disabled={loading}
                sx={{
                  py: 1.5,
                  bgcolor: '#303030',
                  '&:hover': { bgcolor: '#1a1a1a' }
                }}
              >
                {loading ? 'Buscando...' : 'Buscar'}
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* Tabla de ventas */}
        {loading ? (
          <Box display="flex" justifyContent="center" py={8}>
            <CircularProgress sx={{ color: '#303030' }} />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ borderRadius: 2 }}>
            {error}
          </Alert>
        ) : ventas.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No hay ventas en el período seleccionado
            </Typography>
          </Paper>
        ) : (
          <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
            <TableContainer>
              <Table>
                <TableHead sx={{ bgcolor: '#f0f0f0' }}>
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
                    .map((venta) => (
                      <TableRow key={venta.id_venta} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight="500">
                            {venta.id_venta}
                          </Typography>
                        </TableCell>
                        <TableCell>{formatFecha(venta.fecha_hora)}</TableCell>
                        <TableCell>
                          <Chip
                            label={venta.metodo_pago}
                            size="small"
                            sx={{
                              bgcolor: 
                                venta.metodo_pago === 'efectivo' ? '#4CAF50' :
                                venta.metodo_pago === 'tarjeta' ? '#2196F3' : '#FF9800',
                              color: 'white'
                            }}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Typography fontWeight="bold" color="#FF6B6B">
                            {formatMoneda(venta.total)}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={`${venta.productos.length} productos`}
                            size="small"
                            sx={{ bgcolor: '#e0e0e0' }}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <IconButton
                            size="small"
                            onClick={() => handleVerDetalle(venta)}
                            sx={{ color: '#303030' }}
                          >
                            <VisibilityIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={ventas.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              labelRowsPerPage="Filas por página"
            />
          </Paper>
        )}
      </Container>

      {/* Modal de detalle de venta */}
      <Dialog
        open={detalleOpen}
        onClose={() => setDetalleOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        {selectedVenta && (
          <>
            <DialogTitle sx={{ bgcolor: '#303030', color: 'white' }}>
              <Typography variant="h6" fontWeight="bold">
                Detalle de Venta
              </Typography>
            </DialogTitle>
            <Box sx={{ height: 8 }} />
            <DialogContent sx={{ p: 3 }}>
              <Box mb={3}>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      ID Venta
                    </Typography>
                    <Typography variant="body1" fontWeight="bold">
                      {selectedVenta.id_venta}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Fecha
                    </Typography>
                    <Typography variant="body1">
                      {formatFecha(selectedVenta.fecha_hora)}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Método de Pago
                    </Typography>
                    <Chip
                      label={selectedVenta.metodo_pago}
                      size="small"
                      sx={{
                        mt: 0.5,
                        bgcolor: 
                          selectedVenta.metodo_pago === 'efectivo' ? '#4CAF50' :
                          selectedVenta.metodo_pago === 'tarjeta' ? '#2196F3' : '#FF9800',
                        color: 'white'
                      }}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Total
                    </Typography>
                    <Typography variant="h6" fontWeight="bold" color="#FF6B6B">
                      {formatMoneda(selectedVenta.total)}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Productos
              </Typography>

              <List>
                {selectedVenta.productos.map((producto, index) => (
                  <React.Fragment key={`${producto.id_producto}-${index}`}>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemText
                        primary={
                          <Box display="flex" justifyContent="space-between">
                            <Typography variant="body1" fontWeight="500">
                              {producto.nombre_producto}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {producto.talla !== 'UNICA' ? `Talla: ${producto.talla}` : ''}
                            </Typography>
                          </Box>
                        }
                        secondary={
                          <Box mt={1}>
                            <Grid container spacing={2}>
                              <Grid item xs={4}>
                                <Typography variant="caption" color="text.secondary">
                                  Cantidad
                                </Typography>
                                <Typography variant="body2">
                                  {producto.cantidad}
                                </Typography>
                              </Grid>
                              <Grid item xs={4}>
                                <Typography variant="caption" color="text.secondary">
                                  Precio Unit.
                                </Typography>
                                <Typography variant="body2">
                                  {formatMoneda(producto.precio_unitario)}
                                </Typography>
                              </Grid>
                              <Grid item xs={4}>
                                <Typography variant="caption" color="text.secondary">
                                  Subtotal
                                </Typography>
                                <Typography variant="body2" fontWeight="bold" color="#FF6B6B">
                                  {formatMoneda(producto.subtotal)}
                                </Typography>
                              </Grid>
                            </Grid>
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                              Artista: {producto.nombre_artista} | Ganancia: {formatMoneda(producto.ganancia_producto)}
                            </Typography>
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
                  <Paper variant="outlined" sx={{ p: 2, bgcolor: '#f9f9f9' }}>
                    <Typography variant="body2">
                      {selectedVenta.productos[0].notas}
                    </Typography>
                  </Paper>
                </>
              )}
            </DialogContent>
            <DialogActions sx={{ p: 3 }}>
              <Button onClick={() => setDetalleOpen(false)} variant="contained" sx={{ bgcolor: '#303030' }}>
                Cerrar
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default SalesPage;