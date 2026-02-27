import React, { useEffect, useState } from 'react';
import {
    Container,
    Typography,
    Box,
    Paper,
    Grid,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Button,
    Card,
    CardContent,
    CardMedia,
    Chip,
    CircularProgress,
    Alert
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { es } from 'date-fns/locale';
import { productService } from '../api/productService';
import { reportService } from '../api/reportService';
import type { Artista } from '../types/Product.types';
import type { ReporteProducto } from '../types/Report.types';

const ReportsPage: React.FC = () => {
    const [artistas, setArtistas] = useState<Artista[]>([]);
    const [selectedArtista, setSelectedArtista] = useState('');
    const [fechaInicio, setFechaInicio] = useState<Date | null>(null);
    const [fechaFin, setFechaFin] = useState<Date | null>(null);
    const [reporte, setReporte] = useState<ReporteProducto[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingArtistas, setLoadingArtistas] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [totales, setTotales] = useState({
        totalProductos: 0,
        totalVendido: 0,
        totalGanancia: 0
    });

    useEffect(() => {
        cargarArtistas();
    }, []);

    const cargarArtistas = async () => {
        setLoadingArtistas(true);
        try {
            const data = await productService.listarArtistas();
            setArtistas(data);
        } catch (err: any) {
            setError(err.message || 'Error al cargar artistas');
        } finally {
            setLoadingArtistas(false);
        }
    };

    const handleBuscar = async () => {
        if (!selectedArtista) {
            setError('Selecciona un artista');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const params: any = {
                id_artista: selectedArtista
            };

            if (fechaInicio) {
                params.fecha_inicio = fechaInicio.toISOString().split('T')[0];
            }
            if (fechaFin) {
                params.fecha_fin = fechaFin.toISOString().split('T')[0];
            }

            const data = await reportService.obtenerReporteArtista(params);
            console.log('Datos recibidos:', data); // Para debug
            setReporte(data);

            const totalProductos = data.length;
            const totalVendido = data.reduce((sum, item) => sum + item.total_vendido, 0);
            const totalGanancia = data.reduce((sum, item) => sum + item.ganancia, 0);

            setTotales({
                totalProductos,
                totalVendido,
                totalGanancia
            });
        } catch (err: any) {
            setError(err.message || 'Error al generar reporte');
            console.error('Error:', err);
        } finally {
            setLoading(false);
        }
    };

    const formatMoneda = (valor: number) => {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN',
            minimumFractionDigits: 2
        }).format(valor);
    };

    return (
        <Box sx={{ bgcolor: '#f5f5f5', minHeight: '100vh', py: 4 }}>
            <Container maxWidth="xl">
                {/* Header */}
                <Box
                    sx={{
                        bgcolor: '#303030',
                        color: 'white',
                        py: 4,
                        mb: 4,
                        boxShadow: 3
                    }}
                >
                    <Container maxWidth="xl">
                        <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
                            <Box>
                                <Typography variant="h4" component="h1" fontWeight="bold">
                                    Reportes por Artista
                                </Typography>
                                <Typography variant="subtitle1" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                                    Analiza las ventas de cada artista en un período específico
                                </Typography>
                            </Box>
                            {/* Botón opcional si quieres agregar algo, si no, elimina este Box */}
                        </Box>
                    </Container>
                </Box>

                {/* Filtros */}
                <Paper sx={{ p: 3, mb: 4, borderRadius: 2 }}>
                    <Grid container spacing={3} alignItems="flex-end">
                        <Grid size={{xs:12, md:4}}>
                            <FormControl fullWidth sx={{ width: '200px' }}>
                                <InputLabel>Artista *</InputLabel>
                                <Select
                                    value={selectedArtista}
                                    onChange={(e) => setSelectedArtista(e.target.value)}
                                    label="Artista *"
                                    disabled={loadingArtistas}
                                    displayEmpty
                                >
                                    {artistas.map((artista) => (
                                        <MenuItem key={artista.id_artista} value={artista.id_artista}>
                                            {artista.nombre}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid size={{xs:12, md:3}}>
                            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
                                <DatePicker
                                    label="Fecha inicio"
                                    value={fechaInicio}
                                    onChange={(newValue) => setFechaInicio(newValue)}
                                    slotProps={{
                                        textField: {
                                            fullWidth: true,
                                            variant: 'outlined'
                                        }
                                    }}
                                />
                            </LocalizationProvider>
                        </Grid>

                        <Grid size={{xs:12, md:3}}>
                            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
                                <DatePicker
                                    label="Fecha fin"
                                    value={fechaFin}
                                    onChange={(newValue) => setFechaFin(newValue)}
                                    slotProps={{
                                        textField: {
                                            fullWidth: true,
                                            variant: 'outlined'
                                        }
                                    }}
                                />
                            </LocalizationProvider>
                        </Grid>

                        <Grid size={{xs:12, md:2}}>
                            <Button
                                fullWidth
                                variant="contained"
                                size="large"
                                onClick={handleBuscar}
                                disabled={loading}
                                startIcon={<SearchIcon />}
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

                {/* Tarjetas de resumen */}
                {reporte.length > 0 && (
                    <Grid container spacing={3} sx={{ mb: 4 }}>
                        <Grid size={{xs:12, md:4}}>
                            <Card sx={{ borderRadius: 2, bgcolor: '#303030', color: 'white' }}>
                                <CardContent>
                                    <Box display="flex" alignItems="center" justifyContent="space-between">
                                        <Box>
                                            <Typography variant="body2" sx={{ opacity: 0.8 }} gutterBottom>
                                                Productos vendidos
                                            </Typography>
                                            <Typography variant="h4" fontWeight="bold">
                                                {totales.totalProductos}
                                            </Typography>
                                        </Box>
                                        <ShoppingCartIcon sx={{ fontSize: 48, opacity: 0.8 }} />
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>

                        <Grid size={{xs:12, md:4}}>
                            <Card sx={{ borderRadius: 2, bgcolor: '#FF6B6B', color: 'white' }}>
                                <CardContent>
                                    <Box display="flex" alignItems="center" justifyContent="space-between">
                                        <Box>
                                            <Typography variant="body2" sx={{ opacity: 0.8 }} gutterBottom>
                                                Total vendido
                                            </Typography>
                                            <Typography variant="h4" fontWeight="bold">
                                                {formatMoneda(totales.totalVendido)}
                                            </Typography>
                                        </Box>
                                        <AttachMoneyIcon sx={{ fontSize: 48, opacity: 0.8 }} />
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>

                        <Grid size={{xs:12, md:4}}>
                            <Card sx={{ borderRadius: 2, bgcolor: '#4CAF50', color: 'white' }}>
                                <CardContent>
                                    <Box display="flex" alignItems="center" justifyContent="space-between">
                                        <Box>
                                            <Typography variant="body2" sx={{ opacity: 0.8 }} gutterBottom>
                                                Ganancia total
                                            </Typography>
                                            <Typography variant="h4" fontWeight="bold">
                                                {formatMoneda(totales.totalGanancia)}
                                            </Typography>
                                        </Box>
                                        <TrendingUpIcon sx={{ fontSize: 48, opacity: 0.8 }} />
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>
                )}

                {/* Resultados */}
                {loading ? (
                    <Box display="flex" justifyContent="center" py={8}>
                        <CircularProgress sx={{ color: '#303030' }} />
                    </Box>
                ) : error ? (
                    <Alert severity="error" sx={{ borderRadius: 2 }}>
                        {error}
                    </Alert>
                ) : reporte.length === 0 ? (
                    <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
                        <Typography variant="h6" color="text.secondary" gutterBottom>
                            No hay datos para mostrar
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Selecciona un artista y rango de fechas para ver el reporte
                        </Typography>
                    </Paper>
                ) : (
                    <Grid container spacing={3}>
                        {reporte.map((producto) => (
                            <Grid size={{xs:12, sm:6, md:4, lg:3}} key={producto.id_producto}>
                                <Card sx={{
                                    height: 380,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    borderRadius: 2,
                                    transition: 'transform 0.2s, box-shadow 0.2s',
                                    '&:hover': {
                                        transform: 'translateY(-4px)',
                                        boxShadow: 6
                                    }
                                }}>
                                    <CardMedia
                                        component="img"
                                        height="140"
                                        image={producto.imagen_url || 'https://via.placeholder.com/300x140?text=Sin+imagen'}
                                        alt={producto.nombre}
                                        sx={{ objectFit: 'cover' }}
                                    />
                                    <CardContent sx={{ flexGrow: 1 }}>
                                        <Typography variant="h6" component="h3" fontWeight="bold" gutterBottom noWrap>
                                            {producto.nombre}
                                        </Typography>

                                        <Chip
                                            label={producto.categoria}
                                            size="small"
                                            sx={{ mb: 2, bgcolor: '#e0e0e0' }}
                                        />

                                        <Box sx={{ mt: 2 }}>
                                            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                                                <Typography variant="body2" color="text.secondary">
                                                    Unidades vendidas:
                                                </Typography>
                                                <Typography variant="body1" fontWeight="bold" color="#303030">
                                                    {producto.cantidad_vendida}
                                                </Typography>
                                            </Box>

                                            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                                                <Typography variant="body2" color="text.secondary">
                                                    Total ventas:
                                                </Typography>
                                                <Typography variant="body1" fontWeight="bold" color="#FF6B6B">
                                                    {formatMoneda(producto.total_vendido)}
                                                </Typography>
                                            </Box>

                                            <Box display="flex" justifyContent="space-between" alignItems="center">
                                                <Typography variant="body2" color="text.secondary">
                                                    Ganancia:
                                                </Typography>
                                                <Typography variant="body1" fontWeight="bold" color="#4CAF50">
                                                    {formatMoneda(producto.ganancia)}
                                                </Typography>
                                            </Box>

                                            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                                                Ganancia por unidad: {formatMoneda(producto.ganancia / producto.cantidad_vendida)}
                                            </Typography>
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                )}
            </Container>
        </Box>
    );
};

export default ReportsPage;