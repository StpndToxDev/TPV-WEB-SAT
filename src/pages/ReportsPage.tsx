// src/pages/ReportsPage.tsx
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
    Alert,
    Avatar,
    Fade,
    Zoom,
    useTheme,
    alpha,
    Divider,
    Tooltip
} from '@mui/material';
import { styled } from '@mui/material/styles';
import SearchIcon from '@mui/icons-material/Search';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import PersonIcon from '@mui/icons-material/Person';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import RefreshIcon from '@mui/icons-material/Refresh';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { es } from 'date-fns/locale';
import { productService } from '../api/productService';
import { reportService } from '../api/reportService';
import type { Artista } from '../types/Product.types';
import type { ReporteProducto } from '../types/Report.types';

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
    padding: theme.spacing(4),
    marginBottom: theme.spacing(4),
    borderRadius: theme.spacing(2),
    boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
    transition: 'box-shadow 0.3s ease',
    '&:hover': {
        boxShadow: '0 12px 48px rgba(0,0,0,0.12)'
    }
}));

const StatsCard = styled(Card)(({ theme }) => ({
    borderRadius: theme.spacing(2),
    transition: 'all 0.3s ease',
    position: 'relative',
    overflow: 'hidden',
    '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: theme.shadows[8]
    },
    '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 100%)',
        pointerEvents: 'none'
    }
}));

const ProductCard = styled(Card)(({ theme }) => ({
    height: 420,
    display: 'flex',
    flexDirection: 'column',
    borderRadius: theme.spacing(2),
    transition: 'all 0.3s ease',
    overflow: 'hidden',
    '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: theme.shadows[8]
    }
}));

const EmptyStateCard = styled(Paper)(({ theme }) => ({
    padding: theme.spacing(6),
    textAlign: 'center',
    borderRadius: theme.spacing(2),
    background: 'white',
    boxShadow: '0 8px 32px rgba(0,0,0,0.08)'
}));

const StyledFormControl = styled(FormControl)(({ theme }) => ({
    minWidth: 200,
    '& .MuiOutlinedInput-root': {
        borderRadius: theme.spacing(1.5),
        backgroundColor: 'white',
        transition: 'box-shadow 0.2s ease',
        '&:hover, &.Mui-focused': {
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }
    }
}));

