import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Typography,
  IconButton,
  InputAdornment,
  Divider,
  Paper,
  Snackbar,
  Alert
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material/Select';
import RefreshIcon from '@mui/icons-material/Refresh';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';
import SaveIcon from '@mui/icons-material/Save';
import type { CreateProductPayload, Artista } from '../types/Product.types';

interface ProductFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateProductPayload) => Promise<void>;
  initialData?: CreateProductPayload;
  artistas: Artista[];
  title: string;
}

const categorias = ['ropa', 'sticker', 'poster', 'llavero', 'otro'];
const tiposPrecio = ['fijo', 'por_talla', 'por_cantidad'];
const tallas = ['S', 'M', 'L', 'XL', 'XXL', '3XL'];

const ProductForm: React.FC<ProductFormProps> = ({
  open,
  onClose,
  onSubmit,
  initialData,
  artistas,
  title
}) => {
  const [formData, setFormData] = useState<CreateProductPayload>({
    codigo_qr: '',
    nombre: '',
    descripcion: '',
    imagen_url: '',
    id_artista: '',
    ganancia_artista: '',
    categoria: '',
    tipo_precio: 'fijo',
    precio_fijo: '',
    precios_talla: '',
    precios_cantidad: ''
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const [preciosTalla, setPreciosTalla] = useState<Record<string, string>>({});
  const [preciosCantidad, setPreciosCantidad] = useState<Array<{ cantidad: string, precio: string }>>([
    { cantidad: '', precio: '' }
  ]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);

      if (initialData.precios_talla && initialData.precios_talla !== '{}') {
        try {
          const parsed = JSON.parse(initialData.precios_talla);
          setPreciosTalla(parsed);
        } catch (e) {
          console.error('Error parsing precios_talla', e);
        }
      }

      if (initialData.precios_cantidad && initialData.precios_cantidad !== '{}') {
        try {
          const parsed = JSON.parse(initialData.precios_cantidad);
          const array = Object.entries(parsed).map(([cantidad, precio]) => ({
            cantidad,
            precio: String(precio)
          }));
          setPreciosCantidad(array);
        } catch (e) {
          console.error('Error parsing precios_cantidad', e);
        }
      }
    } else {
      resetForm();
    }
  }, [initialData, open]);

  // Función para generar código QR único
  const generarCodigoQR = (
    categoria: string,
    nombreArtista: string,
    nombreProducto: string
  ): string => {
    // Obtener primeras 2 letras de la categoría
    const catPart = categoria.substring(0, 2).toUpperCase().padEnd(2, 'X');

    // Obtener primeras 3 letras del artista (buscar por ID)
    const artista = artistas.find(a => a.id_artista === nombreArtista);
    const artistaNombre = artista?.nombre || 'ART';
    const artistaPart = artistaNombre.substring(0, 3).toUpperCase().padEnd(3, 'X');

    // Obtener primeras 2 letras del producto
    const prodPart = nombreProducto.substring(0, 2).toUpperCase().padEnd(2, 'X');

    // Generar 2 números aleatorios
    const randomPart = Math.floor(Math.random() * 90 + 10).toString(); // 10-99

    return `${catPart}${artistaPart}${prodPart}${randomPart}`;
  };

  // Efecto para generar código QR automáticamente
  useEffect(() => {
    if (!initialData && formData.categoria && formData.id_artista && formData.nombre) {
      const nuevoCodigo = generarCodigoQR(
        formData.categoria,
        formData.id_artista,
        formData.nombre
      );
      setFormData(prev => ({ ...prev, codigo_qr: nuevoCodigo }));
    }
  }, [formData.categoria, formData.id_artista, formData.nombre, initialData]);

  const resetForm = () => {
    setFormData({
      codigo_qr: '',
      nombre: '',
      descripcion: '',
      imagen_url: '',
      id_artista: '',
      ganancia_artista: '',
      categoria: '',
      tipo_precio: 'fijo',
      precio_fijo: '',
      precios_talla: '',
      precios_cantidad: ''
    });
    setPreciosTalla({});
    setPreciosCantidad([{ cantidad: '', precio: '' }]);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    if (name) {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePrecioTallaChange = (talla: string, value: string) => {
    setPreciosTalla(prev => ({ ...prev, [talla]: value }));
  };

  const handlePrecioCantidadChange = (index: number, field: 'cantidad' | 'precio', value: string) => {
    const newPrecios = [...preciosCantidad];
    newPrecios[index][field] = value;
    setPreciosCantidad(newPrecios);
  };

  const addPrecioCantidadRow = () => {
    setPreciosCantidad([...preciosCantidad, { cantidad: '', precio: '' }]);
  };

  const removePrecioCantidadRow = (index: number) => {
    if (preciosCantidad.length > 1) {
      const newPrecios = preciosCantidad.filter((_, i) => i !== index);
      setPreciosCantidad(newPrecios);
    }
  };

  const handleSubmit = async () => {
    // Limpiar errores anteriores
    setFormError(null);

    if (!formData.nombre.trim()) {
      setFormError('El nombre del producto es obligatorio');
      return;
    }

    if (!formData.id_artista) {
      setFormError('Debes seleccionar un artista');
      return;
    }

    const dataToSend = { ...formData };

    if (formData.tipo_precio === 'por_talla') {
      const preciosTallaObj: Record<string, string> = {};
      Object.entries(preciosTalla).forEach(([talla, precio]) => {
        if (precio && precio.toString().trim() !== '') {
          preciosTallaObj[talla] = precio.toString().trim();
        }
      });
      dataToSend.precios_talla = JSON.stringify(preciosTallaObj);
    } else {
      dataToSend.precios_talla = '';
    }

    if (formData.tipo_precio === 'por_cantidad') {
      const preciosCantidadObj: Record<string, string> = {};
      preciosCantidad.forEach(item => {
        if (item.cantidad && item.cantidad.trim() !== '' &&
          item.precio && item.precio.toString().trim() !== '') {
          preciosCantidadObj[item.cantidad.trim()] = item.precio.toString().trim();
        }
      });
      dataToSend.precios_cantidad = JSON.stringify(preciosCantidadObj);
    } else {
      dataToSend.precios_cantidad = '';
    }

    setSubmitting(true);
    try {
      await onSubmit(dataToSend);
      setFormSuccess('Producto guardado correctamente');
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error: any) {
      setFormError(error.message || 'Error al guardar el producto');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          boxShadow: 24
        }
      }}
    >
      <DialogTitle sx={{
        bgcolor: '#303030',
        color: 'white',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        py: 2
      }}>
        <Typography variant="h6" component="div" fontWeight="bold">
          {title}
        </Typography>
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{ color: 'white', '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' } }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3, bgcolor: '#f8f9fa' }}>
        <Paper elevation={0} sx={{ p: 3, borderRadius: 2 }}>
          <Grid container spacing={2.5}>
            {/* Primera fila: Código QR y Nombre */}
            <Grid xs={12} sm={6}>
              <TextField
                fullWidth
                label="Código QR"
                name="codigo_qr"
                value={formData.codigo_qr}
                onChange={handleChange}
                variant="outlined"
                placeholder="Se generará automáticamente"
                size="medium"
                InputProps={{
                  sx: { bgcolor: 'white' },
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => {
                          if (formData.categoria && formData.id_artista && formData.nombre) {
                            const nuevoCodigo = generarCodigoQR(
                              formData.categoria,
                              formData.id_artista,
                              formData.nombre
                            );
                            setFormData(prev => ({ ...prev, codigo_qr: nuevoCodigo }));
                          } else {
                            setFormError('Completa categoría, artista y nombre primero para generar el código QR');
                          }
                        }}
                        edge="end"
                        size="small"
                        title="Generar nuevo código"
                      >
                        <RefreshIcon />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid xs={12} sm={6}>
              <TextField
                fullWidth
                label="Nombre *"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                variant="outlined"
                required
                size="medium"
                InputProps={{
                  sx: { bgcolor: 'white' }
                }}
              />
            </Grid>

            {/* Descripción */}
            <Grid xs={12}>
              <TextField
                fullWidth
                label="Descripción"
                name="descripcion"
                value={formData.descripcion}
                onChange={handleChange}
                variant="outlined"
                multiline
                rows={2}
                size="medium"
                InputProps={{
                  sx: { bgcolor: 'white' }
                }}
              />
            </Grid>

            {/* URL de imagen */}
            <Grid xs={12}>
              <TextField
                fullWidth
                label="URL de imagen"
                name="imagen_url"
                value={formData.imagen_url}
                onChange={handleChange}
                variant="outlined"
                placeholder="https://ejemplo.com/imagen.jpg"
                size="medium"
                InputProps={{
                  sx: { bgcolor: 'white' }
                }}
              />
            </Grid>

            {/* Artista y Ganancia */}
            <Grid xs={12} sm={6}>
              <FormControl fullWidth size="medium">
                <InputLabel>Artista *</InputLabel>
                <Select
                  name="id_artista"
                  value={formData.id_artista}
                  onChange={handleSelectChange}
                  label="Artista *"
                  sx={{ bgcolor: 'white' }}
                >
                  {artistas.map((artista) => (
                    <MenuItem key={artista.id_artista} value={artista.id_artista}>
                      {artista.nombre}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid xs={12} sm={6}>
              <TextField
                fullWidth
                label="Ganancia del artista"
                name="ganancia_artista"
                value={formData.ganancia_artista}
                onChange={handleChange}
                variant="outlined"
                type="number"
                size="medium"
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  endAdornment: <InputAdornment position="end">MXN</InputAdornment>,
                  sx: { bgcolor: 'white' }
                }}
              />
            </Grid>

            {/* Categoría y Tipo de precio */}
            <Grid xs={12} sm={6}>
              <FormControl fullWidth size="medium">
                <InputLabel>Categoría</InputLabel>
                <Select
                  name="categoria"
                  value={formData.categoria}
                  onChange={handleSelectChange}
                  label="Categoría"
                  sx={{ bgcolor: 'white' }}
                >
                  {categorias.map((cat) => (
                    <MenuItem key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid xs={12} sm={6}>
              <FormControl fullWidth size="medium">
                <InputLabel>Tipo de precio *</InputLabel>
                <Select
                  name="tipo_precio"
                  value={formData.tipo_precio}
                  onChange={handleSelectChange}
                  label="Tipo de precio *"
                  sx={{ bgcolor: 'white' }}
                >
                  {tiposPrecio.map((tipo) => (
                    <MenuItem key={tipo} value={tipo}>
                      {tipo === 'fijo' ? 'Precio fijo' :
                        tipo === 'por_talla' ? 'Por talla' : 'Por cantidad'}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Separador visual antes de los precios */}
            <Grid xs={12}>
              <Divider sx={{ my: 1 }} />
            </Grid>

            {/* SECCIÓN DE PRECIOS - Siempre ocupa toda la fila */}
            <Grid xs={12}>
              {/* Precio fijo */}
              {formData.tipo_precio === 'fijo' && (
                <Box sx={{ width: '100%' }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Precio fijo
                  </Typography>
                  <TextField
                    fullWidth
                    label="Precio"
                    name="precio_fijo"
                    value={formData.precio_fijo}
                    onChange={handleChange}
                    variant="outlined"
                    type="number"
                    size="medium"
                    InputProps={{
                      startAdornment: <InputAdornment position="start">$</InputAdornment>,
                      endAdornment: <InputAdornment position="end">MXN</InputAdornment>,
                      sx: { bgcolor: 'white' }
                    }}
                  />
                </Box>
              )}

              {/* Precios por talla */}
              {formData.tipo_precio === 'por_talla' && (
                <Box sx={{ width: '100%' }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Precios por talla
                  </Typography>
                  <Grid container spacing={2}>
                    {tallas.map((talla) => (
                      <Grid xs={6} sm={4} md={4} key={talla}>
                        <TextField
                          fullWidth
                          label={`Talla ${talla}`}
                          value={preciosTalla[talla] || ''}
                          onChange={(e) => handlePrecioTallaChange(talla, e.target.value)}
                          variant="outlined"
                          type="number"
                          size="small"
                          InputProps={{
                            startAdornment: <InputAdornment position="start">$</InputAdornment>,
                            sx: { bgcolor: 'white' }
                          }}
                        />
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              )}

              {/* Precios por cantidad */}
              {formData.tipo_precio === 'por_cantidad' && (
                <Box sx={{ width: '100%' }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Precios por cantidad
                    </Typography>
                    <Button
                      startIcon={<AddIcon />}
                      onClick={addPrecioCantidadRow}
                      size="small"
                      variant="outlined"
                      sx={{ borderColor: '#303030', color: '#303030' }}
                    >
                      Agregar rango
                    </Button>
                  </Box>

                  {preciosCantidad.map((item, index) => (
                    <Box key={index} display="flex" alignItems="center" gap={1} sx={{ mb: 1 }}>
                      <TextField
                        label="Cantidad"
                        value={item.cantidad}
                        onChange={(e) => handlePrecioCantidadChange(index, 'cantidad', e.target.value)}
                        size="small"
                        type="number"
                        sx={{ flex: 1, bgcolor: 'white' }}
                      />
                      <TextField
                        label="Precio"
                        value={item.precio}
                        onChange={(e) => handlePrecioCantidadChange(index, 'precio', e.target.value)}
                        size="small"
                        type="number"
                        sx={{ flex: 1, bgcolor: 'white' }}
                        InputProps={{
                          startAdornment: <InputAdornment position="start">$</InputAdornment>,
                        }}
                      />
                      <IconButton
                        onClick={() => removePrecioCantidadRow(index)}
                        disabled={preciosCantidad.length === 1}
                        color="error"
                        size="small"
                        sx={{
                          bgcolor: preciosCantidad.length === 1 ? '#f5f5f5' : '#ffebee',
                          '&:hover': { bgcolor: preciosCantidad.length === 1 ? '#f5f5f5' : '#ffcdd2' }
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  ))}
                </Box>
              )}
            </Grid>
          </Grid>
        </Paper>
      </DialogContent>

      <DialogActions sx={{ p: 3, bgcolor: '#f8f9fa', borderTop: '1px solid #e0e0e0' }}>
        <Button
          onClick={onClose}
          disabled={submitting}
          variant="outlined"
          sx={{
            borderColor: '#303030',
            color: '#303030',
            '&:hover': { borderColor: '#1a1a1a', bgcolor: 'rgba(48,48,48,0.04)' }
          }}
        >
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={submitting}
          startIcon={<SaveIcon />}
          sx={{
            bgcolor: '#303030',
            '&:hover': { bgcolor: '#1a1a1a' },
            px: 4
          }}
        >
          {submitting ? 'Guardando...' : 'Guardar'}
        </Button>
      </DialogActions>
      {/* Snackbars para errores y éxito */}
      <Snackbar
        open={!!formError}
        autoHideDuration={6000}
        onClose={() => setFormError(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={() => setFormError(null)} severity="error" sx={{ width: '100%' }}>
          {formError}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!formSuccess}
        autoHideDuration={2000}
        onClose={() => setFormSuccess(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={() => setFormSuccess(null)} severity="success" sx={{ width: '100%' }}>
          {formSuccess}
        </Alert>
      </Snackbar>
    </Dialog>
  );
};

export default ProductForm;