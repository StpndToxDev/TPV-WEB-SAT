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
    alpha
} from '@mui/material';
import { styled } from '@mui/material/styles';
import Autocomplete from '@mui/material/Autocomplete';
import QrCodeIcon from '@mui/icons-material/QrCode';
import PrintIcon from '@mui/icons-material/Print';
import SearchIcon from '@mui/icons-material/Search';
import InventoryIcon from '@mui/icons-material/Inventory';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import { QRCodeCanvas } from 'qrcode.react';
import { qrService } from '../api/qrService';
import type { QRProduct } from '../types/QR.types';
import QRPrintDialog from '../components/QRPrintDialog';

// Definir el color corporativo
const CORPORATE_COLOR = '#303030';

// Componentes estilizados con el color corporativo
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

const QRPreviewBox = styled(Box)(({ theme }) => ({
    width: 200,
    height: 200,
    backgroundColor: theme.palette.grey[100],
    borderRadius: theme.spacing(2),
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: `2px dashed ${CORPORATE_COLOR}`,
    transition: 'all 0.3s ease',
    '&:hover': {
        borderColor: CORPORATE_COLOR,
        backgroundColor: alpha(CORPORATE_COLOR, 0.04)
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
    const [cantidad, setCantidad] = useState<number>(24);
    const [loading, setLoading] = useState(true);
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

    const handleProductChange = (event: any, newValue: ProductoConGrupo | null) => {
        setSelectedProduct(newValue);
        setError(null);
    };

    const handleCantidadChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(event.target.value);
        if (!isNaN(value) && value > 0 && value <= 1000) {
            setCantidad(value);
        }
    };

    const handleGenerate = () => {
        if (!selectedProduct) {
            setError('Selecciona un producto');
            return;
        }

        if (cantidad < 1 || cantidad > 1000) {
            setError('La cantidad debe ser entre 1 y 1000');
            return;
        }

        if (!selectedProduct.codigo_qr) {
            setError('Este producto no tiene código QR asignado');
            return;
        }

        setPrintDialogOpen(true);
    };

    const calcularHojasNecesarias = () => {
        return Math.ceil(cantidad / QRS_PER_PAGE);
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
                                    Plantillas QR
                                </Typography>
                                <Typography variant="h6" sx={{ opacity: 0.9, fontWeight: 400 }}>
                                    Genera e imprime códigos QR de los productos
                                </Typography>
                            </Box>
                        </Box>
                    </Fade>
                </Container>
            </GradientHeader>

            <Container maxWidth="lg" sx={{ pb: 6 }}>
                {/* Panel de estadísticas con colores corporativos */}
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
                                        Hojas por lote
                                    </Typography>
                                    <Typography variant="h5" fontWeight="bold" sx={{ color: '#4caf50' }}>
                                        {selectedProduct ? calcularHojasNecesarias() : '0'}
                                    </Typography>
                                </Box>
                            </CardContent>
                        </StatsCard>
                    </Grid>
                </Grid>

                {/* Panel de configuración */}
                <StyledPaper sx={{ mb: 4 }}>
                    <Typography variant="h5" fontWeight="600" gutterBottom sx={{ mb: 3, color: CORPORATE_COLOR }}>
                        Configuración de la plantilla
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
                            {!selectedProduct && error && (
                                <FormHelperText error sx={{ mt: 1 }}>
                                    {error}
                                </FormHelperText>
                            )}
                        </Grid>

                        <Grid size={{xs:12, md:3}}>
                            <TextField
                                fullWidth
                                label="Cantidad de códigos"
                                type="number"
                                value={cantidad}
                                onChange={handleCantidadChange}
                                InputProps={{
                                    inputProps: { min: 1, max: 1000 }
                                }}
                                helperText={`Máximo 1000 códigos (${Math.ceil(1000 / QRS_PER_PAGE)} hojas)`}
                                variant="outlined"
                            />
                        </Grid>

                        <Grid size={{xs:12, md:3}}>
                            <Button
                                fullWidth
                                variant="contained"
                                size="large"
                                onClick={handleGenerate}
                                disabled={loading || !selectedProduct}
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

                    {/* Información adicional */}
                    {selectedProduct && (
                        <Fade in timeout={500}>
                            <Box sx={{
                                mt: 4,
                                p: 3,
                                bgcolor: alpha(CORPORATE_COLOR, 0.04),
                                borderRadius: 2,
                                border: `1px solid ${alpha(CORPORATE_COLOR, 0.1)}`
                            }}>
                                <Grid container spacing={3}>
                                    <Grid size={{xs:12, md:6}}>
                                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                            Producto seleccionado
                                        </Typography>
                                        <Box display="flex" alignItems="center" gap={2}>
                                            <Avatar sx={{ bgcolor: CORPORATE_COLOR, width: 40, height: 40 }}>
                                                <QrCodeIcon sx={{ fontSize: 20 }} />
                                            </Avatar>
                                            <Box>
                                                <Typography variant="h6" fontWeight="600" sx={{ color: CORPORATE_COLOR }}>
                                                    {selectedProduct.nombre}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    Código QR: {selectedProduct.codigo_qr}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </Grid>
                                    <Grid size={{xs:12, md:6}}>
                                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                            Resumen de impresión
                                        </Typography>
                                        <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                                            <Box>
                                                <Typography variant="h5" fontWeight="bold" sx={{ color: CORPORATE_COLOR }}>
                                                    {cantidad}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    Códigos totales
                                                </Typography>
                                            </Box>
                                            <Divider orientation="vertical" flexItem sx={{ borderColor: alpha(CORPORATE_COLOR, 0.2) }} />
                                            <Box>
                                                <Typography variant="h5" fontWeight="bold" sx={{ color: CORPORATE_COLOR }}>
                                                    {calcularHojasNecesarias()}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    Hojas tamaño carta
                                                </Typography>
                                            </Box>
                                            <Divider orientation="vertical" flexItem sx={{ borderColor: alpha(CORPORATE_COLOR, 0.2) }} />
                                            <Box>
                                                <Typography variant="h5" fontWeight="bold" sx={{ color: CORPORATE_COLOR }}>
                                                    {QRS_PER_PAGE}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    Códigos por hoja
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </Grid>
                                </Grid>
                            </Box>
                        </Fade>
                    )}
                </StyledPaper>

                {/* Vista previa */}
                {selectedProduct && (
                    <Fade in timeout={500}>
                        <Card sx={{ borderRadius: 3, overflow: 'hidden' }}>
                            <Box sx={{ bgcolor: CORPORATE_COLOR, px: 3, py: 2 }}>
                                <Typography variant="h6" color="white" fontWeight="600">
                                    Vista previa del código QR
                                </Typography>
                            </Box>
                            <CardContent sx={{ p: 4 }}>
                                <Grid container spacing={4} alignItems="center">
                                    <Grid size={{xs:12, md:4}}>
                                        <QRPreviewBox>
                                            <QRCodeCanvas
                                                value={selectedProduct.codigo_qr}
                                                size={160}
                                                level="H"
                                                includeMargin={false}
                                                bgColor="#ffffff"
                                                fgColor={CORPORATE_COLOR}
                                            />
                                        </QRPreviewBox>
                                    </Grid>
                                    <Grid size={{xs:12, md:8}}>
                                        <Typography variant="body1" paragraph sx={{ fontWeight: 500 }}>
                                            Características del código QR:
                                        </Typography>
                                        <Grid container spacing={2}>
                                            <Grid size={{xs:6}}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: CORPORATE_COLOR }} />
                                                    <Typography variant="body2">Tamaño exacto: 3cm x 3cm</Typography>
                                                </Box>
                                            </Grid>
                                            <Grid size={{xs:6}}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: CORPORATE_COLOR }} />
                                                    <Typography variant="body2">Nombre del producto incluido</Typography>
                                                </Box>
                                            </Grid>
                                            <Grid size={{xs:6}}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: CORPORATE_COLOR }} />
                                                    <Typography variant="body2">Alta resolución para impresión</Typography>
                                                </Box>
                                            </Grid>
                                            <Grid size={{xs:6}}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: CORPORATE_COLOR }} />
                                                    <Typography variant="body2">Formato optimizado para hoja carta</Typography>
                                                </Box>
                                            </Grid>
                                        </Grid>
                                    </Grid>
                                </Grid>
                            </CardContent>
                        </Card>
                    </Fade>
                )}

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
                producto={selectedProduct}
                cantidad={cantidad}
            />
        </Box>
    );
};

export default QRTemplatesPage;