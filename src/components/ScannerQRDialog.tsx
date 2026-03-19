// src/components/ScannerQRDialog.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    Box,
    IconButton,
    Typography,
    Button,
    alpha,
    CircularProgress,
    Alert
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import Html5QrcodePlugin from './Html5QrcodePlugin';

interface ScannerQRDialogProps {
    open: boolean;
    onClose: () => void;
    onScan: (qrCode: string) => void;
}

const ScannerQRDialog: React.FC<ScannerQRDialogProps> = ({ open, onClose, onScan }) => {
    const [error, setError] = useState<string | null>(null);
    const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);
    const [checkingPermission, setCheckingPermission] = useState(false);

    useEffect(() => {
        if (open) {
            checkCameraAvailability();
        } else {
            setError(null);
            setHasPermission(null);
            setCameras([]);
        }
    }, [open]);

    const checkCameraAvailability = async () => {
        setCheckingPermission(true);
        setError(null);

        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('Tu navegador no soporta acceso a cámara');
            }

            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = devices.filter(device => device.kind === 'videoinput');
            
            console.log('Cámaras encontradas:', videoDevices);
            setCameras(videoDevices);

            if (videoDevices.length === 0) {
                throw new Error('No se encontró ninguna cámara en tu dispositivo');
            }

            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                stream.getTracks().forEach(track => track.stop());
                setHasPermission(true);
            } catch (permError) {
                console.error('Error al solicitar permisos:', permError);
                setHasPermission(false);
                throw new Error('No se pudieron obtener permisos de cámara. Por favor, verifica los permisos en tu navegador.');
            }

        } catch (err: any) {
            console.error('Error al verificar cámara:', err);
            setError(err.message || 'Error al acceder a la cámara');
        } finally {
            setCheckingPermission(false);
        }
    };

    const handleRequestPermission = async () => {
        await checkCameraAvailability();
    };

    const handleScanSuccess = (decodedText: string) => {
        console.log('QR escaneado:', decodedText);
        onScan(decodedText);
        onClose();
    };

    const handleScanError = (errorMessage: string) => {
        console.debug('Error de escaneo:', errorMessage);
        if (errorMessage.includes('permission') || errorMessage.includes('NotFound')) {
            setError(errorMessage);
        }
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 3,
                    overflow: 'hidden'
                }
            }}
        >
            <DialogTitle sx={{
                bgcolor: '#303030',
                color: 'white',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <Box display="flex" alignItems="center" gap={1}>
                    <QrCodeScannerIcon />
                    <Typography variant="h6" fontWeight="bold">
                        Escanear Código QR
                    </Typography>
                </Box>
                <IconButton onClick={onClose} sx={{ color: 'white' }}>
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent sx={{ p: 3, minHeight: 400 }}>
                {checkingPermission ? (
                    <Box textAlign="center" py={4}>
                        <CircularProgress sx={{ color: '#303030' }} />
                        <Typography sx={{ mt: 2 }}>
                            Verificando cámara...
                        </Typography>
                    </Box>
                ) : error ? (
                    <Box textAlign="center" py={4}>
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            {hasPermission === false && (
                                <>
                                    <strong>Para usar el escáner:</strong>
                                    <ul style={{ textAlign: 'left', marginTop: 8 }}>
                                        <li>Asegúrate de que el navegador tenga permiso para usar la cámara</li>
                                        <li>En Chrome, haz clic en el candado 🔒 en la barra de direcciones</li>
                                        <li>Verifica que "Cámara" esté permitido</li>
                                        <li>Si está bloqueado, cámbialo a "Permitir" y recarga la página</li>
                                    </ul>
                                </>
                            )}
                        </Typography>
                        <Button
                            variant="contained"
                            onClick={handleRequestPermission}
                            sx={{ bgcolor: '#303030', '&:hover': { bgcolor: '#1a1a1a' } }}
                        >
                            Reintentar
                        </Button>
                    </Box>
                ) : (
                    <Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            Apunta el código QR con la cámara
                        </Typography>
                        <Box sx={{ 
                            position: 'relative',
                            width: '100%',
                            height: 300,
                            bgcolor: '#000',
                            borderRadius: 2,
                            overflow: 'hidden'
                        }}>
                            <Html5QrcodePlugin
                                fps={10}
                                qrbox={250}
                                disableFlip={false}
                                qrCodeSuccessCallback={handleScanSuccess}
                                qrCodeErrorCallback={handleScanError}
                                key={open ? 'scanner-active' : 'scanner-inactive'}
                            />
                        </Box>
                        {cameras.length > 1 && (
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                                Se encontraron {cameras.length} cámaras. Usando la cámara trasera por defecto.
                            </Typography>
                        )}
                    </Box>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default ScannerQRDialog;