const ReportsPage: React.FC = () => {
    const theme = useTheme();
    const [artistas, setArtistas] = useState<Artista[]>([]);
    const [selectedArtista, setSelectedArtista] = useState('');
    const [fechaInicio, setFechaInicio] = useState<Date | null>(null);
    const [fechaFin, setFechaFin] = useState<Date | null>(null);
    const [reporte, setReporte] = useState<ReporteProducto[]>([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
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

    const handleRefresh = async () => {
        setRefreshing(true);
        await cargarArtistas();
        setRefreshing(false);
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
            console.log('Datos recibidos:', data);
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

    // Obtener nombre del artista seleccionado
    const getArtistaSeleccionado = () => {
        return artistas.find(a => a.id_artista === selectedArtista)?.nombre || '';
    };

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
                                        <TrendingUpIcon sx={{ fontSize: 32 }} />
                                    </Avatar>
                                </Zoom>
                                <Box>
                                    <Typography variant="h3" component="h1" fontWeight="700">
                                        Reportes por Artista
                                    </Typography>
                                    <Typography variant="h6" sx={{ opacity: 0.9, fontWeight: 400 }}>
                                        Analiza las ventas de cada artista en un período específico
                                    </Typography>
                                </Box>
                            </Box>
                            <Button
                                variant="outlined"
                                startIcon={<RefreshIcon />}
                                onClick={handleRefresh}
                                disabled={refreshing || loadingArtistas}
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
                </Container>
            </GradientHeader>

            <Container maxWidth="xl" sx={{ pb: 4 }}>
                {/* Filtros mejorados */}
                <FilterPaper>
                    <Grid container spacing={3} alignItems="flex-end">
                        <Grid size={{xs:12, md:3}}>
                            <StyledFormControl fullWidth>
                                <InputLabel>Artista *</InputLabel>
                                <Select
                                    value={selectedArtista}
                                    onChange={(e) => setSelectedArtista(e.target.value)}
                                    label="Artista *"
                                    disabled={loadingArtistas}
                                    displayEmpty
                                    startAdornment={
                                        <PersonIcon sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} />
                                    }
                                >
                                    {artistas.map((artista) => (
                                        <MenuItem key={artista.id_artista} value={artista.id_artista}>
                                            <Box display="flex" alignItems="center" gap={1}>
                                                <Avatar sx={{ width: 24, height: 24, bgcolor: alpha(CORPORATE_COLOR, 0.1), color: CORPORATE_COLOR, fontSize: 12 }}>
                                                    {artista.nombre.charAt(0)}
                                                </Avatar>
                                                {artista.nombre}
                                            </Box>
                                        </MenuItem>
                                    ))}
                                </Select>
                            </StyledFormControl>
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

                        <Grid size={{xs:12, md:3}}>
                            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
                                <DatePicker
                                    label="Fecha fin"
                                    value={fechaFin}
                                    onChange={(newValue) => setFechaFin(newValue)}
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

                        <Grid size={{xs:12, md:3}}>
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
                                {loading ? 'Buscando...' : 'Generar Reporte'}
                            </Button>
                        </Grid>
                    </Grid>

                    {/* Información de filtros activos */}
                    {selectedArtista && (
                        <Fade in timeout={500}>
                            <Box sx={{ mt: 2, display: 'flex', gap: 1, alignItems: 'center' }}>
                                <Typography variant="body2" color="text.secondary">
                                    Filtros activos:
                                </Typography>
                                <Chip
                                    icon={<PersonIcon />}
                                    label={getArtistaSeleccionado()}
                                    size="small"
                                    onDelete={() => setSelectedArtista('')}
                                    sx={{ bgcolor: alpha(CORPORATE_COLOR, 0.1) }}
                                />
                                {fechaInicio && (
                                    <Chip
                                        icon={<CalendarTodayIcon />}
                                        label={`Desde: ${fechaInicio.toLocaleDateString()}`}
                                        size="small"
                                        onDelete={() => setFechaInicio(null)}
                                        sx={{ bgcolor: alpha(CORPORATE_COLOR, 0.1) }}
                                    />
                                )}
                                {fechaFin && (
                                    <Chip
                                        icon={<CalendarTodayIcon />}
                                        label={`Hasta: ${fechaFin.toLocaleDateString()}`}
                                        size="small"
                                        onDelete={() => setFechaFin(null)}
                                        sx={{ bgcolor: alpha(CORPORATE_COLOR, 0.1) }}
                                    />
                                )}
                            </Box>
                        </Fade>
                    )}
                </FilterPaper>

                {/* Tarjetas de resumen mejoradas */}
                {reporte.length > 0 && (
                    <Fade in timeout={800}>
                        <Grid container spacing={3} sx={{ mb: 4 }}>
                            <Grid size={{xs:12, md:4}}>
                                <StatsCard sx={{ bgcolor: CORPORATE_COLOR, color: 'white' }}>
                                    <CardContent>
                                        <Box display="flex" alignItems="center" justifyContent="space-between">
                                            <Box>
                                                <Typography variant="body2" sx={{ opacity: 0.8, mb: 1 }}>
                                                    Productos vendidos
                                                </Typography>
                                                <Typography variant="h2" fontWeight="bold">
                                                    {totales.totalProductos}
                                                </Typography>
                                            </Box>
                                            <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
                                                <ShoppingCartIcon sx={{ fontSize: 28 }} />
                                            </Avatar>
                                        </Box>
                                    </CardContent>
                                </StatsCard>
                            </Grid>

                            <Grid size={{xs:12, md:4}}>
                                <StatsCard sx={{ bgcolor: '#FF6B6B', color: 'white' }}>
                                    <CardContent>
                                        <Box display="flex" alignItems="center" justifyContent="space-between">
                                            <Box>
                                                <Typography variant="body2" sx={{ opacity: 0.8, mb: 1 }}>
                                                    Total vendido
                                                </Typography>
                                                <Typography variant="h2" fontWeight="bold">
                                                    {formatMoneda(totales.totalVendido)}
                                                </Typography>
                                            </Box>
                                            <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
                                                <AttachMoneyIcon sx={{ fontSize: 28 }} />
                                            </Avatar>
                                        </Box>
                                    </CardContent>
                                </StatsCard>
                            </Grid>

                            <Grid size={{xs:12, md:4}}>
                                <StatsCard sx={{ bgcolor: '#4CAF50', color: 'white' }}>
                                    <CardContent>
                                        <Box display="flex" alignItems="center" justifyContent="space-between">
                                            <Box>
                                                <Typography variant="body2" sx={{ opacity: 0.8, mb: 1 }}>
                                                    Ganancia total
                                                </Typography>
                                                <Typography variant="h2" fontWeight="bold">
                                                    {formatMoneda(totales.totalGanancia)}
                                                </Typography>
                                            </Box>
                                            <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
                                                <TrendingUpIcon sx={{ fontSize: 28 }} />
                                            </Avatar>
                                        </Box>
                                    </CardContent>
                                </StatsCard>
                            </Grid>
                        </Grid>
                    </Fade>
                )}

                {/* Resultados */}
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
                ) : reporte.length === 0 ? (
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
                                    <TrendingUpIcon sx={{ fontSize: 40 }} />
                                </Avatar>
                            </Zoom>
                            <Typography variant="h5" fontWeight="600" gutterBottom>
                                No hay datos para mostrar
                            </Typography>
                            <Typography variant="body1" color="text.secondary">
                                Selecciona un artista y rango de fechas para ver el reporte
                            </Typography>
                        </EmptyStateCard>
                    </Fade>
                ) : (
                    <Fade in timeout={500}>
                        <Box>
                            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                                <Typography variant="h5" fontWeight="600" sx={{ color: CORPORATE_COLOR }}>
                                    Resultados ({reporte.length} productos)
                                </Typography>
                                <Chip
                                    icon={<ShoppingCartIcon />}
                                    label={`Total: ${formatMoneda(totales.totalVendido)}`}
                                    sx={{ bgcolor: alpha(CORPORATE_COLOR, 0.1), color: CORPORATE_COLOR }}
                                />
                            </Box>
                            <Divider sx={{ mb: 3 }} />
                            <Grid container spacing={3}>
                                {reporte.map((producto, index) => (
                                    <Grid size={{xs:12, sm:6, md:4, lg:3}} key={producto.id_producto}>
                                        <ProductCard
                                            sx={{
                                                animation: `fadeInUp 0.5s ease ${index * 0.05}s both`,
                                                '@keyframes fadeInUp': {
                                                    from: {
                                                        opacity: 0,
                                                        transform: 'translateY(20px)'
                                                    },
                                                    to: {
                                                        opacity: 1,
                                                        transform: 'translateY(0)'
                                                    }
                                                }
                                            }}
                                        >
                                            <Box sx={{ position: 'relative' }}>
                                                <CardMedia
                                                    component="img"
                                                    height="160"
                                                    image={producto.imagen_url || 'https://via.placeholder.com/300x160?text=Sin+imagen'}
                                                    alt={producto.nombre}
                                                    sx={{ objectFit: 'cover' }}
                                                />
                                                <Chip
                                                    label={producto.categoria}
                                                    size="small"
                                                    sx={{
                                                        position: 'absolute',
                                                        top: 8,
                                                        right: 8,
                                                        bgcolor: 'rgba(255,255,255,0.9)',
                                                        fontWeight: 500,
                                                        backdropFilter: 'blur(4px)'
                                                    }}
                                                />
                                            </Box>
                                            <CardContent sx={{ flexGrow: 1, p: 2 }}>
                                                <Tooltip title={producto.nombre}>
                                                    <Typography 
                                                        variant="h6" 
                                                        component="h3" 
                                                        fontWeight="600" 
                                                        gutterBottom 
                                                        noWrap
                                                        sx={{ color: CORPORATE_COLOR }}
                                                    >
                                                        {producto.nombre}
                                                    </Typography>
                                                </Tooltip>

                                                <Box sx={{ mt: 2 }}>
                                                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
                                                        <Typography variant="body2" color="text.secondary">
                                                            Unidades vendidas:
                                                        </Typography>
                                                        <Chip
                                                            label={producto.cantidad_vendida}
                                                            size="small"
                                                            sx={{ 
                                                                bgcolor: alpha(CORPORATE_COLOR, 0.1),
                                                                color: CORPORATE_COLOR,
                                                                fontWeight: 600
                                                            }}
                                                        />
                                                    </Box>

                                                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
                                                        <Typography variant="body2" color="text.secondary">
                                                            Total ventas:
                                                        </Typography>
                                                        <Typography variant="body1" fontWeight="bold" sx={{ color: '#FF6B6B' }}>
                                                            {formatMoneda(producto.total_vendido)}
                                                        </Typography>
                                                    </Box>

                                                    <Divider sx={{ my: 1.5 }} />

                                                    <Box display="flex" justifyContent="space-between" alignItems="center">
                                                        <Typography variant="body2" color="text.secondary">
                                                            Ganancia:
                                                        </Typography>
                                                        <Typography variant="body1" fontWeight="bold" sx={{ color: '#4CAF50' }}>
                                                            {formatMoneda(producto.ganancia)}
                                                        </Typography>
                                                    </Box>

                                                    <Box display="flex" justifyContent="space-between" alignItems="center" mt={1}>
                                                        <Typography variant="caption" color="text.secondary">
                                                            Por unidad:
                                                        </Typography>
                                                        <Typography variant="caption" fontWeight="500" sx={{ color: CORPORATE_COLOR }}>
                                                            {formatMoneda(producto.ganancia / producto.cantidad_vendida)}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            </CardContent>
                                        </ProductCard>
                                    </Grid>
                                ))}
                            </Grid>
                        </Box>
                    </Fade>
                )}
            </Container>
        </Box>
    );
};

export default ReportsPage;