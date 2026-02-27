import React, { useEffect, useState } from 'react';
import {
    Container,
    Typography,
    Box,
    Alert,
    Snackbar,
    CircularProgress,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    Chip,
    IconButton,
    TextField,
    InputAdornment,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Grid
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import { productService } from '../api/productService';
import { inventoryService } from '../api/inventoryService';
import type { Producto } from '../types/Product.types';
import type { Inventario } from '../types/Inventory.types';

interface ProductoConInventario extends Producto {
    inventario: Inventario[];
    stockTotal: number;
    stockMinimoTotal?: number;
}

const InventoryPage: React.FC = () => {
    const [productos, setProductos] = useState<ProductoConInventario[]>([]);
    const [filteredProductos, setFilteredProductos] = useState<ProductoConInventario[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [selectedProducto, setSelectedProducto] = useState<ProductoConInventario | null>(null);
    const [editedStocks, setEditedStocks] = useState<Record<string, number>>({});
    const [submitting, setSubmitting] = useState(false);
    const [editedMinStocks, setEditedMinStocks] = useState<Record<string, number>>({});
    const tallas = ['S', 'M', 'L', 'XL', 'XXL', '3XL'];
    const [snackbar, setSnackbar] = useState<{
        open: boolean;
        message: string;
        severity: 'success' | 'error' | 'warning' | 'info';
    }>({ open: false, message: '', severity: 'success' });

    const loadData = async () => {
        setLoading(true);
        try {
            // Cargar productos e inventario en paralelo
            const [productosData, inventarioData] = await Promise.all([
                productService.listar(),
                inventoryService.listar()
            ]);

            // Combinar productos con su inventario
            const productosConInventario: ProductoConInventario[] = productosData.map(producto => {
                const inventarioProducto = inventarioData.filter(
                    inv => inv.id_producto === producto.id_producto
                );

                // Si no tiene inventario, crear uno por defecto (esto debería pasar solo en desarrollo)
                let inventario = inventarioProducto;
                if (inventarioProducto.length === 0) {
                    if (producto.categoria === 'ropa') {
                        inventario = tallas.map(talla => ({
                            id_inventario: 'temp',
                            id_producto: producto.id_producto,
                            talla: talla,
                            stock_actual: 0,
                            stock_minimo: 5
                        }));
                    } else {
                        inventario = [{
                            id_inventario: 'temp',
                            id_producto: producto.id_producto,
                            talla: 'UNICA',
                            stock_actual: 0,
                            stock_minimo: 5
                        }];
                    }
                }

                const stockTotal = inventario.reduce((sum, inv) => sum + inv.stock_actual, 0);
                const stockMinimoTotal = inventario.reduce((sum, inv) => sum + inv.stock_minimo, 0);

                return {
                    ...producto,
                    inventario: inventario,
                    stockTotal,
                    stockMinimoTotal
                };
            });

            setProductos(productosConInventario);
            setFilteredProductos(productosConInventario);
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
        const filtered = productos.filter(producto =>
            producto.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
            producto.codigo_qr.toLowerCase().includes(searchTerm.toLowerCase()) ||
            producto.categoria.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredProductos(filtered);
        setPage(0);
    }, [searchTerm, productos]);

    const showSnackbar = (message: string, severity: 'success' | 'error' | 'warning' | 'info') => {
        setSnackbar({ open: true, message, severity });
    };

    const handleEditClick = (producto: ProductoConInventario) => {
        setSelectedProducto(producto);
        // Inicializar los stocks editados con los valores actuales
        const stocks: Record<string, number> = {};
        const minStocks: Record<string, number> = {};
        producto.inventario.forEach(inv => {
            stocks[inv.talla] = inv.stock_actual;
            minStocks[inv.talla] = inv.stock_minimo;
        });
        setEditedStocks(stocks);
        setEditedMinStocks(minStocks);
        setEditDialogOpen(true);
    };

    const handleMinStockChange = (talla: string, value: string) => {
        const numValue = parseInt(value);
        if (!isNaN(numValue) && numValue >= 0) {
            setEditedMinStocks(prev => ({ ...prev, [talla]: numValue }));
        } else if (value === '') {
            setEditedMinStocks(prev => ({ ...prev, [talla]: 0 }));
        }
    };

    const handleStockChange = (talla: string, value: string) => {
        const numValue = parseInt(value);
        if (!isNaN(numValue) && numValue >= 0) {
            setEditedStocks(prev => ({ ...prev, [talla]: numValue }));
        } else if (value === '') {
            setEditedStocks(prev => ({ ...prev, [talla]: 0 }));
        }
    };

    const handleSaveStocks = async () => {
        if (!selectedProducto) return;

        setSubmitting(true);
        try {
            // Actualizar stocks actuales y mínimos
            const updates = Object.entries(editedStocks).map(([talla, nuevoStock]) => {
                const inventarioOriginal = selectedProducto.inventario.find(inv => inv.talla === talla);
                if (inventarioOriginal && inventarioOriginal.stock_actual !== nuevoStock) {
                    return inventoryService.actualizarStock(
                        selectedProducto.id_producto,
                        talla,
                        nuevoStock
                    );
                }
                return Promise.resolve();
            });

            const minUpdates = Object.entries(editedMinStocks).map(([talla, nuevoMinStock]) => {
                const inventarioOriginal = selectedProducto.inventario.find(inv => inv.talla === talla);
                if (inventarioOriginal && inventarioOriginal.stock_minimo !== nuevoMinStock) {
                    return inventoryService.actualizarStock(
                        selectedProducto.id_producto,
                        talla,
                        undefined,  // No actualizar stock actual
                        nuevoMinStock
                    );
                }
                return Promise.resolve();
            });

            await Promise.all([...updates, ...minUpdates]);

            // Recargar datos
            await loadData();
            setEditDialogOpen(false);
            showSnackbar('Inventario actualizado correctamente', 'success');
        } catch (err: any) {
            showSnackbar(err.message || 'Error al actualizar inventario', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const getStockStatus = (stockTotal: number, stockMinimo?: number) => {
        if (stockTotal <= 0) {
            return { color: 'error', icon: <ErrorIcon />, text: 'Agotado' };
        } else if (stockMinimo && stockTotal <= stockMinimo) {
            return { color: 'warning', icon: <WarningIcon />, text: 'Stock bajo' };
        } else {
            return { color: 'success', icon: <CheckCircleIcon />, text: 'Stock normal' };
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'error': return '#d32f2f';
            case 'warning': return '#ed6c02';
            case 'success': return '#2e7d32';
            default: return '#757575';
        }
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
                    <Box>
                        <Typography variant="h4" component="h1" fontWeight="bold">
                            Inventario
                        </Typography>
                        <Typography variant="subtitle1" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                            Control de stock de productos
                        </Typography>
                    </Box>
                </Container>
            </Box>

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
                ) : filteredProductos.length === 0 ? (
                    <Box
                        display="flex"
                        flexDirection="column"
                        alignItems="center"
                        justifyContent="center"
                        bgcolor="white"
                        borderRadius={2}
                        p={4}
                        boxShadow={1}
                        minHeight="400px"
                    >
                        <Typography variant="h6" color="text.secondary" gutterBottom>
                            {searchTerm ? 'No se encontraron productos' : 'No hay productos registrados'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {searchTerm ? 'Intenta con otros términos de búsqueda' : 'Agrega productos para ver su inventario'}
                        </Typography>
                    </Box>
                ) : (
                    <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
                        <TableContainer>
                            <Table>
                                <TableHead sx={{ bgcolor: '#f0f0f0' }}>
                                    <TableRow>
                                        <TableCell><strong>Producto</strong></TableCell>
                                        <TableCell><strong>Categoría</strong></TableCell>
                                        <TableCell align="center"><strong>Stock Total</strong></TableCell>
                                        <TableCell align="center"><strong>Estado</strong></TableCell>
                                        <TableCell align="center"><strong>Tallas</strong></TableCell>
                                        <TableCell align="right"><strong>Acciones</strong></TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {filteredProductos
                                        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                        .map((producto) => {
                                            const status = getStockStatus(producto.stockTotal, producto.stockMinimoTotal);
                                            return (
                                                <TableRow key={producto.id_producto} hover>
                                                    <TableCell>
                                                        <Box display="flex" alignItems="center" gap={2}>
                                                            {producto.imagen_url ? (
                                                                <Box
                                                                    component="img"
                                                                    src={producto.imagen_url}
                                                                    alt={producto.nombre}
                                                                    sx={{
                                                                        width: 40,
                                                                        height: 40,
                                                                        objectFit: 'cover',
                                                                        borderRadius: 1
                                                                    }}
                                                                />
                                                            ) : (
                                                                <Box
                                                                    sx={{
                                                                        width: 40,
                                                                        height: 40,
                                                                        bgcolor: '#f0f0f0',
                                                                        borderRadius: 1,
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        justifyContent: 'center'
                                                                    }}
                                                                >
                                                                    <Typography variant="caption" color="text.secondary">
                                                                        No img
                                                                    </Typography>
                                                                </Box>
                                                            )}
                                                            <Box>
                                                                <Typography variant="body1" fontWeight="500">
                                                                    {producto.nombre}
                                                                </Typography>
                                                                <Typography variant="caption" color="text.secondary">
                                                                    {producto.codigo_qr}
                                                                </Typography>
                                                            </Box>
                                                        </Box>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Chip
                                                            label={producto.categoria}
                                                            size="small"
                                                            sx={{ bgcolor: '#e0e0e0' }}
                                                        />
                                                    </TableCell>
                                                    <TableCell align="center">
                                                        <Typography
                                                            variant="h6"
                                                            sx={{
                                                                color: getStatusColor(status.color),
                                                                fontWeight: 'bold'
                                                            }}
                                                        >
                                                            {producto.stockTotal}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell align="center">
                                                        <Chip
                                                            icon={status.icon}
                                                            label={status.text}
                                                            size="small"
                                                            color={status.color as any}
                                                            variant="outlined"
                                                        />
                                                    </TableCell>
                                                    <TableCell align="center">
                                                        {producto.categoria === 'ropa' ? (
                                                            <Box display="flex" gap={0.5} flexWrap="wrap" justifyContent="center">
                                                                {producto.inventario.map((inv) => (
                                                                    <Chip
                                                                        key={inv.talla}
                                                                        label={`${inv.talla}: ${inv.stock_actual}`}
                                                                        size="small"
                                                                        sx={{
                                                                            bgcolor: inv.stock_actual <= inv.stock_minimo ? '#ffebee' : '#f5f5f5',
                                                                            fontSize: '0.7rem'
                                                                        }}
                                                                    />
                                                                ))}
                                                            </Box>
                                                        ) : (
                                                            <Typography variant="body2">
                                                                {producto.inventario[0]?.stock_actual || 0} unidades
                                                            </Typography>
                                                        )}
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        <IconButton
                                                            onClick={() => handleEditClick(producto)}
                                                            sx={{ color: '#1976d2' }}
                                                            size="small"
                                                        >
                                                            <EditIcon />
                                                        </IconButton>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                </TableBody>
                            </Table>
                        </TableContainer>
                        <TablePagination
                            rowsPerPageOptions={[5, 10, 25]}
                            component="div"
                            count={filteredProductos.length}
                            rowsPerPage={rowsPerPage}
                            page={page}
                            onPageChange={(_, newPage) => setPage(newPage)}
                            onRowsPerPageChange={(e) => {
                                setRowsPerPage(parseInt(e.target.value, 10));
                                setPage(0);
                            }}
                            labelRowsPerPage="Filas por página"
                        />
                    </Paper>
                )}
            </Container>

            {/* Diálogo de edición de inventario */}
            <Dialog
                open={editDialogOpen}
                onClose={() => setEditDialogOpen(false)}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: { borderRadius: 3 }
                }}
            >
                <DialogTitle sx={{
                    bgcolor: '#303030',
                    color: 'white',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <Typography variant="h6" fontWeight="bold">
                        Editar Inventario
                    </Typography>
                    <IconButton
                        onClick={() => setEditDialogOpen(false)}
                        sx={{ color: 'white' }}
                    >
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <Box sx={{ height: 8 }} />
                <DialogContent sx={{ p: 3 }}>
                    {selectedProducto && (
                        <Box>
                            <Box display="flex" alignItems="center" gap={2} mb={3}>
                                {selectedProducto.imagen_url ? (
                                    <Box
                                        component="img"
                                        src={selectedProducto.imagen_url}
                                        alt={selectedProducto.nombre}
                                        sx={{
                                            width: 60,
                                            height: 60,
                                            objectFit: 'cover',
                                            borderRadius: 2
                                        }}
                                    />
                                ) : (
                                    <Box
                                        sx={{
                                            width: 60,
                                            height: 60,
                                            bgcolor: '#f0f0f0',
                                            borderRadius: 2,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}
                                    >
                                        <Typography variant="caption" color="text.secondary">
                                            No img
                                        </Typography>
                                    </Box>
                                )}
                                <Box>
                                    <Typography variant="h6">{selectedProducto.nombre}</Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Categoría: {selectedProducto.categoria}
                                    </Typography>
                                </Box>
                            </Box>

                            <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                                Stock por talla/unidad:
                            </Typography>

                            <Grid container spacing={2} sx={{ mb: 4 }}>
                                {selectedProducto.inventario.map((inv) => (
                                    <Grid size={{xs:12, sm:6}} key={inv.talla}>
                                        <TextField
                                            fullWidth
                                            label={`Stock ${inv.talla}`}
                                            type="number"
                                            value={editedStocks[inv.talla] || 0}
                                            onChange={(e) => handleStockChange(inv.talla, e.target.value)}
                                            size="small"
                                            InputProps={{
                                                inputProps: { min: 0 }
                                            }}
                                        />
                                    </Grid>
                                ))}
                            </Grid>

                            <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                                Stock mínimo de alerta:
                            </Typography>

                            <Grid container spacing={2}>
                                {selectedProducto.inventario.map((inv) => (
                                    <Grid size={{xs:12, sm:6}} key={inv.talla}>
                                        <TextField
                                            fullWidth
                                            label={`Mínimo ${inv.talla}`}
                                            type="number"
                                            value={editedMinStocks[inv.talla] || 0}
                                            onChange={(e) => handleMinStockChange(inv.talla, e.target.value)}
                                            size="small"
                                            InputProps={{
                                                inputProps: { min: 0 }
                                            }}
                                        />
                                    </Grid>
                                ))}
                            </Grid>
                        </Box>
                    )}
                </DialogContent>

                <DialogActions sx={{ p: 3, borderTop: '1px solid #e0e0e0' }}>
                    <Button
                        onClick={() => setEditDialogOpen(false)}
                        disabled={submitting}
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleSaveStocks}
                        variant="contained"
                        disabled={submitting}
                        startIcon={<SaveIcon />}
                        sx={{ bgcolor: '#303030', '&:hover': { bgcolor: '#1a1a1a' } }}
                    >
                        {submitting ? 'Guardando...' : 'Guardar cambios'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar */}
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

export default InventoryPage;