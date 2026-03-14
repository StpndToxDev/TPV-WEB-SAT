// src/pages/ProductListPage.tsx
import React, { useEffect, useState } from 'react';
import {
    Container,
    Typography,
    Button,
    Box,
    Alert,
    Snackbar,
    CircularProgress,
    TextField,
    InputAdornment,
    Avatar,
    Fade,
    Zoom,
    useTheme,
    alpha,
    Card,
    CardContent,
    Chip,
    Grid
} from '@mui/material';
import { styled } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import InventoryIcon from '@mui/icons-material/Inventory';
import CategoryIcon from '@mui/icons-material/Category';
import QrCodeIcon from '@mui/icons-material/QrCode';
import RefreshIcon from '@mui/icons-material/Refresh';
import { productService } from '../api/productService';
import type { Producto, CreateProductPayload, Artista } from '../types/Product.types';
import ProductCard from '../components/ProductCard';
import ProductForm from '../components/ProductForm';
import ConfirmDialog from '../components/ConfirmDialog';
import ProductDetailsDialog from '../components/ProductDetailsDialog';

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

const SearchField = styled(TextField)(({ theme }) => ({
    backgroundColor: 'white',
    borderRadius: theme.spacing(2),
    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
    transition: 'box-shadow 0.3s ease',
    '&:hover, &:focus-within': {
        boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
    },
    '& .MuiOutlinedInput-root': {
        borderRadius: theme.spacing(2),
        '& fieldset': {
            borderColor: 'transparent'
        },
        '&:hover fieldset': {
            borderColor: 'transparent'
        },
        '&.Mui-focused fieldset': {
            borderColor: 'transparent'
        }
    }
}));

