// src/components/CarritoDrawer.tsx
import React, { useState } from 'react';
import {
    Drawer,
    Box,
    Typography,
    IconButton,
    Button,
    Divider,
    List,
    ListItem,
    Chip,
    Avatar,
    TextField,
    InputAdornment,
    alpha,
    useTheme,
    Alert,
    Snackbar,
    Badge,
    Tooltip,
    Select,
    MenuItem,
    FormControl,
    InputLabel
} from '@mui/material';
import { styled } from '@mui/material/styles';
import type { SelectChangeEvent } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import WarningIcon from '@mui/icons-material/Warning';
import type { ItemCarrito, AlertaStock } from '../types/PuntoVenta.types';
import type { Inventario } from '../types/Inventory.types';

const CORPORATE_COLOR = '#303030';

const DrawerHeader = styled(Box)(({ theme }) => ({
    background: `linear-gradient(135deg, ${CORPORATE_COLOR} 0%, #1a1a1a 100%)`,
    color: 'white',
    padding: theme.spacing(2),
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
}));

const CartItem = styled(Box)(({ theme }) => ({
    backgroundColor: 'white',
    marginBottom: theme.spacing(1),
    padding: theme.spacing(2),
    borderRadius: theme.spacing(1),
    border: `1px solid ${alpha(CORPORATE_COLOR, 0.1)}`,
    transition: 'all 0.2s ease',
    '&:hover': {
        borderColor: CORPORATE_COLOR,
        boxShadow: theme.shadows[2]
    }
}));

interface CarritoDrawerProps {
    open: boolean;
    onClose: () => void;
    items: ItemCarrito[];
    inventario: Inventario[];
    onActualizarItem: (index: number, cantidad: number) => void;
    onEliminarItem: (index: number) => void;
    onVaciarCarrito: () => void;
    onContinuar: () => void;
    alertas: AlertaStock[];
    onSilenciarAlertas: () => void;
    notificacionesSilenciadas: boolean;
    onCambiarTalla?: (index: number, nuevaTalla: string) => void; // NUEVO
}

