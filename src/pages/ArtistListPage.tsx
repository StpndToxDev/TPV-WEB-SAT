import React, { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Button,
  Grid,
  Box,
  Alert,
  Snackbar,
  CircularProgress
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { artistService } from '../api/artistService';
import type { Artist, CreateArtistPayload } from '../types/Artist.types';
import ArtistCard from '../components/ArtistCard';
import ArtistForm from '../components/ArtistForm';
import ConfirmDialog from '../components/ConfirmDialog';

const ArtistListPage: React.FC = () => {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingArtist, setEditingArtist] = useState<Artist | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    artistId: string | null;
    artistName: string;
  }>({
    open: false,
    artistId: null,
    artistName: ''
  });
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });

  const loadArtists = async () => {
    setLoading(true);
    try {
      const data = await artistService.listar();
      setArtists(data);
    } catch (err: any) {
      showSnackbar(err.message || 'Error al cargar los artistas', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadArtists();
  }, []);

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCreate = async (data: CreateArtistPayload) => {
    try {
      await artistService.crear(data);
      await loadArtists();
      showSnackbar('Artista creado exitosamente', 'success');
    } catch (err: any) {
      showSnackbar(err.message || 'Error al crear el artista', 'error');
      throw err;
    }
  };

  const handleUpdate = async (data: CreateArtistPayload) => {
    if (!editingArtist) return;
    try {
      await artistService.actualizar(editingArtist.id_artista, data);
      await loadArtists();
      showSnackbar('Artista actualizado exitosamente', 'success');
    } catch (err: any) {
      showSnackbar(err.message || 'Error al actualizar el artista', 'error');
      throw err;
    }
  };

  const handleDelete = async () => {
    if (!confirmDialog.artistId) return;
    
    try {
      await artistService.eliminar(confirmDialog.artistId);
      await loadArtists();
      showSnackbar('Artista eliminado exitosamente', 'success');
    } catch (err: any) {
      showSnackbar(err.message || 'Error al eliminar el artista', 'error');
    } finally {
      setConfirmDialog({ open: false, artistId: null, artistName: '' });
    }
  };

  const openConfirmDialog = (id: string, name: string) => {
    setConfirmDialog({
      open: true,
      artistId: id,
      artistName: name
    });
  };

  const handleEdit = (artist: Artist) => {
    setEditingArtist(artist);
    setFormOpen(true);
  };

  return (
    <Box sx={{ bgcolor: '#f5f5f5', minHeight: '100vh' }}>
      {/* Header con color #303030 */}
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
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="h4" component="h1" fontWeight="bold">
                Artistas
              </Typography>
              <Typography variant="subtitle1" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                Gestiona los artistas de tu tienda
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setFormOpen(true)}
              sx={{
                bgcolor: 'white',
                color: '#303030',
                '&:hover': { bgcolor: '#f0f0f0' }
              }}
            >
              Nuevo Artista
            </Button>
          </Box>
        </Container>
      </Box>

      {/* Contenido principal */}
      <Container maxWidth="lg" sx={{ pb: 4 }}>
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
            <CircularProgress sx={{ color: '#303030' }} />
          </Box>
        ) : artists.length === 0 ? (
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
              No hay artistas registrados
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Comienza creando un nuevo artista
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setFormOpen(true)}
              sx={{ bgcolor: '#303030', '&:hover': { bgcolor: '#1a1a1a' } }}
            >
              Crear primer artista
            </Button>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {artists.map((artist) => (
              <Grid item xs={12} sm={6} md={4} key={artist.id_artista}>
                <ArtistCard
                  artist={artist}
                  onEdit={handleEdit}
                  onDelete={() => openConfirmDialog(artist.id_artista, artist.nombre)}
                />
              </Grid>
            ))}
          </Grid>
        )}
      </Container>

      {/* Modales y Snackbar */}
      <ArtistForm
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditingArtist(null);
        }}
        onSubmit={editingArtist ? handleUpdate : handleCreate}
        initialData={editingArtist ? {
          nombre: editingArtist.nombre,
          pais: editingArtist.pais,
          contacto: editingArtist.contacto
        } : undefined}
        title={editingArtist ? 'Editar Artista' : 'Nuevo Artista'}
      />

      <ConfirmDialog
        open={confirmDialog.open}
        title="Confirmar eliminación"
        message={`¿Estás seguro de eliminar al artista "${confirmDialog.artistName}"?`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDialog({ open: false, artistId: null, artistName: '' })}
        severity="error"
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ArtistListPage;