// src/components/ResultadoBusquedaCard.tsx
import React from 'react';
import {
    Card,
    CardContent,
    CardMedia,
    Typography,
    Box,
    Chip,
    alpha,
    useTheme
} from '@mui/material';
import { styled } from '@mui/material/styles';
import type { Producto } from '../types/Product.types';

interface ResultadoBusquedaCardProps {
    producto: Producto;
    tieneStock: boolean;
    onClick: (producto: Producto) => void;
}

const StyledCard = styled(Card)(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    borderRadius: theme.spacing(2),
    transition: 'all 0.2s ease',
    cursor: 'pointer',
    height: '100%',
    '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: theme.shadows[4]
    }
}));

const ProductImage = styled(Box)(({ theme }) => ({
    height: 120,
    backgroundColor: theme.palette.grey[100],
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderTopLeftRadius: theme.spacing(2),
    borderTopRightRadius: theme.spacing(2)
}));

const ResultadoBusquedaCard: React.FC<ResultadoBusquedaCardProps> = ({
    producto,
    tieneStock,
    onClick
}) => {
    const theme = useTheme();
    const CORPORATE_COLOR = '#303030';

    const getPrecioTexto = () => {
        if (!tieneStock) return 'SIN STOCK';

        switch (producto.tipo_precio) {
            case 'fijo':
                return `$${producto.precio_fijo}`;
            case 'por_talla':
                return 'Precio por talla';
            case 'por_cantidad':
                return 'Precio por cantidad';
            default:
                return 'Consultar';
        }
    };

    return (
        <StyledCard onClick={() => tieneStock && onClick(producto)}>
            <ProductImage>
                {producto.imagen_url ? (
                    <img
                        src={producto.imagen_url}
                        alt={producto.nombre}
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                        }}
                    />
                ) : (
                    <Typography color="text.secondary">Sin imagen</Typography>
                )}
            </ProductImage>
            <CardContent sx={{ p: 2 }}>
                <Typography variant="subtitle1" fontWeight="600" noWrap>
                    {producto.nombre}
                </Typography>
                <Box display="flex" alignItems="center" gap={1} mt={1}>
                    <Chip
                        label={producto.categoria}
                        size="small"
                        sx={{ bgcolor: alpha(CORPORATE_COLOR, 0.1), color: CORPORATE_COLOR }}
                    />
                    {producto.codigo_qr && (
                        <Chip
                            label="QR"
                            size="small"
                            sx={{ bgcolor: alpha('#4caf50', 0.1), color: '#4caf50' }}
                        />
                    )}
                </Box>
                <Typography
                    variant="body2"
                    color={tieneStock ? CORPORATE_COLOR : 'error'}
                    fontWeight="bold"
                    sx={{ mt: 1 }}
                >
                    {getPrecioTexto()}
                </Typography>
            </CardContent>
        </StyledCard>
    );
};

export default ResultadoBusquedaCard;