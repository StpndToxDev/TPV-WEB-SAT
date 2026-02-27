import React, { useState } from 'react';
import {
    Container,
    Typography,
    TextField,
    Button,
    Box,
    Alert,
    CircularProgress,
    InputAdornment,
    IconButton,
    Paper
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { authService } from '../api/authService';
import { useAuth } from '../contexts/AuthContext';
import icono from '../assets/icono.png';

// Imagen local
import loginImage from '../assets/login-bg.png';

const LoginPage: React.FC = () => {
    const navigate = useNavigate();
    const { login } = useAuth();

    const [step, setStep] = useState<'username' | 'password' | 'firstLogin'>('username');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [userNombre, setUserNombre] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleVerificarUsuario = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!username.trim()) {
            setError('Ingresa tu nombre de usuario');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const result = await authService.verificarUsuario(username);

            if (!result.existe) {
                setError('Usuario no encontrado');
                return;
            }

            if (!result.activo) {
                setError('Usuario desactivado. Contacta al administrador.');
                return;
            }

            setUserNombre(result.nombre);

            if (result.primerLogin) {
                setStep('firstLogin');
            } else {
                setStep('password');
            }
        } catch (err: any) {
            setError(err.message || 'Error al verificar usuario');
        } finally {
            setLoading(false);
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!password) {
            setError('Ingresa tu contraseña');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const result = await authService.login(username, password);
            login({ username: result.username, nombre: result.nombre });
            navigate('/');
        } catch (err: any) {
            setError(err.message || 'Error en login');
        } finally {
            setLoading(false);
        }
    };

    const handleFirstLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password.length < 6) {
            setError('La contraseña debe tener al menos 6 caracteres');
            return;
        }

        if (password !== confirmPassword) {
            setError('Las contraseñas no coinciden');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const result = await authService.establecerPassword(username, password);
            login({ username: result.username, nombre: result.nombre });
            navigate('/');
        } catch (err: any) {
            setError(err.message || 'Error al establecer contraseña');
        } finally {
            setLoading(false);
        }
    };

    const handleBack = () => {
        setStep('username');
        setPassword('');
        setConfirmPassword('');
        setError(null);
    };

    return (
        <Box
            sx={{
                minHeight: '100vh',
                display: 'flex',
                backgroundImage: `url(${loginImage})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                position: 'relative',
                '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.6)',
                }
            }}
        >
            {/* Contenedor del formulario */}
            <Box
                sx={{
                    position: 'relative',
                    zIndex: 2,
                    width: '100%',
                    maxWidth: 500,
                    margin: 'auto',
                    marginRight: { xs: 'auto', md: '10%' },
                    padding: 4
                }}
            >
                <Paper
                    elevation={24}
                    sx={{
                        p: { xs: 4, md: 5 },
                        borderRadius: 4,
                        backdropFilter: 'blur(10px)',
                        backgroundColor: 'rgba(255,255,255,0.95)',
                        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
                    }}
                >
                    {/* Logo y título */}
                    <Box textAlign="center" mb={4}>
                        {/* Icono de 80x80 con esquinas redondeadas */}
                        <Box
                            component="img"
                            src={icono}
                            alt="Stupid & Toxic"
                            sx={{
                                width: 80,
                                height: 80,
                                borderRadius: '20px', // Esquinas redondeadas
                                margin: '0 auto 16px',
                                boxShadow: '0 10px 20px rgba(48,48,48,0.3)',
                                objectFit: 'cover' // Para que la imagen se ajuste bien
                            }}
                        />
                        <Typography variant="h4" fontWeight="700" gutterBottom>
                            Stupid & Toxic
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                            Sistema de Gestión
                        </Typography>
                    </Box>

                    {/* Subtítulo según el paso */}
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
                        {step === 'username' && 'Ingresa tu usuario para continuar'}
                        {step === 'password' && `Hola ${userNombre}, ingresa tu contraseña`}
                        {step === 'firstLogin' && `Hola ${userNombre}, establece tu contraseña`}
                    </Typography>

                    {error && (
                        <Alert
                            severity="error"
                            sx={{
                                mb: 3,
                                borderRadius: 2
                            }}
                        >
                            {error}
                        </Alert>
                    )}

                    {/* Formularios */}
                    {step === 'username' && (
                        <form onSubmit={handleVerificarUsuario}>
                            <TextField
                                fullWidth
                                label="Usuario"
                                variant="outlined"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                disabled={loading}
                                autoFocus
                                sx={{ mb: 3 }}
                            />
                            <Button
                                type="submit"
                                fullWidth
                                variant="contained"
                                disabled={loading}
                                size="large"
                                sx={{
                                    py: 1.8,
                                    bgcolor: '#303030',
                                    '&:hover': { bgcolor: '#1a1a1a' },
                                    borderRadius: 2,
                                    textTransform: 'none',
                                    fontSize: '1.1rem',
                                    fontWeight: 500
                                }}
                            >
                                {loading ? <CircularProgress size={24} color="inherit" /> : 'Continuar'}
                            </Button>
                        </form>
                    )}

                    {step === 'password' && (
                        <form onSubmit={handleLogin}>
                            <TextField
                                fullWidth
                                label="Contraseña"
                                type={showPassword ? 'text' : 'password'}
                                variant="outlined"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={loading}
                                autoFocus
                                sx={{ mb: 3 }}
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton
                                                onClick={() => setShowPassword(!showPassword)}
                                                edge="end"
                                            >
                                                {showPassword ? <VisibilityOff /> : <Visibility />}
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                }}
                            />
                            <Button
                                type="submit"
                                fullWidth
                                variant="contained"
                                disabled={loading}
                                size="large"
                                sx={{
                                    py: 1.8,
                                    bgcolor: '#303030',
                                    '&:hover': { bgcolor: '#1a1a1a' },
                                    borderRadius: 2,
                                    textTransform: 'none',
                                    fontSize: '1.1rem',
                                    fontWeight: 500,
                                    mb: 1
                                }}
                            >
                                {loading ? <CircularProgress size={24} color="inherit" /> : 'Iniciar Sesión'}
                            </Button>
                            <Button
                                fullWidth
                                onClick={handleBack}
                                disabled={loading}
                                sx={{
                                    textTransform: 'none',
                                    color: '#666',
                                    '&:hover': { bgcolor: 'transparent', textDecoration: 'underline' }
                                }}
                            >
                                ← Volver
                            </Button>
                        </form>
                    )}

                    {step === 'firstLogin' && (
                        <form onSubmit={handleFirstLogin}>
                            <TextField
                                fullWidth
                                label="Nueva Contraseña"
                                type={showPassword ? 'text' : 'password'}
                                variant="outlined"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={loading}
                                autoFocus
                                sx={{ mb: 2 }}
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton
                                                onClick={() => setShowPassword(!showPassword)}
                                                edge="end"
                                            >
                                                {showPassword ? <VisibilityOff /> : <Visibility />}
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                }}
                            />
                            <TextField
                                fullWidth
                                label="Confirmar Contraseña"
                                type={showConfirmPassword ? 'text' : 'password'}
                                variant="outlined"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                disabled={loading}
                                sx={{ mb: 3 }}
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                edge="end"
                                            >
                                                {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                }}
                            />
                            <Button
                                type="submit"
                                fullWidth
                                variant="contained"
                                disabled={loading}
                                size="large"
                                sx={{
                                    py: 1.8,
                                    bgcolor: '#303030',
                                    '&:hover': { bgcolor: '#1a1a1a' },
                                    borderRadius: 2,
                                    textTransform: 'none',
                                    fontSize: '1.1rem',
                                    fontWeight: 500,
                                    mb: 1
                                }}
                            >
                                {loading ? <CircularProgress size={24} color="inherit" /> : 'Establecer Contraseña'}
                            </Button>
                            <Button
                                fullWidth
                                onClick={handleBack}
                                disabled={loading}
                                sx={{
                                    textTransform: 'none',
                                    color: '#666',
                                    '&:hover': { bgcolor: 'transparent', textDecoration: 'underline' }
                                }}
                            >
                                ← Volver
                            </Button>
                        </form>
                    )}

                    {/* Footer */}
                    <Box sx={{ mt: 4, textAlign: 'center' }}>
                        <Typography variant="body2" color="text.secondary" sx={{ opacity: 0.7 }}>
                            © {new Date().getFullYear()} Stupid & Toxic. Todos los derechos reservados.
                        </Typography>
                    </Box>
                </Paper>
            </Box>
        </Box>
    );
};

export default LoginPage;