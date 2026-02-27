import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box
} from '@mui/material';
import type { CreateArtistPayload } from '../types/Artist.types';

interface ArtistFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateArtistPayload) => Promise<void>;
  initialData?: CreateArtistPayload;
  title: string;
}

const ArtistForm: React.FC<ArtistFormProps> = ({
  open,
  onClose,
  onSubmit,
  initialData,
  title
}) => {
  const [formData, setFormData] = useState<CreateArtistPayload>({
    nombre: '',
    pais: '',
    contacto: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({ nombre: '', pais: '', contacto: '' });
    }
  }, [initialData, open]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.nombre.trim()) {
      alert('El nombre es obligatorio');
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit(formData);
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2 }}>
          <TextField
            fullWidth
            label="Nombre *"
            name="nombre"
            value={formData.nombre}
            onChange={handleChange}
            margin="normal"
            variant="outlined"
            placeholder="Ej: Ana González"
          />
          <TextField
            fullWidth
            label="País"
            name="pais"
            value={formData.pais}
            onChange={handleChange}
            margin="normal"
            variant="outlined"
            placeholder="Ej: México"
          />
          <TextField
            fullWidth
            label="Contacto"
            name="contacto"
            value={formData.contacto}
            onChange={handleChange}
            margin="normal"
            variant="outlined"
            placeholder="Ej: ana@email.com"
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onClose} disabled={submitting}>
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={submitting}
          sx={{
            bgcolor: '#303030',
            '&:hover': { bgcolor: '#1a1a1a' }
          }}
        >
          {submitting ? 'Guardando...' : 'Guardar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ArtistForm;