import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Chip,
  Grid,
  Divider
} from '@mui/material';
import type { Producto } from '../types/Product.types';

interface ProductDetailsDialogProps {
  open: boolean;
  product: Producto | null;
  onClose: () => void;
  artistaNombre?: string;
}

const ProductDetailsDialog: React.FC<ProductDetailsDialogProps> = ({
  open,
  product,
  onClose,
  artistaNombre
}) => {
  if (!product) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ bgcolor: '#303030', color: 'white', mb: 2 }}>
        Detalles del Producto
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={3}>
          {/* Imagen */}
          <Grid size={{xs:12, md:4}}>
            <Box
              sx={{
                width: '100%',
                height: 200,
                bgcolor: '#f0f0f0',
                borderRadius: 2,
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {product.imagen_url ? (
                <img
                  src={product.imagen_url}
                  alt={product.nombre}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <Typography color="text.secondary">Sin imagen</Typography>
              )}
            </Box>
          </Grid>

          {/* Información básica */}
          <Grid size={{xs:12, md:8}}>
            <Typography variant="h5" gutterBottom fontWeight="bold">
              {product.nombre}
            </Typography>
            
            <Chip 
              label={product.categoria} 
              size="small" 
              sx={{ bgcolor: '#e0e0e0', mb: 2 }} 
            />

            <Typography variant="body1" paragraph>
              {product.descripcion || 'Sin descripción'}
            </Typography>

            <Grid container spacing={2}>
              <Grid size={{xs:6}}>
                <Typography variant="subtitle2" color="text.secondary">
                  Código QR
                </Typography>
                <Typography variant="body2">{product.codigo_qr || 'N/A'}</Typography>
              </Grid>
              <Grid size={{xs:6}}>
                <Typography variant="subtitle2" color="text.secondary">
                  Artista
                </Typography>
                <Typography variant="body2">{artistaNombre || 'N/A'}</Typography>
              </Grid>
              <Grid size={{xs:6}}>
                <Typography variant="subtitle2" color="text.secondary">
                  Ganancia
                </Typography>
                <Typography variant="body2">${product.ganancia_artista} MXN</Typography>
              </Grid>
              <Grid size={{xs:6}}>
                <Typography variant="subtitle2" color="text.secondary">
                  Tipo de precio
                </Typography>
                <Typography variant="body2">
                  {product.tipo_precio === 'fijo' ? 'Precio fijo' :
                   product.tipo_precio === 'por_talla' ? 'Por talla' : 'Por cantidad'}
                </Typography>
              </Grid>
            </Grid>
          </Grid>

          {/* Detalles de precio según tipo */}
          <Grid size={{xs:12}}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" gutterBottom>
              Detalles de precio
            </Typography>

            {product.tipo_precio === 'fijo' && (
              <Typography variant="body1">
                Precio: ${product.precio_fijo} MXN
              </Typography>
            )}

            {product.tipo_precio === 'por_talla' && product.precios_talla && (
              <Grid container spacing={2}>
                {Object.entries(product.precios_talla).map(([talla, precio]) => (
                  <Grid size={{xs:4, sm:2}} key={talla}>
                    <Box sx={{ textAlign: 'center', p: 1, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                      <Typography variant="subtitle2">{talla}</Typography>
                      <Typography variant="body2">${precio}</Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            )}

            {product.tipo_precio === 'por_cantidad' && product.precios_cantidad && (
              <Grid container spacing={2}>
                {Object.entries(product.precios_cantidad).map(([cantidad, precio]) => (
                  <Grid size={{xs:6, sm:3}} key={cantidad}>
                    <Box sx={{ textAlign: 'center', p: 1, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                      <Typography variant="subtitle2">{cantidad} uds</Typography>
                      <Typography variant="body2">${precio}</Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            )}
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="contained" sx={{ bgcolor: '#303030' }}>
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ProductDetailsDialog;