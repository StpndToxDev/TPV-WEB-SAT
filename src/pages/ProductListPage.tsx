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
    InputAdornment
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import { productService } from '../api/productService';
import type { Producto, CreateProductPayload, Artista } from '../types/Product.types';
import ProductCard from '../components/ProductCard';
import ProductForm from '../components/ProductForm';
import ConfirmDialog from '../components/ConfirmDialog';
import ProductDetailsDialog from '../components/ProductDetailsDialog';

const ProductListPage: React.FC = () => {
    const [products, setProducts] = useState<Producto[]>([]);
    const [artistas, setArtistas] = useState<Artista[]>([]);
    const [filteredProducts, setFilteredProducts] = useState<Producto[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
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
        // Filtrar productos cuando cambia el término de búsqueda
        const filtered = products.filter(product =>
            product.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.codigo_qr.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.categoria.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredProducts(filtered);
    }, [searchTerm, products]);

    const showSnackbar = (message: string, severity: 'success' | 'error') => {
        setSnackbar({ open: true, message, severity });
    };

    const handleCreate = async (data: CreateProductPayload) => {
        console.log('Datos a enviar:', data);  // ← PARA DEBUG
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
        console.log('Datos a enviar:', data);  // ← PARA DEBUG
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

    return (
        <Box sx={{ bgcolor: '#f5f5f5', minHeight: '100vh' }}>
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
                <Container maxWidth="lg">
                    <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
                        <Box>
                            <Typography variant="h4" component="h1" fontWeight="bold">
                                Productos
                            </Typography>
                            <Typography variant="subtitle1" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                                Gestiona el catálogo de productos
                            </Typography>
                        </Box>
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={() => setFormOpen(true)}
                            sx={{
                                bgcolor: 'white',
                                color: '#303030',
                                '&:hover': { bgcolor: '#f0f0f0' }
                            }}
                        >
                            Nuevo Producto
                        </Button>
                    </Box>
                </Container>
            </Box>

            {/* Contenido principal */}
            <Container maxWidth="lg" sx={{ pb: 4 }}>
                {/* Barra de búsqueda */}
                <Box mb={4}>
                    <TextField
                        fullWidth
                        variant="outlined"
                        placeholder="Buscar productos por nombre, código QR o categoría..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon />
                                </InputAdornment>
                            ),
                        }}
                        sx={{ bgcolor: 'white', borderRadius: 1 }}
                    />
                </Box>

                {loading ? (
                    <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                        <CircularProgress sx={{ color: '#303030' }} />
                    </Box>
                ) : filteredProducts.length === 0 ? (
                    <Box
                        display="flex"
                        flexDirection="column"
                        alignItems="center"
                        justifyContent="center"
                        minHeight="400px"
                        bgcolor="white"
                        borderRadius={2}
                        p={4}
                        boxShadow={1}
                    >
                        <Typography variant="h6" color="text.secondary" gutterBottom>
                            {searchTerm ? 'No se encontraron productos' : 'No hay productos registrados'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" paragraph>
                            {searchTerm ? 'Intenta con otros términos de búsqueda' : 'Comienza creando un nuevo producto'}
                        </Typography>
                        {!searchTerm && (
                            <Button
                                variant="contained"
                                startIcon={<AddIcon />}
                                onClick={() => setFormOpen(true)}
                                sx={{ bgcolor: '#303030', '&:hover': { bgcolor: '#1a1a1a' } }}
                            >
                                Crear primer producto
                            </Button>
                        )}
                    </Box>
                ) : (
                    <Box sx={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                        gap: 3,
                        justifyContent: 'center'
                    }}>
                        {filteredProducts.map((product) => (
                            <Box key={product.id_producto} sx={{ width: '100%', minWidth: 280, maxWidth: 350, mx: 'auto' }}>
                                <ProductCard
                                    product={product}
                                    onEdit={handleEdit}
                                    onDelete={(id) => openConfirmDialog(id, 'producto')}
                                    onViewDetails={handleViewDetails}
                                    artistaNombre={getArtistaNombre(product.id_artista)}
                                />
                            </Box>
                        ))}
                    </Box>
                )}
            </Container>

            {/* Formulario Modal */}
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

            {/* Diálogo de Confirmación */}
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

            <ProductDetailsDialog
                open={detailsOpen}
                product={selectedProduct}
                onClose={() => setDetailsOpen(false)}
                artistaNombre={selectedProduct ? getArtistaNombre(selectedProduct.id_artista) : undefined}
            />

            {/* Snackbar para notificaciones */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
                <Alert
                    onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
                    severity={snackbar.severity}
                    sx={{ width: '100%' }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default ProductListPage;