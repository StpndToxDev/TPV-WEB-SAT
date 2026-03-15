// src/pages/QRTemplatesPage.tsx
import React, { useEffect, useState } from 'react';
import {
    Container,
    Typography,
    Box,
    Paper,
    Grid,
    TextField,
    Button,
    CircularProgress,
    Alert,
    Card,
    CardContent,
    Chip,
    FormHelperText,
    Avatar,
    Divider,
    Fade,
    Zoom,
    useTheme,
    alpha,
    IconButton,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Tooltip
} from '@mui/material';
import { styled } from '@mui/material/styles';
import Autocomplete from '@mui/material/Autocomplete';
import QrCodeIcon from '@mui/icons-material/QrCode';
import PrintIcon from '@mui/icons-material/Print';
import SearchIcon from '@mui/icons-material/Search';
import InventoryIcon from '@mui/icons-material/Inventory';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import RefreshIcon from '@mui/icons-material/Refresh';
import { QRCodeCanvas } from 'qrcode.react';
import { qrService } from '../api/qrService';
import type { QRProduct, ProductoSeleccionado } from '../types/QR.types';
import QRPrintDialog from '../components/QRPrintDialog';

// Definir el color corporativo
const CORPORATE_COLOR = '#303030';

// Componentes estilizados
const StyledPaper = styled(Paper)(({ theme }) => ({
    padding: theme.spacing(4),
    borderRadius: theme.spacing(2),
    boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
    transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
    '&:hover': {
        boxShadow: '0 12px 48px rgba(0,0,0,0.12)',
    }
}));

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

const StatsCard = styled(Card)(({ theme }) => ({
    borderRadius: theme.spacing(2),
    transition: 'all 0.3s ease',
    '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: theme.shadows[8]
    }
}));

// Tipo extendido para el producto que incluye group (solo para UI)
interface ProductoConGrupo extends QRProduct {
    group: string;
}