const EmptyStateCard = styled(Card)(({ theme }) => ({
    borderRadius: theme.spacing(2),
    padding: theme.spacing(6),
    textAlign: 'center',
    background: 'white',
    boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
    '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: '0 12px 48px rgba(0,0,0,0.12)'
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

const ProductsGrid = styled(Box)({
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: 24,
    justifyContent: 'center'
});

const ProductListPage: React.FC = () => {
    const theme = useTheme();
    const [products, setProducts] = useState<Producto[]>([]);
    const [artistas, setArtistas] = useState<Artista[]>([]);
    const [filteredProducts, setFilteredProducts] = useState<Producto[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [formOpen, setFormOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Producto | null>(null);
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Producto | null>(null);
    const [confirmDialog, setConfirmDialog] = useState<{
        open: boolean;
        productId: string | null;
        productName: string;
    }>({
        open: false,
        productId: null,
        productName: ''
    });
    const [snackbar, setSnackbar] = useState<{
        open: boolean;
        message: string;
        severity: 'success' | 'error';
    }>({ open: false, message: '', severity: 'success' });

    const handleViewDetails = (product: Producto) => {
        setSelectedProduct(product);
        setDetailsOpen(true);
    };

    const loadData = async () => {
        setLoading(true);
        try {
            const [productsData, artistasData] = await Promise.all([
                productService.listar(),
                productService.listarArtistas()
            ]);
            setProducts(productsData);
            setFilteredProducts(productsData);
            setArtistas(artistasData);
        } catch (err: any) {
            showSnackbar(err.message || 'Error al cargar los datos', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        const filtered = products.filter(product =>
            product.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.codigo_qr.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.categoria.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredProducts(filtered);
    }, [searchTerm, products]);

    const handleRefresh = async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    };

    const showSnackbar = (message: string, severity: 'success' | 'error') => {
        setSnackbar({ open: true, message, severity });
    };

    const handleCreate = async (data: CreateProductPayload) => {
        console.log('Datos a enviar:', data);
        try {
            await productService.crear(data);
            await loadData();
            showSnackbar('Producto creado exitosamente', 'success');
        } catch (err: any) {
            showSnackbar(err.message || 'Error al crear el producto', 'error');
            throw err;
        }
    };

    const handleUpdate = async (data: CreateProductPayload) => {
        if (!editingProduct) return;
        console.log('Datos a enviar:', data);
        try {
            await productService.actualizar(editingProduct.id_producto, data);
            await loadData();
            showSnackbar('Producto actualizado exitosamente', 'success');
        } catch (err: any) {
            showSnackbar(err.message || 'Error al actualizar el producto', 'error');
            throw err;
        }
    };

    const handleDelete = async () => {
        if (!confirmDialog.productId) return;

        try {
            await productService.eliminar(confirmDialog.productId);
            await loadData();
            showSnackbar('Producto eliminado exitosamente', 'success');
        } catch (err: any) {
            showSnackbar(err.message || 'Error al eliminar el producto', 'error');
        } finally {
            setConfirmDialog({ open: false, productId: null, productName: '' });
        }
    };

    const openConfirmDialog = (id: string, name: string) => {
        setConfirmDialog({
            open: true,
            productId: id,
            productName: name
        });
    };

    const handleEdit = (product: Producto) => {
        setEditingProduct(product);
        setFormOpen(true);
    };

    const handleCloseForm = () => {
        setFormOpen(false);
        setEditingProduct(null);
    };

    const getArtistaNombre = (idArtista: string) => {
        const artista = artistas.find(a => a.id_artista === idArtista);
        return artista?.nombre;
    };

    // Calcular estadísticas
    const totalProductos = products.length;
    const categoriasUnicas = new Set(products.map(p => p.categoria)).size;
    const productosConQR = products.filter(p => p.codigo_qr).length;

    return (
        <Box sx={{ bgcolor: '#f5f5f5', minHeight: '100vh' }}>
            {/* Header mejorado con gradiente */}
            <GradientHeader>
                <Container maxWidth="lg">
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
                                        <InventoryIcon sx={{ fontSize: 32 }} />
                                    </Avatar>
                                </Zoom>
                                <Box>
                                    <Typography variant="h3" component="h1" fontWeight="700">
                                        Productos
                                    </Typography>
                                    <Typography variant="h6" sx={{ opacity: 0.9, fontWeight: 400 }}>
                                        Gestiona el catálogo de productos
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
                                    startIcon={<AddIcon />}
                                    onClick={() => setFormOpen(true)}
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
                                    Nuevo Producto
                                </Button>
                            </Box>
                        </Box>
                    </Fade>
                </Container>
            </GradientHeader>

            {/* Contenido principal */}
            <Container maxWidth="lg" sx={{ pb: 4 }}>
                {/* Barra de búsqueda mejorada */}
                <Box mb={4}>
                    <SearchField
                        fullWidth
                        variant="outlined"
                        placeholder="Buscar productos por nombre, código QR o categoría..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon sx={{ color: CORPORATE_COLOR }} />
                                </InputAdornment>
                            ),
                            endAdornment: searchTerm && (
                                <InputAdornment position="end">
                                    <Chip 
                                        label={`${filteredProducts.length} resultados`}
                                        size="small"
                                        sx={{ 
                                            bgcolor: alpha(CORPORATE_COLOR, 0.1),
                                            color: CORPORATE_COLOR
                                        }}
                                    />
                                </InputAdornment>
                            )
                        }}
                    />
                </Box>

                {/* Tarjetas de estadísticas rápidas */}
                {!loading && products.length > 0 && (
                    <Fade in timeout={800}>
                        <Grid container spacing={3} sx={{ mb: 4 }}>
                            <Grid size={{xs:12, sm:4}}>
                                <StatsCard>
                                    <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                        <Avatar sx={{ bgcolor: alpha(CORPORATE_COLOR, 0.1), color: CORPORATE_COLOR }}>
                                            <InventoryIcon />
                                        </Avatar>
                                        <Box>
                                            <Typography variant="body2" color="text.secondary">
                                                Total Productos
                                            </Typography>
                                            <Typography variant="h4" fontWeight="bold" sx={{ color: CORPORATE_COLOR }}>
                                                {totalProductos}
                                            </Typography>
                                        </Box>
                                    </CardContent>
                                </StatsCard>
                            </Grid>
                            <Grid size={{xs:12, sm:4}}>
                                <StatsCard>
                                    <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                        <Avatar sx={{ bgcolor: alpha('#2196f3', 0.1), color: '#2196f3' }}>
                                            <CategoryIcon />
                                        </Avatar>
                                        <Box>
                                            <Typography variant="body2" color="text.secondary">
                                                Categorías
                                            </Typography>
                                            <Typography variant="h4" fontWeight="bold" sx={{ color: '#2196f3' }}>
                                                {categoriasUnicas}
                                            </Typography>
                                        </Box>
                                    </CardContent>
                                </StatsCard>
                            </Grid>
                            <Grid size={{xs:12, sm:4}}>
                                <StatsCard>
                                    <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                        <Avatar sx={{ bgcolor: alpha('#4caf50', 0.1), color: '#4caf50' }}>
                                            <QrCodeIcon />
                                        </Avatar>
                                        <Box>
                                            <Typography variant="body2" color="text.secondary">
                                                Con QR
                                            </Typography>
                                            <Typography variant="h4" fontWeight="bold" sx={{ color: '#4caf50' }}>
                                                {productosConQR}
                                            </Typography>
                                        </Box>
                                    </CardContent>
                                </StatsCard>
                            </Grid>
                        </Grid>
                    </Fade>
                )}

                {loading ? (
                    <Fade in timeout={500}>
                        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                            <CircularProgress sx={{ color: CORPORATE_COLOR }} />
                        </Box>
                    </Fade>
                ) : filteredProducts.length === 0 ? (
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
                                    <InventoryIcon sx={{ fontSize: 40 }} />
                                </Avatar>
                            </Zoom>
                            <Typography variant="h5" fontWeight="600" gutterBottom>
                                {searchTerm ? 'No se encontraron productos' : 'No hay productos registrados'}
                            </Typography>
                            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                                {searchTerm 
                                    ? 'Intenta con otros términos de búsqueda' 
                                    : 'Comienza creando un nuevo producto para tu catálogo'}
                            </Typography>
                            {!searchTerm && (
                                <Button
                                    variant="contained"
                                    size="large"
                                    startIcon={<AddIcon />}
                                    onClick={() => setFormOpen(true)}
                                    sx={{
                                        bgcolor: CORPORATE_COLOR,
                                        '&:hover': { bgcolor: '#1a1a1a' },
                                        px: 4,
                                        py: 1.5
                                    }}
                                >
                                    Crear primer producto
                                </Button>
                            )}
                        </EmptyStateCard>
                    </Fade>
                ) : (
                    <Fade in timeout={500}>
                        <ProductsGrid>
                            {filteredProducts.map((product, index) => (
                                <Box
                                    key={product.id_producto}
                                    sx={{
                                        width: '100%',
                                        minWidth: 280,
                                        maxWidth: 350,
                                        mx: 'auto',
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
                                    <ProductCard
                                        product={product}
                                        onEdit={handleEdit}
                                        onDelete={(id) => openConfirmDialog(id, product.nombre)}
                                        onViewDetails={handleViewDetails}
                                        artistaNombre={getArtistaNombre(product.id_artista)}
                                    />
                                </Box>
                            ))}
                        </ProductsGrid>
                    </Fade>
                )}
            </Container>

            {/* Formulario Modal (sin cambios funcionales) */}
            <ProductForm
                open={formOpen}
                onClose={handleCloseForm}
                onSubmit={editingProduct ? handleUpdate : handleCreate}
                initialData={editingProduct ? {
                    codigo_qr: editingProduct.codigo_qr || '',
                    nombre: editingProduct.nombre,
                    descripcion: editingProduct.descripcion || '',
                    imagen_url: editingProduct.imagen_url || '',
                    id_artista: editingProduct.id_artista || '',
                    ganancia_artista: editingProduct.ganancia_artista || '',
                    categoria: editingProduct.categoria || '',
                    tipo_precio: editingProduct.tipo_precio,
                    precio_fijo: editingProduct.precio_fijo?.toString() || '',
                    precios_talla: JSON.stringify(editingProduct.precios_talla || {}),
                    precios_cantidad: JSON.stringify(editingProduct.precios_cantidad || {})
                } : undefined}
                artistas={artistas}
                title={editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
            />

            {/* Diálogo de Confirmación (sin cambios) */}
            <ConfirmDialog
                open={confirmDialog.open}
                title="Confirmar eliminación"
                message={`¿Estás seguro de eliminar el producto "${confirmDialog.productName}"? Esta acción no se puede deshacer.`}
                confirmText="Eliminar"
                cancelText="Cancelar"
                onConfirm={handleDelete}
                onCancel={() => setConfirmDialog({ open: false, productId: null, productName: '' })}
                severity="error"
            />

            {/* Diálogo de Detalles (sin cambios) */}
            <ProductDetailsDialog
                open={detailsOpen}
                product={selectedProduct}
                onClose={() => setDetailsOpen(false)}
                artistaNombre={selectedProduct ? getArtistaNombre(selectedProduct.id_artista) : undefined}
            />

            {/* Snackbar mejorado */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
                <Alert
                    onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
                    severity={snackbar.severity}
                    sx={{ 
                        width: '100%',
                        borderRadius: 2,
                        boxShadow: theme.shadows[4]
                    }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default ProductListPage;