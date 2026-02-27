import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  IconButton,
  Box,
  Chip
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PublicIcon from '@mui/icons-material/Public';
import EmailIcon from '@mui/icons-material/Email';
import type { Artist } from '../types/Artist.types';

interface ArtistCardProps {
  artist: Artist;
  onEdit: (artist: Artist) => void;
  onDelete: (id: string) => void;
}

const ArtistCard: React.FC<ArtistCardProps> = ({ artist, onEdit, onDelete }) => {
  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <CardContent sx={{ flexGrow: 1 }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Typography variant="h6" component="h3" gutterBottom fontWeight="bold">
            {artist.nombre}
          </Typography>
          <Box>
            <IconButton 
              size="small" 
              onClick={() => onEdit(artist)}
              sx={{ color: '#1976d2', mr: 1 }}
            >
              <EditIcon />
            </IconButton>
            <IconButton 
              size="small" 
              onClick={() => onDelete(artist.id_artista)}
              sx={{ color: '#d32f2f' }}
            >
              <DeleteIcon />
            </IconButton>
          </Box>
        </Box>
        
        {artist.pais && (
          <Box display="flex" alignItems="center" mt={1}>
            <PublicIcon sx={{ fontSize: 18, mr: 1, color: 'text.secondary' }} />
            <Typography variant="body2" color="text.secondary">
              {artist.pais}
            </Typography>
          </Box>
        )}
        
        {artist.contacto && (
          <Box display="flex" alignItems="center" mt={1}>
            <EmailIcon sx={{ fontSize: 18, mr: 1, color: 'text.secondary' }} />
            <Typography variant="body2" color="text.secondary">
              {artist.contacto}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default ArtistCard;