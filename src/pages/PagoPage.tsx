// src/pages/PagoPage.tsx
import React, { useState, useEffect } from 'react';
import {
    Container,
    Typography,
    Box,
    Paper,
    Grid,
    Radio,
    RadioGroup,
    FormControlLabel,
    FormControl,
    FormLabel,
    TextField,
    Button,
    Divider,
    Card,
    CardContent,
    Alert,
    CircularProgress,
    Avatar,
    Stepper,
    Step,
    StepLabel,
    Chip,
    alpha,
    useTheme,
    Fade,
    Zoom,
    List,
    ListItem,
    ListItemText,
    ListItemAvatar,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    IconButton
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { useLocation, useNavigate } from 'react-router-dom';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PaymentIcon from '@mui/icons-material/Payment';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import ReceiptIcon from '@mui/icons-material/Receipt';
import CloseIcon from '@mui/icons-material/Close';
import PrintIcon from '@mui/icons-material/Print';
import { puntoVentaService } from '../api/puntoVentaService';
import type { ItemCarrito } from '../types/PuntoVenta.types';

const CORPORATE_COLOR = '#303030';

const StyledPaper = styled(Paper)(({ theme }) => ({
    padding: theme.spacing(4),
    borderRadius: theme.spacing(3),
    boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
    position: 'relative',
    overflow: 'hidden',
    '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        right: 0,
        width: '200px',
        height: '200px',
        background: `linear-gradient(135deg, ${alpha(CORPORATE_COLOR, 0.03)} 0%, ${alpha(CORPORATE_COLOR, 0)} 100%)`,
        borderRadius: '50%',
        transform: 'translate(50px, -50px)',
        pointerEvents: 'none'
    }
}));

const GradientHeader = styled(Box)(({ theme }) => ({
    background: `linear-gradient(135deg, ${CORPORATE_COLOR} 0%, #1a1a1a 100%)`,
    color: 'white',
    padding: theme.spacing(3),
    borderRadius: theme.spacing(2),
    marginBottom: theme.spacing(3),
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(2)
}));

const ResumenCard = styled(Card)(({ theme }) => ({
    borderRadius: theme.spacing(2),
    border: `1px solid ${alpha(CORPORATE_COLOR, 0.1)}`,
    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: '0 8px 24px rgba(0,0,0,0.1)'
    }
}));

const SuccessDialog = styled(Dialog)(({ theme }) => ({
    '& .MuiDialog-paper': {
        borderRadius: theme.spacing(3),
        padding: theme.spacing(2),
        maxWidth: 400,
        textAlign: 'center'
    }
}));

