// src/pages/PuntoVentaPage.tsx
import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
    Container,
    Typography,
    Box,
    TextField,
    InputAdornment,
    Button,
    Grid,
    CircularProgress,
    Alert,
    Avatar,
    Fade,
    Zoom,
    useTheme,
    alpha,
    Badge,
    Fab,
    Paper,
    Chip
} from '@mui/material';
import { styled } from '@mui/material/styles';
import SearchIcon from '@mui/icons-material/Search';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';
import { useNavigate } from 'react-router-dom';
import { puntoVentaService } from '../api/puntoVentaService';
import type { Producto } from '../types/Product.types';
import type { Inventario } from '../types/Inventory.types';
import type { ItemCarrito, AlertaStock } from '../types/PuntoVenta.types';
import ResultadoBusquedaCard from '../components/ResultadoBusquedaCard';
import CarritoDrawer from '../components/CarritoDrawer';
import ScannerQRDialog from '../components/ScannerQRDialog';

// Color corporativo
const CORPORATE_COLOR = '#303030';

const GradientHeader = styled(Box)(({ theme }) => ({
    background: `linear-gradient(135deg, ${CORPORATE_COLOR} 0%, #1a1a1a 100%)`,
    color: 'white',
    padding: theme.spacing(3),
    marginBottom: theme.spacing(3),
    boxShadow: theme.shadows[3],
    position: 'relative',
    overflow: 'hidden',
    [theme.breakpoints.up('md')]: {
        padding: theme.spacing(4)
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
        }
    }
}));

const CartFab = styled(Fab)(({ theme }) => ({
    position: 'fixed',
    bottom: 20,
    right: 20,
    backgroundColor: CORPORATE_COLOR,
    color: 'white',
    '&:hover': {
        backgroundColor: '#1a1a1a'
    },
    [theme.breakpoints.up('md')]: {
        bottom: 30,
        right: 30
    }
}));

