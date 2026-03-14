// src/pages/ArtistListPage.tsx
import React, { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Button,
  Grid,
  Box,
  Alert,
  Snackbar,
  CircularProgress,
  Avatar,
  Fade,
  Zoom,
  useTheme,
  alpha,
  Card,
  CardContent
} from '@mui/material';
import { styled } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import PeopleIcon from '@mui/icons-material/People';
import RefreshIcon from '@mui/icons-material/Refresh';
import { artistService } from '../api/artistService';
import type { Artist, CreateArtistPayload } from '../types/Artist.types';
import ArtistCard from '../components/ArtistCard';
import ArtistForm from '../components/ArtistForm';
import ConfirmDialog from '../components/ConfirmDialog';

// Color corporativo
const CORPORATE_COLOR = '#303030';

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

const ArtistListPage: React.FC = () => {
  const theme = useTheme();
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
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

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadArtists();
    setRefreshing(false);
  };

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
                    <PeopleIcon sx={{ fontSize: 32 }} />
                  </Avatar>
                </Zoom>
                <Box>
                  <Typography variant="h3" component="h1" fontWeight="700">
                    Artistas
                  </Typography>
                  <Typography variant="h6" sx={{ opacity: 0.9, fontWeight: 400 }}>
                    Gestiona los artistas de la tienda
                  </Typography>
                </Box>
              </Box>
              <Box display="flex" gap={2}>
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
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setFormOpen(true)}
                  sx={{
                    bgcolor: 'white',
                    color: CORPORATE_COLOR,
                    '&:hover': { 
                      bgcolor: '#f0f0f0',
                      transform: 'scale(1.02)'
                    },
                    transition: 'transform 0.2s ease'
                  }}
                >
                  Nuevo Artista
                </Button>
              </Box>
            </Box>
          </Fade>
        </Container>
      </GradientHeader>

      {/* Contenido principal */}
      <Container maxWidth="lg" sx={{ pb: 4 }}>
        {/* Tarjetas de estadísticas rápidas (solo cuando hay datos) */}
        {!loading && artists.length > 0 && (
          <Fade in timeout={800}>
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid size={{xs:12, sm:4}}>
                <StatsCard>
                  <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ bgcolor: alpha(CORPORATE_COLOR, 0.1), color: CORPORATE_COLOR }}>
                      <PeopleIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Total Artistas
                      </Typography>
                      <Typography variant="h4" fontWeight="bold" sx={{ color: CORPORATE_COLOR }}>
                        {artists.length}
                      </Typography>
                    </Box>
                  </CardContent>
                </StatsCard>
              </Grid>
              <Grid size={{xs:12, sm:4}}>
                <StatsCard>
                  <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ bgcolor: alpha('#2196f3', 0.1), color: '#2196f3' }}>
                      🌎
                    </Avatar>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Países representados
                      </Typography>
                      <Typography variant="h4" fontWeight="bold" sx={{ color: '#2196f3' }}>
                        {new Set(artists.map(a => a.pais).filter(Boolean)).size}
                      </Typography>
                    </Box>
                  </CardContent>
                </StatsCard>
              </Grid>
              <Grid size={{xs:12, sm:4}}>
                <StatsCard>
                  <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ bgcolor: alpha('#4caf50', 0.1), color: '#4caf50' }}>
                      📧
                    </Avatar>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Con contacto
                      </Typography>
                      <Typography variant="h4" fontWeight="bold" sx={{ color: '#4caf50' }}>
                        {artists.filter(a => a.contacto).length}
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
        ) : artists.length === 0 ? (
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
                  <PeopleIcon sx={{ fontSize: 40 }} />
                </Avatar>
              </Zoom>
              <Typography variant="h5" fontWeight="600" gutterBottom>
                No hay artistas registrados
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                Comienza creando un nuevo artista para gestionar tu catálogo
              </Typography>
              <Button
                variant="contained"
                size="large"
                startIcon={<AddIcon />}
                onClick={() => setFormOpen(true)}
                sx={{
                  bgcolor: CORPORATE_COLOR,
                  '&:hover': { bgcolor: '#1a1a1a' },
                  px: 4,
                  py: 1.5
                }}
              >
                Crear primer artista
              </Button>
            </EmptyStateCard>
          </Fade>
        ) : (
          <Fade in timeout={500}>
            <Grid container spacing={3}>
              {artists.map((artist, index) => (
                <Grid 
                  size={{xs:12, sm:6, md:4}} 
                  key={artist.id_artista}
                  sx={{
                    animation: `fadeInUp 0.5s ease ${index * 0.1}s both`,
                    '@keyframes fadeInUp': {
                      from: {
                        opacity: 0,
                        transform: 'translateY(20px)'
                      },
                      to: {
                        opacity: 1,
                        transform: 'translateY(0)'
                      }
                    }
                  }}
                >
                  <ArtistCard
                    artist={artist}
                    onEdit={handleEdit}
                    onDelete={() => openConfirmDialog(artist.id_artista, artist.nombre)}
                  />
                </Grid>
              ))}
            </Grid>
          </Fade>
        )}
      </Container>

      {/* Modales y Snackbar (sin cambios funcionales) */}
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
        <Alert 
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

export default ArtistListPage;