const QRTemplatesPage: React.FC = () => {
    const theme = useTheme();
    const [productos, setProductos] = useState<QRProduct[]>([]);
    const [selectedProduct, setSelectedProduct] = useState<ProductoConGrupo | null>(null);
    const [cantidadProducto, setCantidadProducto] = useState<number>(1);
    const [productosSeleccionados, setProductosSeleccionados] = useState<ProductoSeleccionado[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [printDialogOpen, setPrintDialogOpen] = useState(false);

    const QRS_PER_PAGE = 24; // 6x4 en hoja carta

    useEffect(() => {
        cargarProductos();
    }, []);

    const cargarProductos = async () => {
        setLoading(true);
        try {
            const data = await qrService.listarProductos();
            setProductos(data);
        } catch (err: any) {
            setError(err.message || 'Error al cargar productos');
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await cargarProductos();
        setRefreshing(false);
    };

    const handleProductChange = (event: any, newValue: ProductoConGrupo | null) => {
        setSelectedProduct(newValue);
        setError(null);
    };

    const handleCantidadProductoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(event.target.value);
        if (!isNaN(value) && value > 0 && value <= 100) {
            setCantidadProducto(value);
        }
    };

    const handleAgregarProducto = () => {
        if (!selectedProduct) {
            setError('Selecciona un producto');
            return;
        }

        if (!selectedProduct.codigo_qr) {
            setError('Este producto no tiene código QR asignado');
            return;
        }

        // Verificar si el producto ya está en la lista
        const existe = productosSeleccionados.find(p => p.id_producto === selectedProduct.id_producto);
        
        if (existe) {
            // Si existe, actualizar la cantidad
            const nuevosProductos = productosSeleccionados.map(p => 
                p.id_producto === selectedProduct.id_producto 
                    ? { ...p, cantidad: p.cantidad + cantidadProducto }
                    : p
            );
            setProductosSeleccionados(nuevosProductos);
        } else {
            // Si no existe, agregarlo
            const nuevoProducto: ProductoSeleccionado = {
                id_producto: selectedProduct.id_producto,
                nombre: selectedProduct.nombre,
                codigo_qr: selectedProduct.codigo_qr,
                cantidad: cantidadProducto
            };
            setProductosSeleccionados([...productosSeleccionados, nuevoProducto]);
        }

        // Limpiar selección
        setSelectedProduct(null);
        setCantidadProducto(1);
    };

    const handleEliminarProducto = (idProducto: string) => {
        setProductosSeleccionados(productosSeleccionados.filter(p => p.id_producto !== idProducto));
    };

    const handleActualizarCantidad = (idProducto: string, nuevaCantidad: number) => {
        if (nuevaCantidad < 1) return;
        
        setProductosSeleccionados(
            productosSeleccionados.map(p => 
                p.id_producto === idProducto 
                    ? { ...p, cantidad: nuevaCantidad }
                    : p
            )
        );
    };

    const handleGenerate = () => {
        if (productosSeleccionados.length === 0) {
            setError('Agrega al menos un producto');
            return;
        }

        setPrintDialogOpen(true);
    };

    const calcularTotalCodigos = () => {
        return productosSeleccionados.reduce((total, p) => total + p.cantidad, 0);
    };

    const calcularHojasNecesarias = () => {
        const totalCodigos = calcularTotalCodigos();
        return Math.ceil(totalCodigos / QRS_PER_PAGE);
    };

    const productosConQR = productos.filter(p => p.codigo_qr);
    const productoSinQR = productos.filter(p => !p.codigo_qr);

    // Crear opciones para el autocomplete
    const autocompleteOptions: ProductoConGrupo[] = [
        ...productosConQR.map(p => ({ 
            ...p, 
            group: 'Con QR' 
        })),
        ...productoSinQR.map(p => ({ 
            ...p, 
            group: 'Sin QR' 
        }))
    ];

    return (
        <Box sx={{ bgcolor: '#f5f5f5', minHeight: '100vh' }}>
            {/* Header con color corporativo */}
            <GradientHeader>
                <Container maxWidth="lg">
                    <Fade in timeout={1000}>
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Box display="flex" alignItems="center" gap={3}>
                                <Zoom in timeout={500}>
                                    <Avatar
                                        sx={{
                                            width: 80,
                                            height: 80,
                                            bgcolor: 'white',
                                            color: CORPORATE_COLOR,
                                            boxShadow: theme.shadows[4]
                                        }}
                                    >
                                        <QrCodeIcon sx={{ fontSize: 48 }} />
                                    </Avatar>
                                </Zoom>
                                <Box>
                                    <Typography variant="h3" component="h1" fontWeight="700" gutterBottom>
                                        Plantillas QR Múltiples
                                    </Typography>
                                    <Typography variant="h6" sx={{ opacity: 0.9, fontWeight: 400 }}>
                                        Genera códigos QR de múltiples productos en una misma hoja
                                    </Typography>
                                </Box>
                            </Box>
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
                        </Box>
                    </Fade>
                </Container>
            </GradientHeader>

            <Container maxWidth="lg" sx={{ pb: 6 }}>
                {/* Panel de estadísticas */}
                <Grid container spacing={3} sx={{ mb: 4 }}>
                    <Grid size={{xs:12, md:4}}>
                        <StatsCard>
                            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Avatar sx={{ bgcolor: alpha(CORPORATE_COLOR, 0.1), color: CORPORATE_COLOR }}>
                                    <InventoryIcon />
                                </Avatar>
                                <Box>
                                    <Typography variant="body2" color="text.secondary">
                                        Productos con QR
                                    </Typography>
                                    <Typography variant="h5" fontWeight="bold" sx={{ color: CORPORATE_COLOR }}>
                                        {productosConQR.length}
                                    </Typography>
                                </Box>
                            </CardContent>
                        </StatsCard>
                    </Grid>
                    <Grid size={{xs:12, md:4}}>
                        <StatsCard>
                            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Avatar sx={{ bgcolor: alpha('#ff9800', 0.1), color: '#ff9800' }}>
                                    <QrCodeIcon />
                                </Avatar>
                                <Box>
                                    <Typography variant="body2" color="text.secondary">
                                        Productos sin QR
                                    </Typography>
                                    <Typography variant="h5" fontWeight="bold" sx={{ color: '#ff9800' }}>
                                        {productoSinQR.length}
                                    </Typography>
                                </Box>
                            </CardContent>
                        </StatsCard>
                    </Grid>
                    <Grid size={{xs:12, md:4}}>
                        <StatsCard>
                            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Avatar sx={{ bgcolor: alpha('#4caf50', 0.1), color: '#4caf50' }}>
                                    <PictureAsPdfIcon />
                                </Avatar>
                                <Box>
                                    <Typography variant="body2" color="text.secondary">
                                        Hojas necesarias
                                    </Typography>
                                    <Typography variant="h5" fontWeight="bold" sx={{ color: '#4caf50' }}>
                                        {productosSeleccionados.length > 0 ? calcularHojasNecesarias() : '0'}
                                    </Typography>
                                </Box>
                            </CardContent>
                        </StatsCard>
                    </Grid>
                </Grid>

                {/* Panel de selección de productos */}
                <StyledPaper sx={{ mb: 4 }}>
                    <Typography variant="h5" fontWeight="600" gutterBottom sx={{ mb: 3, color: CORPORATE_COLOR }}>
                        Agregar productos a la plantilla
                    </Typography>
                    
                    <Grid container spacing={3}>
                        <Grid size={{xs:12, md:6}}>
                            <Autocomplete
                                options={autocompleteOptions}
                                groupBy={(option) => option.group}
                                getOptionLabel={(option) => `${option.nombre} (${option.codigo_qr || 'Sin QR'})`}
                                value={selectedProduct}
                                onChange={handleProductChange}
                                loading={loading}
                                isOptionEqualToValue={(option, value) => option.id_producto === value?.id_producto}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Buscar producto"
                                        variant="outlined"
                                        fullWidth
                                        InputProps={{
                                            ...params.InputProps,
                                            startAdornment: (
                                                <>
                                                    <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />
                                                    {params.InputProps.startAdornment}
                                                </>
                                            ),
                                        }}
                                        placeholder="Escribe para buscar un producto..."
                                    />
                                )}
                                renderOption={(props, option) => (
                                    <li {...props}>
                                        <Box display="flex" alignItems="center" justifyContent="space-between" width="100%">
                                            <Typography>{option.nombre}</Typography>
                                            {!option.codigo_qr && (
                                                <Chip
                                                    label="Sin QR"
                                                    size="small"
                                                    color="warning"
                                                    variant="outlined"
                                                    sx={{ ml: 1 }}
                                                />
                                            )}
                                        </Box>
                                    </li>
                                )}
                                noOptionsText="No se encontraron productos"
                                loadingText="Cargando productos..."
                                sx={{
                                    '& .MuiAutocomplete-groupLabel': {
                                        fontWeight: 'bold',
                                        color: CORPORATE_COLOR
                                    }
                                }}
                            />
                        </Grid>

                        <Grid size={{xs:12, md:3}}>
                            <TextField
                                fullWidth
                                label="Cantidad"
                                type="number"
                                value={cantidadProducto}
                                onChange={handleCantidadProductoChange}
                                InputProps={{
                                    inputProps: { min: 1, max: 100 }
                                }}
                                helperText="Máx 100 por producto"
                                variant="outlined"
                            />
                        </Grid>

                        <Grid size={{xs:12, md:3}}>
                            <Button
                                fullWidth
                                variant="contained"
                                size="large"
                                onClick={handleAgregarProducto}
                                disabled={!selectedProduct}
                                startIcon={<AddIcon />}
                                sx={{
                                    height: '56px',
                                    bgcolor: CORPORATE_COLOR,
                                    '&:hover': {
                                        bgcolor: '#1a1a1a',
                                    }
                                }}
                            >
                                Agregar a la lista
                            </Button>
                        </Grid>
                    </Grid>
                </StyledPaper>

                {/* Lista de productos seleccionados */}
                {productosSeleccionados.length > 0 && (
                    <Fade in timeout={500}>
                        <Paper sx={{ borderRadius: 2, overflow: 'hidden', mb: 4 }}>
                            <Box sx={{ p: 3, bgcolor: alpha(CORPORATE_COLOR, 0.04), borderBottom: `1px solid ${alpha(CORPORATE_COLOR, 0.1)}` }}>
                                <Typography variant="h6" fontWeight="bold" sx={{ color: CORPORATE_COLOR }}>
                                    Productos seleccionados
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Total: {calcularTotalCodigos()} códigos • {productosSeleccionados.length} productos
                                </Typography>
                            </Box>
                            <TableContainer>
                                <Table>
                                    <TableHead sx={{ bgcolor: alpha(CORPORATE_COLOR, 0.05) }}>
                                        <TableRow>
                                            <TableCell>Producto</TableCell>
                                            <TableCell align="center">Código QR</TableCell>
                                            <TableCell align="center">Cantidad</TableCell>
                                            <TableCell align="right">Acciones</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {productosSeleccionados.map((producto) => (
                                            <TableRow key={producto.id_producto}>
                                                <TableCell>
                                                    <Typography variant="body2" fontWeight="500">
                                                        {producto.nombre}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell align="center">
                                                    <Chip
                                                        label={producto.codigo_qr}
                                                        size="small"
                                                        sx={{ bgcolor: alpha(CORPORATE_COLOR, 0.1), fontFamily: 'monospace' }}
                                                    />
                                                </TableCell>
                                                <TableCell align="center">
                                                    <TextField
                                                        type="number"
                                                        value={producto.cantidad}
                                                        onChange={(e) => handleActualizarCantidad(
                                                            producto.id_producto,
                                                            parseInt(e.target.value) || 1
                                                        )}
                                                        size="small"
                                                        InputProps={{
                                                            inputProps: { min: 1, max: 100, style: { textAlign: 'center' } }
                                                        }}
                                                        sx={{ width: 80 }}
                                                    />
                                                </TableCell>
                                                <TableCell align="right">
                                                    <Tooltip title="Eliminar">
                                                        <IconButton
                                                            onClick={() => handleEliminarProducto(producto.id_producto)}
                                                            size="small"
                                                            sx={{ color: '#d32f2f' }}
                                                        >
                                                            <DeleteIcon />
                                                        </IconButton>
                                                    </Tooltip>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Paper>
                    </Fade>
                )}

                {/* Panel de generación */}
                <Paper sx={{ p: 4, borderRadius: 2, bgcolor: 'white' }}>
                    <Grid container spacing={3} alignItems="center">
                        <Grid size={{xs:12, md:8}}>
                            <Box display="flex" alignItems="center" gap={2}>
                                <Avatar sx={{ bgcolor: alpha(CORPORATE_COLOR, 0.1), color: CORPORATE_COLOR }}>
                                    <PictureAsPdfIcon />
                                </Avatar>
                                <Box>
                                    <Typography variant="body2" color="text.secondary">
                                        Resumen de impresión
                                    </Typography>
                                    <Typography variant="h6" fontWeight="bold">
                                        {calcularTotalCodigos()} códigos • {calcularHojasNecesarias()} hojas tamaño carta
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {productosSeleccionados.length} productos diferentes • {QRS_PER_PAGE} códigos por hoja
                                    </Typography>
                                </Box>
                            </Box>
                        </Grid>
                        <Grid size={{xs:12, md:4}}>
                            <Button
                                fullWidth
                                variant="contained"
                                size="large"
                                onClick={handleGenerate}
                                disabled={productosSeleccionados.length === 0}
                                startIcon={<PrintIcon />}
                                sx={{
                                    height: '56px',
                                    bgcolor: CORPORATE_COLOR,
                                    '&:hover': {
                                        bgcolor: '#1a1a1a',
                                    }
                                }}
                            >
                                Generar Plantilla
                            </Button>
                        </Grid>
                    </Grid>
                </Paper>

                {/* Mensajes de error */}
                {error && (
                    <Fade in timeout={500}>
                        <Alert
                            severity="error"
                            sx={{
                                mt: 3,
                                borderRadius: 2,
                                boxShadow: theme.shadows[2]
                            }}
                            onClose={() => setError(null)}
                        >
                            {error}
                        </Alert>
                    </Fade>
                )}

                {/* Loading */}
                {loading && (
                    <Box display="flex" justifyContent="center" alignItems="center" py={8}>
                        <CircularProgress sx={{ color: CORPORATE_COLOR }} />
                    </Box>
                )}
            </Container>

            {/* Diálogo de impresión */}
            <QRPrintDialog
                open={printDialogOpen}
                onClose={() => setPrintDialogOpen(false)}
                productos={productosSeleccionados}
                totalCodigos={calcularTotalCodigos()}
            />
        </Box>
    );
};

export default QRTemplatesPage;