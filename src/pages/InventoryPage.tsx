// src/pages/InventoryPage.tsx
import React, { useEffect, useState, useRef } from 'react';
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
    Grid,
    Avatar,
    Fade,
    Zoom,
    useTheme,
    alpha,
    Card,
    CardContent,
    Badge,
    Tooltip
} from '@mui/material';
import { styled } from '@mui/material/styles';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import InventoryIcon from '@mui/icons-material/Inventory';
import RefreshIcon from '@mui/icons-material/Refresh';
import CategoryIcon from '@mui/icons-material/Category';
import QrCodeIcon from '@mui/icons-material/QrCode';
import { productService } from '../api/productService';
import { inventoryService } from '../api/inventoryService';
import type { Producto } from '../types/Product.types';
import type { Inventario } from '../types/Inventory.types';

// Color corporativo
const CORPORATE_COLOR = '#303030';

interface ProductoConInventario extends Producto {
    inventario: Inventario[];
    stockTotal: number;
    stockMinimoTotal?: number;
}

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

const StatusChip = styled(Chip)(({ theme }) => ({
    fontWeight: 500,
    '& .MuiChip-icon': {
        fontSize: 16
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

const InventoryPage: React.FC = () => {
    const theme = useTheme();
    const [productos, setProductos] = useState<ProductoConInventario[]>([]);
    const [filteredProductos, setFilteredProductos] = useState<ProductoConInventario[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
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

    // Referencia para mantener la página actual después de editar
    const currentPageRef = useRef(page);

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

    // Actualizar la referencia cuando cambia la página
    useEffect(() => {
        currentPageRef.current = page;
    }, [page]);

    const handleRefresh = async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    };

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
            
            // Restaurar la página actual después de recargar
            setPage(currentPageRef.current);
            
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

    // Calcular estadísticas
    const totalProductos = productos.length;
    const productosAgotados = productos.filter(p => p.stockTotal === 0).length;
    const productosStockBajo = productos.filter(p => 
        p.stockTotal > 0 && p.stockMinimoTotal && p.stockTotal <= p.stockMinimoTotal
    ).length;

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
                                        Inventario
                                    </Typography>
                                    <Typography variant="h6" sx={{ opacity: 0.9, fontWeight: 400 }}>
                                        Control de stock de productos
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
                                        label={`${filteredProductos.length} resultados`}
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
                {!loading && productos.length > 0 && (
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
                                        <Avatar sx={{ bgcolor: alpha('#d32f2f', 0.1), color: '#d32f2f' }}>
                                            <ErrorIcon />
                                        </Avatar>
                                        <Box>
                                            <Typography variant="body2" color="text.secondary">
                                                Productos agotados
                                            </Typography>
                                            <Typography variant="h4" fontWeight="bold" sx={{ color: '#d32f2f' }}>
                                                {productosAgotados}
                                            </Typography>
                                        </Box>
                                    </CardContent>
                                </StatsCard>
                            </Grid>
                            <Grid size={{xs:12, sm:4}}>
                                <StatsCard>
                                    <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                        <Avatar sx={{ bgcolor: alpha('#ed6c02', 0.1), color: '#ed6c02' }}>
                                            <WarningIcon />
                                        </Avatar>
                                        <Box>
                                            <Typography variant="body2" color="text.secondary">
                                                Stock bajo
                                            </Typography>
                                            <Typography variant="h4" fontWeight="bold" sx={{ color: '#ed6c02' }}>
                                                {productosStockBajo}
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
                ) : filteredProductos.length === 0 ? (
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
                                    : 'Agrega productos para ver su inventario'}
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
                                            .map((producto, index) => {
                                                const status = getStockStatus(producto.stockTotal, producto.stockMinimoTotal);
                                                return (
                                                    <StyledTableRow 
                                                        key={producto.id_producto}
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
                                                            <Box display="flex" alignItems="center" gap={2}>
                                                                {producto.imagen_url ? (
                                                                    <Badge
                                                                        overlap="circular"
                                                                        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                                                                        badgeContent={
                                                                            producto.codigo_qr ? (
                                                                                <Tooltip title="Tiene QR">
                                                                                    <QrCodeIcon sx={{ fontSize: 14, color: '#4caf50' }} />
                                                                                </Tooltip>
                                                                            ) : null
                                                                        }
                                                                    >
                                                                        <Avatar
                                                                            src={producto.imagen_url}
                                                                            variant="rounded"
                                                                            sx={{ width: 48, height: 48 }}
                                                                        />
                                                                    </Badge>
                                                                ) : (
                                                                    <Avatar
                                                                        variant="rounded"
                                                                        sx={{ 
                                                                            bgcolor: alpha(CORPORATE_COLOR, 0.1),
                                                                            color: CORPORATE_COLOR,
                                                                            width: 48,
                                                                            height: 48
                                                                        }}
                                                                    >
                                                                        <InventoryIcon />
                                                                    </Avatar>
                                                                )}
                                                                <Box>
                                                                    <Typography variant="body1" fontWeight="600">
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
                                                                sx={{ 
                                                                    bgcolor: alpha(CORPORATE_COLOR, 0.1),
                                                                    color: CORPORATE_COLOR,
                                                                    fontWeight: 500
                                                                }}
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
                                                            <StatusChip
                                                                icon={status.icon}
                                                                label={status.text}
                                                                size="small"
                                                                sx={{
                                                                    bgcolor: alpha(getStatusColor(status.color), 0.1),
                                                                    color: getStatusColor(status.color),
                                                                    fontWeight: 600,
                                                                    border: 'none'
                                                                }}
                                                            />
                                                        </TableCell>
                                                        <TableCell align="center">
                                                            {producto.categoria === 'ropa' ? (
                                                                <Box display="flex" gap={0.5} flexWrap="wrap" justifyContent="center">
                                                                    {producto.inventario.map((inv) => (
                                                                        <Tooltip key={inv.talla} title={`Mín: ${inv.stock_minimo}`}>
                                                                            <Chip
                                                                                label={`${inv.talla}: ${inv.stock_actual}`}
                                                                                size="small"
                                                                                sx={{
                                                                                    bgcolor: inv.stock_actual <= inv.stock_minimo 
                                                                                        ? alpha('#d32f2f', 0.1) 
                                                                                        : alpha(CORPORATE_COLOR, 0.05),
                                                                                    color: inv.stock_actual <= inv.stock_minimo 
                                                                                        ? '#d32f2f' 
                                                                                        : CORPORATE_COLOR,
                                                                                    fontSize: '0.7rem',
                                                                                    fontWeight: 500
                                                                                }}
                                                                            />
                                                                        </Tooltip>
                                                                    ))}
                                                                </Box>
                                                            ) : (
                                                                <Tooltip title={`Mín: ${producto.inventario[0]?.stock_minimo || 0}`}>
                                                                    <Chip
                                                                        label={`${producto.inventario[0]?.stock_actual || 0} unidades`}
                                                                        size="small"
                                                                        sx={{
                                                                            bgcolor: (producto.inventario[0]?.stock_actual || 0) <= (producto.inventario[0]?.stock_minimo || 0)
                                                                                ? alpha('#d32f2f', 0.1)
                                                                                : alpha(CORPORATE_COLOR, 0.05),
                                                                            color: (producto.inventario[0]?.stock_actual || 0) <= (producto.inventario[0]?.stock_minimo || 0)
                                                                                ? '#d32f2f'
                                                                                : CORPORATE_COLOR,
                                                                            fontWeight: 500
                                                                        }}
                                                                    />
                                                                </Tooltip>
                                                            )}
                                                        </TableCell>
                                                        <TableCell align="right">
                                                            <Tooltip title="Editar inventario">
                                                                <IconButton
                                                                    onClick={() => handleEditClick(producto)}
                                                                    sx={{ 
                                                                        color: CORPORATE_COLOR,
                                                                        '&:hover': {
                                                                            bgcolor: alpha(CORPORATE_COLOR, 0.1)
                                                                        }
                                                                    }}
                                                                    size="small"
                                                                >
                                                                    <EditIcon />
                                                                </IconButton>
                                                            </Tooltip>
                                                        </TableCell>
                                                    </StyledTableRow>
                                                );
                                            })}
                                    </TableBody>
                                </Table>
                            </StyledTableContainer>
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

            {/* Diálogo de edición de inventario mejorado */}
            <Dialog
                open={editDialogOpen}
                onClose={() => setEditDialogOpen(false)}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: { 
                        borderRadius: 3,
                        boxShadow: '0 24px 48px rgba(0,0,0,0.2)'
                    }
                }}
            >
                <DialogTitle sx={{
                    background: `linear-gradient(135deg, ${CORPORATE_COLOR} 0%, #1a1a1a 100%)`,
                    color: 'white',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    py: 2
                }}>
                    <Box display="flex" alignItems="center" gap={1}>
                        <InventoryIcon />
                        <Typography variant="h6" fontWeight="bold">
                            Editar Inventario
                        </Typography>
                    </Box>
                    <IconButton
                        onClick={() => setEditDialogOpen(false)}
                        sx={{ color: 'white', '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' } }}
                    >
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                
                <DialogContent sx={{ p: 3, bgcolor: '#f8f9fa' }}>
                    {selectedProducto && (
                        <Fade in timeout={500}>
                            <Box>
                                <Paper elevation={0} sx={{ p: 2, mb: 3, bgcolor: 'white', borderRadius: 2 }}>
                                    <Box display="flex" alignItems="center" gap={2}>
                                        {selectedProducto.imagen_url ? (
                                            <Avatar
                                                src={selectedProducto.imagen_url}
                                                variant="rounded"
                                                sx={{ width: 60, height: 60 }}
                                            />
                                        ) : (
                                            <Avatar
                                                variant="rounded"
                                                sx={{ 
                                                    bgcolor: alpha(CORPORATE_COLOR, 0.1),
                                                    color: CORPORATE_COLOR,
                                                    width: 60,
                                                    height: 60
                                                }}
                                            >
                                                <InventoryIcon />
                                            </Avatar>
                                        )}
                                        <Box>
                                            <Typography variant="h6" fontWeight="600">
                                                {selectedProducto.nombre}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                Categoría: {selectedProducto.categoria} • Código: {selectedProducto.codigo_qr}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Paper>

                                <Typography variant="subtitle1" gutterBottom fontWeight="bold" sx={{ color: CORPORATE_COLOR }}>
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
                                                variant="outlined"
                                                InputProps={{
                                                    inputProps: { min: 0 },
                                                    sx: { bgcolor: 'white' }
                                                }}
                                            />
                                        </Grid>
                                    ))}
                                </Grid>

                                <Typography variant="subtitle1" gutterBottom fontWeight="bold" sx={{ color: CORPORATE_COLOR }}>
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
                                                variant="outlined"
                                                InputProps={{
                                                    inputProps: { min: 0 },
                                                    sx: { bgcolor: 'white' }
                                                }}
                                            />
                                        </Grid>
                                    ))}
                                </Grid>
                            </Box>
                        </Fade>
                    )}
                </DialogContent>

                <DialogActions sx={{ p: 3, bgcolor: '#f8f9fa', borderTop: `1px solid ${alpha(CORPORATE_COLOR, 0.1)}` }}>
                    <Button
                        onClick={() => setEditDialogOpen(false)}
                        disabled={submitting}
                        variant="outlined"
                        sx={{
                            borderColor: CORPORATE_COLOR,
                            color: CORPORATE_COLOR,
                            '&:hover': { borderColor: '#1a1a1a', bgcolor: alpha(CORPORATE_COLOR, 0.04) }
                        }}
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleSaveStocks}
                        variant="contained"
                        disabled={submitting}
                        startIcon={<SaveIcon />}
                        sx={{
                            bgcolor: CORPORATE_COLOR,
                            '&:hover': { bgcolor: '#1a1a1a' },
                            px: 4
                        }}
                    >
                        {submitting ? 'Guardando...' : 'Guardar cambios'}
                    </Button>
                </DialogActions>
            </Dialog>

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

export default InventoryPage;