const PagoPage: React.FC = () => {
    const theme = useTheme();
    const location = useLocation();
    const navigate = useNavigate();
    const { items, total } = location.state || { items: [], total: 0 };

    const [metodoPago, setMetodoPago] = useState('efectivo');
    const [montoRecibido, setMontoRecibido] = useState('');
    const [notas, setNotas] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successOpen, setSuccessOpen] = useState(false);
    const [ventaCompletada, setVentaCompletada] = useState<any>(null);

    // Calcular total con promoción de stickers
    const calcularTotalConPromocion = () => {
        const stickers = items.filter((i: ItemCarrito) => i.producto.categoria === 'sticker');
        const otros = items.filter((i: ItemCarrito) => i.producto.categoria !== 'sticker');

        let totalStickers = 0;
        if (stickers.length > 0) {
            const cantidadTotal = stickers.reduce((sum: number, i: ItemCarrito) => sum + i.cantidad, 0);
            const precioUnitario = stickers[0].producto.precio_fijo || 0;
            const gruposDeTres = Math.floor(cantidadTotal / 3);
            const descuentoTotal = gruposDeTres * 10;

            // Calcular precio base de todos los stickers
            const precioBaseStickers = stickers.reduce((sum: number, i: ItemCarrito) => sum + i.subtotal, 0);
            totalStickers = precioBaseStickers - descuentoTotal;
        }

        const totalOtros = otros.reduce((sum: number, i: ItemCarrito) => sum + i.subtotal, 0);
        return totalStickers + totalOtros;
    };

    const totalReal = calcularTotalConPromocion();
    const ahorro = total - totalReal;

    const formatMoneda = (valor: number) => {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN'
        }).format(valor);
    };

    const calcularCambio = () => {
        const monto = parseFloat(montoRecibido) || 0;
        return monto - totalReal;
    };

    const handleConfirmar = async () => {
        if (metodoPago === 'efectivo' && parseFloat(montoRecibido) < totalReal) {
            setError('El monto recibido es insuficiente');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const idVenta = puntoVentaService.generarIdVenta();
            const fechaHora = new Date().toISOString().replace('T', ' ').substring(0, 19);

            await puntoVentaService.registrarVenta(
                idVenta,
                fechaHora,
                metodoPago,
                items,
                notas
            );

            setVentaCompletada({
                idVenta,
                total: totalReal,
                metodoPago,
                cambio: metodoPago === 'efectivo' ? calcularCambio() : 0,
                fecha: new Date().toLocaleString()
            });

            setSuccessOpen(true);
        } catch (err: any) {
            setError(err.message || 'Error al procesar la venta');
        } finally {
            setLoading(false);
        }
    };

    const handleSuccessClose = () => {
        setSuccessOpen(false);
        navigate('/punto-venta', { state: { ventaExitosa: true } });
    };

    const steps = ['Carrito', 'Pago', 'Completado'];
    const activeStep = 1;

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            {/* Stepper */}
            <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
                {steps.map((label) => (
                    <Step key={label}>
                        <StepLabel>{label}</StepLabel>
                    </Step>
                ))}
            </Stepper>

            <Grid container spacing={3}>
                {/* Columna izquierda - Resumen de compra */}
                <Grid size={{ xs: 12, md: 5 }}>
                    <Fade in timeout={500}>
                        <StyledPaper>
                            <GradientHeader>
                                <ShoppingCartIcon />
                                <Typography variant="h6" fontWeight="bold">
                                    Resumen de compra
                                </Typography>
                            </GradientHeader>

                            <List sx={{ maxHeight: 400, overflow: 'auto', mb: 2 }}>
                                {items.map((item: ItemCarrito, index: number) => (
                                    <ListItem key={index} sx={{ px: 0 }}>
                                        <ListItemAvatar>
                                            <Avatar
                                                variant="rounded"
                                                sx={{ bgcolor: alpha(CORPORATE_COLOR, 0.1) }}
                                            >
                                                {item.producto.categoria === 'sticker' ? '📋' : '📦'}
                                            </Avatar>
                                        </ListItemAvatar>
                                        <ListItemText
                                            primary={
                                                <Box display="flex" justifyContent="space-between">
                                                    <Typography variant="body2" fontWeight="500">
                                                        {item.producto.nombre}
                                                    </Typography>
                                                    <Typography variant="body2" fontWeight="bold" color="#FF6B6B">
                                                        {formatMoneda(item.subtotal)}
                                                    </Typography>
                                                </Box>
                                            }
                                            secondary={
                                                <Box display="flex" gap={1} mt={0.5}>
                                                    <Chip
                                                        label={`${item.cantidad} ${item.cantidad === 1 ? 'unidad' : 'unidades'}`}
                                                        size="small"
                                                        sx={{ bgcolor: alpha(CORPORATE_COLOR, 0.1) }}
                                                    />
                                                    {item.producto.categoria === 'ropa' && (
                                                        <Chip
                                                            label={`Talla: ${item.talla}`}
                                                            size="small"
                                                            sx={{ bgcolor: alpha(CORPORATE_COLOR, 0.1) }}
                                                        />
                                                    )}
                                                </Box>
                                            }
                                        />
                                    </ListItem>
                                ))}
                            </List>

                            <Divider sx={{ my: 2 }} />

                            {/* Promoción de stickers */}
                            {items.some((i: ItemCarrito) => i.producto.categoria === 'sticker') && (
                                <ResumenCard sx={{ mb: 2, bgcolor: alpha('#4CAF50', 0.05) }}>
                                    <CardContent>
                                        <Box display="flex" alignItems="center" gap={1} mb={1}>
                                            <CheckCircleIcon sx={{ color: '#4CAF50' }} />
                                            <Typography variant="subtitle2" fontWeight="600" color="#4CAF50">
                                                Promoción de Stickers
                                            </Typography>
                                        </Box>
                                        <Typography variant="body2" color="text.secondary">
                                            ¡Descuento de $10 por cada 3 stickers!
                                        </Typography>
                                        {ahorro > 0 && (
                                            <Typography variant="body2" fontWeight="bold" color="#4CAF50" sx={{ mt: 1 }}>
                                                Ahorro: {formatMoneda(ahorro)}
                                            </Typography>
                                        )}
                                    </CardContent>
                                </ResumenCard>
                            )}

                            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                                <Typography variant="body1">Subtotal:</Typography>
                                <Typography variant="body1">{formatMoneda(total)}</Typography>
                            </Box>
                            {ahorro > 0 && (
                                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                                    <Typography variant="body2" color="#4CAF50">Descuento stickers:</Typography>
                                    <Typography variant="body2" color="#4CAF50">-{formatMoneda(ahorro)}</Typography>
                                </Box>
                            )}
                            <Divider sx={{ my: 1 }} />
                            <Box display="flex" justifyContent="space-between" alignItems="center">
                                <Typography variant="h6" fontWeight="bold">Total a pagar:</Typography>
                                <Typography variant="h5" fontWeight="bold" color="#FF6B6B">
                                    {formatMoneda(totalReal)}
                                </Typography>
                            </Box>
                        </StyledPaper>
                    </Fade>
                </Grid>

                {/* Columna derecha - Método de pago */}
                <Grid size={{ xs: 12, md: 7 }}>
                    <Fade in timeout={800}>
                        <StyledPaper>
                            <GradientHeader>
                                <PaymentIcon />
                                <Typography variant="h6" fontWeight="bold">
                                    Método de pago
                                </Typography>
                            </GradientHeader>

                            <FormControl component="fieldset" fullWidth sx={{ mb: 3 }}>
                                <RadioGroup
                                    value={metodoPago}
                                    onChange={(e) => setMetodoPago(e.target.value)}
                                >
                                    <Grid container spacing={2}>
                                        <Grid size={{ xs: 12, sm: 4 }}>
                                            <ResumenCard
                                                sx={{
                                                    p: 2,
                                                    textAlign: 'center',
                                                    cursor: 'pointer',
                                                    border: metodoPago === 'efectivo' ? `2px solid ${CORPORATE_COLOR}` : '1px solid #e0e0e0'
                                                }}
                                                onClick={() => setMetodoPago('efectivo')}
                                            >
                                                <FormControlLabel
                                                    value="efectivo"
                                                    control={<Radio />}
                                                    label="Efectivo"
                                                    sx={{ m: 0 }}
                                                />
                                            </ResumenCard>
                                        </Grid>
                                        <Grid size={{ xs: 12, sm: 4 }}>
                                            <ResumenCard
                                                sx={{
                                                    p: 2,
                                                    textAlign: 'center',
                                                    cursor: 'pointer',
                                                    border: metodoPago === 'tarjeta' ? `2px solid ${CORPORATE_COLOR}` : '1px solid #e0e0e0'
                                                }}
                                                onClick={() => setMetodoPago('tarjeta')}
                                            >
                                                <FormControlLabel
                                                    value="tarjeta"
                                                    control={<Radio />}
                                                    label="Tarjeta"
                                                    sx={{ m: 0 }}
                                                />
                                            </ResumenCard>
                                        </Grid>
                                        <Grid size={{ xs: 12, sm: 4 }}>
                                            <ResumenCard
                                                sx={{
                                                    p: 2,
                                                    textAlign: 'center',
                                                    cursor: 'pointer',
                                                    border: metodoPago === 'transferencia' ? `2px solid ${CORPORATE_COLOR}` : '1px solid #e0e0e0'
                                                }}
                                                onClick={() => setMetodoPago('transferencia')}
                                            >
                                                <FormControlLabel
                                                    value="transferencia"
                                                    control={<Radio />}
                                                    label="Transferencia"
                                                    sx={{ m: 0 }}
                                                />
                                            </ResumenCard>
                                        </Grid>
                                    </Grid>
                                </RadioGroup>
                            </FormControl>

                            {metodoPago === 'efectivo' && (
                                <Fade in timeout={500}>
                                    <Box mb={3}>
                                        <TextField
                                            fullWidth
                                            label="Monto recibido"
                                            type="number"
                                            value={montoRecibido}
                                            onChange={(e) => setMontoRecibido(e.target.value)}
                                            InputProps={{
                                                startAdornment: <Typography sx={{ mr: 1, color: 'text.secondary' }}>$</Typography>,
                                                sx: { bgcolor: 'white', borderRadius: 2 }
                                            }}
                                            variant="outlined"
                                        />
                                        {montoRecibido && (
                                            <Box
                                                sx={{
                                                    mt: 2,
                                                    p: 2,
                                                    bgcolor: alpha(CORPORATE_COLOR, 0.04),
                                                    borderRadius: 2,
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center'
                                                }}
                                            >
                                                <Typography variant="body2" color="text.secondary">
                                                    Cambio:
                                                </Typography>
                                                <Typography
                                                    variant="h6"
                                                    fontWeight="bold"
                                                    sx={{ color: parseFloat(montoRecibido) >= totalReal ? '#4CAF50' : '#FF6B6B' }}
                                                >
                                                    {formatMoneda(calcularCambio())}
                                                </Typography>
                                            </Box>
                                        )}
                                    </Box>
                                </Fade>
                            )}

                            <TextField
                                fullWidth
                                label="Notas (opcional)"
                                multiline
                                rows={3}
                                value={notas}
                                onChange={(e) => setNotas(e.target.value)}
                                variant="outlined"
                                sx={{ mb: 3, bgcolor: 'white', borderRadius: 2 }}
                            />

                            {error && (
                                <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
                                    {error}
                                </Alert>
                            )}

                            <Button
                                fullWidth
                                variant="contained"
                                size="large"
                                onClick={handleConfirmar}
                                disabled={loading}
                                sx={{
                                    height: 56,
                                    bgcolor: CORPORATE_COLOR,
                                    '&:hover': { bgcolor: '#1a1a1a' },
                                    borderRadius: 2
                                }}
                            >
                                {loading ? <CircularProgress size={24} color="inherit" /> : 'Confirmar Venta'}
                            </Button>
                        </StyledPaper>
                    </Fade>
                </Grid>
            </Grid>

            {/* Diálogo de éxito */}
            <SuccessDialog
                open={successOpen}
                onClose={handleSuccessClose}
                aria-labelledby="success-dialog-title"
            >
                <Zoom in={successOpen}>
                    <Box>
                        <DialogTitle id="success-dialog-title" sx={{ pb: 1 }}>
                            <IconButton
                                onClick={handleSuccessClose}
                                sx={{ position: 'absolute', right: 8, top: 8 }}
                            >
                                <CloseIcon />
                            </IconButton>
                        </DialogTitle>
                        <DialogContent sx={{ textAlign: 'center', pt: 0 }}>
                            <Zoom in={successOpen} timeout={500}>
                                <CheckCircleIcon sx={{ fontSize: 80, color: '#4CAF50', mb: 2 }} />
                            </Zoom>

                            <Typography variant="h5" fontWeight="bold" gutterBottom>
                                ¡Venta Completada!
                            </Typography>

                            <Typography variant="body2" color="text.secondary" paragraph>
                                La venta se ha registrado exitosamente
                            </Typography>

                            {ventaCompletada && (
                                <Box sx={{ mt: 3, textAlign: 'left' }}>
                                    <ResumenCard variant="outlined">
                                        <CardContent>
                                            <Box display="flex" justifyContent="space-between" mb={1}>
                                                <Typography variant="body2" color="text.secondary">
                                                    ID Venta:
                                                </Typography>
                                                <Typography variant="body2" fontWeight="bold">
                                                    {ventaCompletada.idVenta}
                                                </Typography>
                                            </Box>
                                            <Box display="flex" justifyContent="space-between" mb={1}>
                                                <Typography variant="body2" color="text.secondary">
                                                    Fecha:
                                                </Typography>
                                                <Typography variant="body2">
                                                    {ventaCompletada.fecha}
                                                </Typography>
                                            </Box>
                                            <Box display="flex" justifyContent="space-between" mb={1}>
                                                <Typography variant="body2" color="text.secondary">
                                                    Método de pago:
                                                </Typography>
                                                <Chip
                                                    label={ventaCompletada.metodoPago}
                                                    size="small"
                                                    sx={{
                                                        bgcolor: ventaCompletada.metodoPago === 'efectivo' ? alpha('#4CAF50', 0.1) :
                                                            ventaCompletada.metodoPago === 'tarjeta' ? alpha('#2196F3', 0.1) :
                                                                alpha('#FF9800', 0.1),
                                                        color: ventaCompletada.metodoPago === 'efectivo' ? '#4CAF50' :
                                                            ventaCompletada.metodoPago === 'tarjeta' ? '#2196F3' :
                                                                '#FF9800'
                                                    }}
                                                />
                                            </Box>
                                            <Divider sx={{ my: 2 }} />
                                            <Box display="flex" justifyContent="space-between" mb={1}>
                                                <Typography variant="body1" fontWeight="bold">
                                                    Total pagado:
                                                </Typography>
                                                <Typography variant="h6" fontWeight="bold" color="#FF6B6B">
                                                    {formatMoneda(ventaCompletada.total)}
                                                </Typography>
                                            </Box>
                                            {ventaCompletada.metodoPago === 'efectivo' && ventaCompletada.cambio > 0 && (
                                                <Box display="flex" justifyContent="space-between">
                                                    <Typography variant="body2" color="text.secondary">
                                                        Cambio:
                                                    </Typography>
                                                    <Typography variant="body2" fontWeight="bold" color="#4CAF50">
                                                        {formatMoneda(ventaCompletada.cambio)}
                                                    </Typography>
                                                </Box>
                                            )}
                                        </CardContent>
                                    </ResumenCard>
                                </Box>
                            )}
                        </DialogContent>
                        <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
                            <Button
                                variant="contained"
                                onClick={handleSuccessClose}
                                sx={{ bgcolor: CORPORATE_COLOR, '&:hover': { bgcolor: '#1a1a1a' }, minWidth: 120 }}
                            >
                                Aceptar
                            </Button>
                        </DialogActions>
                    </Box>
                </Zoom>
            </SuccessDialog>
        </Container>
    );
};

export default PagoPage;