const PuntoVentaPage: React.FC = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const [productos, setProductos] = useState<Producto[]>([]);
    const [inventario, setInventario] = useState<Inventario[]>([]);
    const [filteredProductos, setFilteredProductos] = useState<Producto[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Estado del carrito
    const [carrito, setCarrito] = useState<ItemCarrito[]>([]);
    const [carritoOpen, setCarritoOpen] = useState(false);
    const [alertas, setAlertas] = useState<AlertaStock[]>([]);
    const [notificacionesSilenciadas, setNotificacionesSilenciadas] = useState(false);
    const [tiempoSilencio, setTiempoSilencio] = useState<number>(0);
    const SILENCIO_DURACION = 60 * 60 * 1000; // 1 hora

    // Estado del escáner
    const [scannerOpen, setScannerOpen] = useState(false);

    // Debounce para búsqueda
    const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        cargarDatos();
    }, []);

    useEffect(() => {
        if (notificacionesSilenciadas && Date.now() > tiempoSilencio) {
            setNotificacionesSilenciadas(false);
        }
    }, [notificacionesSilenciadas, tiempoSilencio]);

    useEffect(() => {
        verificarAlertas();
    }, [carrito, inventario]);

    const cargarDatos = async () => {
        setLoading(true);
        try {
            const [productosData, inventarioData] = await Promise.all([
                puntoVentaService.listarProductos(),
                puntoVentaService.listarInventario()
            ]);
            setProductos(productosData);
            setFilteredProductos(productosData);
            setInventario(inventarioData);
        } catch (err: any) {
            setError(err.message || 'Error al cargar datos');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = useCallback((texto: string) => {
        setSearchTerm(texto);

        if (searchTimeout.current) {
            clearTimeout(searchTimeout.current);
        }

        searchTimeout.current = setTimeout(() => {
            if (texto.length < 2) {
                setFilteredProductos(productos);
                return;
            }

            const filtered = productos.filter(p =>
                p.nombre.toLowerCase().includes(texto.toLowerCase()) ||
                p.codigo_qr.toLowerCase().includes(texto.toLowerCase())
            );
            setFilteredProductos(filtered);
        }, 300);
    }, [productos]);

    const verificarStockDisponible = (producto: Producto, talla: string, cantidad: number): boolean => {
        const tallaReal = producto.categoria === 'ropa' ? talla : 'UNICA';
        const invItem = inventario.find(i => i.id_producto === producto.id_producto && i.talla === tallaReal);

        if (!invItem) return false;

        const enCarrito = carrito
            .filter(i => i.producto.id_producto === producto.id_producto && i.talla === tallaReal)
            .reduce((sum, i) => sum + i.cantidad, 0);

        return invItem.stock_actual >= enCarrito + cantidad;
    };

    const verificarAlertas = () => {
        if (notificacionesSilenciadas) return;

        const nuevasAlertas: AlertaStock[] = [];

        carrito.forEach(item => {
            const talla = item.producto.categoria === 'ropa' ? item.talla : 'UNICA';
            const invItem = inventario.find(i =>
                i.id_producto === item.producto.id_producto && i.talla === talla
            );

            if (!invItem) return;

            if (invItem.stock_actual <= 0) {
                nuevasAlertas.push({
                    id_producto: item.producto.id_producto,
                    nombre: item.producto.nombre,
                    talla: item.talla,
                    stock_actual: invItem.stock_actual,
                    stock_minimo: invItem.stock_minimo,
                    tipo: 'sin_stock'
                });
            } else if (invItem.stock_actual <= invItem.stock_minimo) {
                nuevasAlertas.push({
                    id_producto: item.producto.id_producto,
                    nombre: item.producto.nombre,
                    talla: item.talla,
                    stock_actual: invItem.stock_actual,
                    stock_minimo: invItem.stock_minimo,
                    tipo: 'stock_bajo'
                });
            }

            if (invItem.stock_actual - item.cantidad <= 0 && invItem.stock_actual > 0) {
                nuevasAlertas.push({
                    id_producto: item.producto.id_producto,
                    nombre: item.producto.nombre,
                    talla: item.talla,
                    stock_actual: invItem.stock_actual,
                    stock_minimo: invItem.stock_minimo,
                    tipo: 'se_agotara'
                });
            }
        });

        setAlertas(nuevasAlertas);
    };

    const agregarAlCarrito = (producto: Producto) => {
        const tallaInicial = producto.categoria === 'ropa' ? '' : 'UNICA';

        // Calcular precio inicial
        let precioInicial = 0;
        if (producto.categoria === 'ropa') {
            precioInicial = 0;
        } else if (producto.categoria === 'sticker') {
            precioInicial = producto.precio_fijo || 0;
        } else if (producto.tipo_precio === 'fijo') {
            precioInicial = producto.precio_fijo || 0;
        } else if (producto.tipo_precio === 'por_cantidad' && producto.precios_cantidad) {
            const valores = Object.values(producto.precios_cantidad);
            precioInicial = valores.length > 0 ? valores[0] : 0;
        }

        const nuevoItem: ItemCarrito = {
            producto,
            talla: tallaInicial,
            cantidad: 1,
            precio_unitario: precioInicial,
            subtotal: precioInicial
        };

        setCarrito([...carrito, nuevoItem]);
        setCarritoOpen(true);
    };

    const actualizarItemCarrito = (index: number, nuevaCantidad: number) => {
        if (nuevaCantidad < 1) return;

        const item = carrito[index];
        const talla = item.producto.categoria === 'ropa' ? item.talla : 'UNICA';

        if (!verificarStockDisponible(item.producto, talla, nuevaCantidad)) {
            setError('Stock insuficiente');
            return;
        }

        const nuevosItems = [...carrito];
        nuevosItems[index].cantidad = nuevaCantidad;
        nuevosItems[index].subtotal = nuevaCantidad * item.precio_unitario;
        setCarrito(nuevosItems);
    };

    const handleCambiarTalla = (index: number, nuevaTalla: string) => {
        const nuevosItems = [...carrito];
        const item = nuevosItems[index];

        // Actualizar talla
        item.talla = nuevaTalla;

        // Actualizar precio según la talla seleccionada
        if (item.producto.precios_talla && item.producto.precios_talla[nuevaTalla]) {
            item.precio_unitario = item.producto.precios_talla[nuevaTalla];
            item.subtotal = item.precio_unitario * item.cantidad;
        }

        setCarrito(nuevosItems);
    };

    const eliminarItemCarrito = (index: number) => {
        setCarrito(carrito.filter((_, i) => i !== index));
    };

    const vaciarCarrito = () => {
        setCarrito([]);
    };

    const silenciarAlertas = () => {
        setNotificacionesSilenciadas(true);
        setTiempoSilencio(Date.now() + SILENCIO_DURACION);
        setAlertas([]);
    };

    const handleScanQR = (qrCode: string) => {
        const producto = productos.find(p => p.codigo_qr === qrCode);
        if (producto) {
            agregarAlCarrito(producto);
        } else {
            setError('Producto no encontrado');
        }
    };

    const handleContinuar = () => {
        // Validar tallas para ropa
        const itemsSinTalla = carrito.filter(i =>
            i.producto.categoria === 'ropa' && !i.talla
        );

        if (itemsSinTalla.length > 0) {
            setError('Selecciona talla para todos los productos de ropa');
            return;
        }

        // Validar stock final
        let stockOk = true;
        carrito.forEach(item => {
            const talla = item.producto.categoria === 'ropa' ? item.talla : 'UNICA';
            if (!verificarStockDisponible(item.producto, talla, item.cantidad)) {
                stockOk = false;
            }
        });

        if (!stockOk) {
            setError('Stock insuficiente para algunos productos');
            return;
        }

        // Calcular total con promoción de stickers
        const total = calcularTotalConPromocion();

        // Navegar a pago
        navigate('/pago', {
            state: {
                items: carrito,
                total
            }
        });
    };

    const calcularTotalConPromocion = (): number => {
        const stickers = carrito.filter(i => i.producto.categoria === 'sticker');
        const otros = carrito.filter(i => i.producto.categoria !== 'sticker');

        let totalStickers = 0;
        if (stickers.length > 0) {
            const cantidadTotal = stickers.reduce((sum, i) => sum + i.cantidad, 0);
            const precioUnitario = stickers[0].producto.precio_fijo || 0;
            totalStickers = puntoVentaService.calcularPrecioStickers(cantidadTotal, precioUnitario);
        }

        const totalOtros = otros.reduce((sum, i) => sum + i.subtotal, 0);
        return totalStickers + totalOtros;
    };

    // Mapa de stock para resultados de búsqueda
    const getStockMap = () => {
        const map: Record<string, boolean> = {};
        productos.forEach(p => {
            if (p.categoria === 'ropa') {
                const tallasConStock = p.precios_talla ?
                    Object.keys(p.precios_talla).filter(talla => {
                        const inv = inventario.find(i =>
                            i.id_producto === p.id_producto && i.talla === talla
                        );
                        return inv && inv.stock_actual > 0;
                    }) : [];
                map[p.id_producto] = tallasConStock.length > 0;
            } else {
                const inv = inventario.find(i =>
                    i.id_producto === p.id_producto && i.talla === 'UNICA'
                );
                map[p.id_producto] = inv ? inv.stock_actual > 0 : false;
            }
        });
        return map;
    };

    const stockMap = getStockMap();

    return (
        <Box sx={{ bgcolor: '#f5f5f5', minHeight: '100vh' }}>
            <GradientHeader>
                <Container maxWidth="xl">
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                        <Box display="flex" alignItems="center" gap={2}>
                            <Avatar
                                sx={{
                                    width: { xs: 40, sm: 60 },
                                    height: { xs: 40, sm: 60 },
                                    bgcolor: 'white',
                                    color: CORPORATE_COLOR
                                }}
                            >
                                <PointOfSaleIcon sx={{ fontSize: { xs: 24, sm: 32 } }} />
                            </Avatar>
                            <Box>
                                <Typography variant="h4" component="h1" fontWeight="700">
                                    Punto de Venta
                                </Typography>
                                <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
                                    Agrega productos al carrito
                                </Typography>
                            </Box>
                        </Box>
                    </Box>
                </Container>
            </GradientHeader>

            <Container maxWidth="xl" sx={{ pb: 4 }}>
                {/* Barra de búsqueda y botón QR */}
                <Box mb={3}>
                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12, sm: 9 }}>
                            <SearchField
                                fullWidth
                                variant="outlined"
                                placeholder="Buscar por nombre o código QR..."
                                value={searchTerm}
                                onChange={(e) => handleSearch(e.target.value)}
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
                                                sx={{ bgcolor: alpha(CORPORATE_COLOR, 0.1) }}
                                            />
                                        </InputAdornment>
                                    )
                                }}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 3 }}>
                            <Button
                                fullWidth
                                variant="contained"
                                size="large"
                                onClick={() => setScannerOpen(true)}
                                startIcon={<QrCodeScannerIcon />}
                                sx={{
                                    height: '56px',
                                    bgcolor: CORPORATE_COLOR,
                                    '&:hover': { bgcolor: '#1a1a1a' }
                                }}
                            >
                                Escanear QR
                            </Button>
                        </Grid>
                    </Grid>
                </Box>

                {/* Resultados de búsqueda */}
                {loading ? (
                    <Box display="flex" justifyContent="center" py={8}>
                        <CircularProgress sx={{ color: CORPORATE_COLOR }} />
                    </Box>
                ) : error ? (
                    <Alert severity="error" sx={{ borderRadius: 2 }} onClose={() => setError(null)}>
                        {error}
                    </Alert>
                ) : filteredProductos.length === 0 ? (
                    <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 2 }}>
                        <Avatar
                            sx={{
                                width: 80,
                                height: 80,
                                bgcolor: alpha(CORPORATE_COLOR, 0.1),
                                color: CORPORATE_COLOR,
                                margin: '0 auto 16px'
                            }}
                        >
                            <SearchIcon sx={{ fontSize: 40 }} />
                        </Avatar>
                        <Typography variant="h5" fontWeight="600" gutterBottom>
                            {searchTerm ? 'No se encontraron productos' : 'Busca un producto'}
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                            {searchTerm
                                ? 'Intenta con otros términos'
                                : 'Escribe para buscar productos'}
                        </Typography>
                    </Paper>
                ) : (
                    <Grid container spacing={2}>
                        {filteredProductos.map((producto) => (
                            <Grid size={{ xs: 6, sm: 4, md: 3, lg: 2 }} key={producto.id_producto}>
                                <ResultadoBusquedaCard
                                    producto={producto}
                                    tieneStock={stockMap[producto.id_producto] || false}
                                    onClick={agregarAlCarrito}
                                />
                            </Grid>
                        ))}
                    </Grid>
                )}
            </Container>

            {/* Botón flotante del carrito */}
            <Badge
                badgeContent={carrito.length}
                color="primary"
                overlap="circular"
                sx={{ position: 'fixed', bottom: 20, right: 20 }}
            >
                <CartFab onClick={() => setCarritoOpen(true)}>
                    <ShoppingCartIcon />
                </CartFab>
            </Badge>

            {/* Drawer del carrito */}
            <CarritoDrawer
                open={carritoOpen}
                onClose={() => setCarritoOpen(false)}
                items={carrito}
                inventario={inventario}
                onActualizarItem={actualizarItemCarrito}
                onEliminarItem={eliminarItemCarrito}
                onVaciarCarrito={vaciarCarrito}
                onContinuar={handleContinuar}
                alertas={alertas}
                onSilenciarAlertas={silenciarAlertas}
                notificacionesSilenciadas={notificacionesSilenciadas}
                onCambiarTalla={handleCambiarTalla}
            />

            {/* Escáner QR */}
            <ScannerQRDialog
                open={scannerOpen}
                onClose={() => setScannerOpen(false)}
                onScan={handleScanQR}
            />
        </Box>
    );
};

export default PuntoVentaPage;