const CarritoDrawer: React.FC<CarritoDrawerProps> = ({
    open,
    onClose,
    items,
    inventario,
    onActualizarItem,
    onEliminarItem,
    onVaciarCarrito,
    onContinuar,
    alertas,
    onSilenciarAlertas,
    notificacionesSilenciadas,
    onCambiarTalla
}) => {
    const theme = useTheme();
    const [showAlertas, setShowAlertas] = useState(false);
    const tallasDisponibles = ['S', 'M', 'L', 'XL', 'XXL', '3XL'];

    const calcularTotal = () => {
        const stickers = items.filter(i => i.producto.categoria === 'sticker');
        const otros = items.filter(i => i.producto.categoria !== 'sticker');

        let totalStickers = 0;
        if (stickers.length > 0) {
            const cantidadTotal = stickers.reduce((sum, i) => sum + i.cantidad, 0);
            const precioUnitario = stickers[0].producto.precio_fijo || 0;
            const gruposDeTres = Math.floor(cantidadTotal / 3);
            totalStickers = (cantidadTotal * precioUnitario) - (gruposDeTres * 10);
        }

        const totalOtros = otros.reduce((sum, i) => sum + i.subtotal, 0);
        return totalStickers + totalOtros;
    };

    const verificarStockDisponible = (productoId: string, talla: string, cantidad: number): boolean => {
        const inventarioItem = inventario.find(
            inv => inv.id_producto === productoId && inv.talla === talla
        );
        if (!inventarioItem) return false;

        const enCarrito = items
            .filter(i => i.producto.id_producto === productoId && i.talla === talla)
            .reduce((sum, i) => sum + i.cantidad, 0);

        const disponible = inventarioItem.stock_actual - (enCarrito - cantidad);
        return disponible >= 0;
    };

    const handleTallaChange = (index: number, event: SelectChangeEvent) => {
        if (onCambiarTalla) {
            onCambiarTalla(index, event.target.value);
        }
    };

    const formatMoneda = (valor: number) => {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN'
        }).format(valor);
    };

    const total = calcularTotal();

    return (
        <>
            <Drawer
                anchor="right"
                open={open}
                onClose={onClose}
                PaperProps={{
                    sx: {
                        width: { xs: '100%', sm: 450 },
                        maxWidth: '100%',
                        borderRadius: { xs: 0, sm: '16px 0 0 16px' }
                    }
                }}
            >
                <DrawerHeader>
                    <Box display="flex" alignItems="center" gap={1}>
                        <Badge badgeContent={items.length} color="primary">
                            <ShoppingCartIcon />
                        </Badge>
                        <Typography variant="h6" fontWeight="bold">
                            Carrito
                        </Typography>
                    </Box>
                    <IconButton onClick={onClose} sx={{ color: 'white' }}>
                        <CloseIcon />
                    </IconButton>
                </DrawerHeader>

                <Box sx={{ p: 2, flex: 1, overflow: 'auto', bgcolor: '#f5f5f5' }}>
                    {/* Alertas de stock */}
                    {alertas.length > 0 && !notificacionesSilenciadas && (
                        <Alert
                            severity="warning"
                            sx={{ mb: 2, borderRadius: 2 }}
                            action={
                                <Button
                                    color="inherit"
                                    size="small"
                                    onClick={onSilenciarAlertas}
                                >
                                    Silenciar
                                </Button>
                            }
                        >
                            <Typography variant="body2" fontWeight="bold">
                                {alertas.length} alerta(s) de inventario
                            </Typography>
                            <Button
                                size="small"
                                onClick={() => setShowAlertas(!showAlertas)}
                                sx={{ mt: 0.5 }}
                            >
                                {showAlertas ? 'Ocultar' : 'Ver detalles'}
                            </Button>
                        </Alert>
                    )}

                    {showAlertas && alertas.map((alerta, idx) => (
                        <Alert
                            key={idx}
                            severity={alerta.tipo === 'sin_stock' ? 'error' : 'warning'}
                            sx={{ mb: 1, borderRadius: 2 }}
                            icon={<WarningIcon />}
                        >
                            <Typography variant="body2">
                                <strong>{alerta.nombre}</strong> ({alerta.talla})
                            </Typography>
                            <Typography variant="caption">
                                Stock: {alerta.stock_actual} | Mín: {alerta.stock_minimo}
                            </Typography>
                        </Alert>
                    ))}

                    {items.length === 0 ? (
                        <Box
                            display="flex"
                            flexDirection="column"
                            alignItems="center"
                            justifyContent="center"
                            height="100%"
                            py={8}
                        >
                            <ShoppingCartIcon sx={{ fontSize: 64, color: alpha(CORPORATE_COLOR, 0.2), mb: 2 }} />
                            <Typography color="text.secondary" textAlign="center">
                                El carrito está vacío
                            </Typography>
                            <Typography variant="caption" color="text.secondary" textAlign="center">
                                Busca productos y agrégalos aquí
                            </Typography>
                        </Box>
                    ) : (
                        <List sx={{ p: 0 }}>
                            {items.map((item, index) => (
                                <CartItem key={`${item.producto.id_producto}-${item.talla}-${index}`}>
                                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                                        <Typography variant="subtitle2" fontWeight="600">
                                            {item.producto.nombre}
                                        </Typography>
                                        <Tooltip title="Eliminar">
                                            <IconButton
                                                size="small"
                                                onClick={() => onEliminarItem(index)}
                                                sx={{ color: '#d32f2f' }}
                                            >
                                                <DeleteIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                    </Box>

                                    {/* Selector de talla para ropa */}
                                    {item.producto.categoria === 'ropa' && (
                                        <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                                            <InputLabel>Talla</InputLabel>
                                            <Select
                                                value={item.talla}
                                                label="Talla"
                                                onChange={(e) => handleTallaChange(index, e)}
                                            >
                                                {tallasDisponibles.map(talla => (
                                                    <MenuItem key={talla} value={talla}>
                                                        {talla}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    )}

                                    <Box display="flex" alignItems="center" justifyContent="space-between">
                                        <Box display="flex" alignItems="center" gap={1}>
                                            <IconButton
                                                size="small"
                                                onClick={() => onActualizarItem(index, item.cantidad - 1)}
                                                disabled={item.cantidad <= 1}
                                                sx={{ border: `1px solid ${alpha(CORPORATE_COLOR, 0.2)}` }}
                                            >
                                                <RemoveIcon fontSize="small" />
                                            </IconButton>
                                            <Typography variant="body2" fontWeight="bold" sx={{ minWidth: 30, textAlign: 'center' }}>
                                                {item.cantidad}
                                            </Typography>
                                            <IconButton
                                                size="small"
                                                onClick={() => onActualizarItem(index, item.cantidad + 1)}
                                                disabled={!verificarStockDisponible(
                                                    item.producto.id_producto,
                                                    item.producto.categoria === 'ropa' ? item.talla : 'UNICA',
                                                    item.cantidad + 1
                                                )}
                                                sx={{ border: `1px solid ${alpha(CORPORATE_COLOR, 0.2)}` }}
                                            >
                                                <AddIcon fontSize="small" />
                                            </IconButton>
                                        </Box>
                                        <Typography variant="body2" fontWeight="bold" color="#FF6B6B">
                                            {formatMoneda(item.subtotal)}
                                        </Typography>
                                    </Box>
                                </CartItem>
                            ))}
                        </List>
                    )}
                </Box>

                {items.length > 0 && (
                    <Box sx={{ p: 2, borderTop: `1px solid ${alpha(CORPORATE_COLOR, 0.1)}` }}>
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                            <Typography variant="h6" fontWeight="bold">
                                Total
                            </Typography>
                            <Typography variant="h5" fontWeight="bold" color="#FF6B6B">
                                {formatMoneda(total)}
                            </Typography>
                        </Box>
                        <Box display="flex" gap={1}>
                            <Button
                                variant="outlined"
                                fullWidth
                                onClick={onVaciarCarrito}
                                sx={{ borderColor: CORPORATE_COLOR, color: CORPORATE_COLOR }}
                            >
                                Vaciar
                            </Button>
                            <Button
                                variant="contained"
                                fullWidth
                                onClick={onContinuar}
                                sx={{ bgcolor: CORPORATE_COLOR, '&:hover': { bgcolor: '#1a1a1a' } }}
                            >
                                Continuar
                            </Button>
                        </Box>
                    </Box>
                )}
            </Drawer>
        </>
    );
};

export default CarritoDrawer;