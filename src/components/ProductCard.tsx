import React, { useState } from 'react';
import {
    Card,
    CardContent,
    CardMedia,
    Typography,
    IconButton,
    Box,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import QrCodeIcon from '@mui/icons-material/QrCode';
import { QRCodeCanvas } from 'qrcode.react';
import type { Producto } from '../types/Product.types';

interface ProductCardProps {
    product: Producto;
    onEdit: (product: Producto) => void;
    onDelete: (id: string) => void;
    onViewDetails: (product: Producto) => void;
    artistaNombre?: string;
}

const ProductCard: React.FC<ProductCardProps> = ({
    product,
    onEdit,
    onDelete,
    onViewDetails,
    artistaNombre
}) => {
    const [qrOpen, setQrOpen] = useState(false);

    const getPrecioTexto = () => {
        switch (product.tipo_precio) {
            case 'fijo':
                return `$${product.precio_fijo}`;
            case 'por_talla':
                return 'Precio por talla';
            case 'por_cantidad':
                return 'Precio por cantidad';
            default:
                return 'Consultar';
        }
    };

    const handleDownloadQR = () => {
        const canvas = document.getElementById(`qr-${product.id_producto}`) as HTMLCanvasElement;
        if (canvas) {
            const url = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.download = `${product.nombre.replace(/\s+/g, '_')}_QR.png`;
            link.href = url;
            link.click();
        }
    };

    const handleEditClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onEdit(product);
    };

    const handleDeleteClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onDelete(product.id_producto);
    };

    const handleQrClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setQrOpen(true);
    };

    return (
        <>
            <Card
                sx={{
                    width: '100%',
                    height: 380,
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: 6,
                        cursor: 'pointer'
                    },
                    overflow: 'hidden',
                    borderRadius: 2,
                    bgcolor: 'white'
                }}
                onClick={() => onViewDetails(product)}
            >
                {/* Imagen - altura fija */}
                <Box sx={{ height: 160, overflow: 'hidden', bgcolor: '#f5f5f5' }}>
                    {product.imagen_url ? (
                        <CardMedia
                            component="img"
                            height="160"
                            image={product.imagen_url}
                            alt={product.nombre}
                            sx={{ objectFit: 'cover', width: '100%' }}
                        />
                    ) : (
                        <Box
                            sx={{
                                height: 160,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        >
                            <Typography color="text.secondary">Sin imagen</Typography>
                        </Box>
                    )}
                </Box>

                {/* Contenido */}
                <CardContent sx={{
                    flexGrow: 1,
                    p: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 0.5
                }}>
                    <Typography
                        variant="h6"
                        component="h3"
                        fontWeight="bold"
                        sx={{
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                        }}
                    >
                        {product.nombre}
                    </Typography>

                    <Chip
                        label={product.categoria}
                        size="small"
                        sx={{ bgcolor: '#e0e0e0', height: 24, width: 'fit-content' }}
                    />

                    <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                        }}
                    >
                        {product.descripcion || 'Sin descripción'}
                    </Typography>

                    {artistaNombre && (
                        <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                            }}
                        >
                            {artistaNombre}
                        </Typography>
                    )}

                    <Typography variant="body2" color="text.secondary">
                        Ganancia: ${product.ganancia_artista} MXN
                    </Typography>

                    <Box mt={1}>
                        <Typography variant="body1" fontWeight="bold" color="#303030">
                            {getPrecioTexto()}
                        </Typography>
                    </Box>
                </CardContent>

                {/* Botones de acción */}
                <Box
                    sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        bgcolor: 'rgba(255,255,255,0.95)',
                        borderRadius: 2,
                        p: 0.5,
                        zIndex: 1,
                        display: 'flex',
                        gap: 0.5,
                        boxShadow: 1
                    }}
                >
                    <IconButton size="small" onClick={handleQrClick} sx={{ color: '#4caf50' }}>
                        <QrCodeIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={handleEditClick} sx={{ color: '#1976d2' }}>
                        <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={handleDeleteClick} sx={{ color: '#d32f2f' }}>
                        <DeleteIcon fontSize="small" />
                    </IconButton>
                </Box>

                {/* Código QR (resumen) */}
                {product.codigo_qr && (
                    <Box
                        sx={{
                            position: 'absolute',
                            bottom: 8,
                            left: 8,
                            bgcolor: 'rgba(255,255,255,0.95)',
                            borderRadius: 1,
                            p: 0.5,
                            px: 1,
                            fontSize: '0.7rem',
                            color: 'text.secondary',
                            zIndex: 1,
                            boxShadow: 1
                        }}
                    >
                        QR: {product.codigo_qr.substring(0, 9)}
                    </Box>
                )}
            </Card>

            {/* Modal QR (igual) */}
            <Dialog open={qrOpen} onClose={() => setQrOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Código QR - {product.nombre}</DialogTitle>
                <DialogContent>
                    <Box display="flex" flexDirection="column" alignItems="center" py={3}>
                        <QRCodeCanvas
                            id={`qr-${product.id_producto}`}
                            value={product.codigo_qr || product.id_producto}
                            size={256}
                            level="H"
                            includeMargin
                            bgColor="#ffffff"
                            fgColor="#303030"
                        />
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                            Valor: {product.codigo_qr || product.id_producto}
                        </Typography>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleDownloadQR} variant="contained" sx={{ bgcolor: '#303030' }}>
                        Descargar QR
                    </Button>
                    <Button onClick={() => setQrOpen(false)}>Cerrar</Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default ProductCard;