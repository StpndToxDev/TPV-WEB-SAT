// src/components/QRPrintDialog.tsx
import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    Typography,
    IconButton,
    Chip
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import PrintIcon from '@mui/icons-material/Print';
import type { ProductoSeleccionado } from '../types/QR.types';

interface QRPrintDialogProps {
    open: boolean;
    onClose: () => void;
    productos: ProductoSeleccionado[];
    totalCodigos: number;
}

// Configuración de la cuadrícula
const QR_SIZE_CM = 3; // 3cm
const MARGIN_CM = 0.5; // 0.5cm de margen
const PAGE_WIDTH_CM = 21.6; // Carta: 21.6cm
const PAGE_HEIGHT_CM = 27.9; // Carta: 27.9cm

// Convertir cm a píxeles (asumiendo 96 DPI)
const CM_TO_PX = 37.8; // 1cm = 37.8px aprox

const QR_SIZE_PX = QR_SIZE_CM * CM_TO_PX;
const MARGIN_PX = MARGIN_CM * CM_TO_PX;

// Calcular cuántos QR caben por hoja
const QRS_PER_ROW = Math.floor((PAGE_WIDTH_CM - 2 * MARGIN_CM) / QR_SIZE_CM);
const QRS_PER_COL = Math.floor((PAGE_HEIGHT_CM - 2 * MARGIN_CM) / QR_SIZE_CM);
const QRS_PER_PAGE = QRS_PER_ROW * QRS_PER_COL;

const QRPrintDialog: React.FC<QRPrintDialogProps> = ({
    open,
    onClose,
    productos,
    totalCodigos
}) => {
    if (productos.length === 0) return null;

    const totalPages = Math.ceil(totalCodigos / QRS_PER_PAGE);

    // Generar un array plano con todos los QR a imprimir
    const generateQRList = () => {
        const lista: { nombre: string; codigo_qr: string }[] = [];
        productos.forEach(producto => {
            for (let i = 0; i < producto.cantidad; i++) {
                lista.push({
                    nombre: producto.nombre,
                    codigo_qr: producto.codigo_qr
                });
            }
        });
        return lista;
    };

    const qrList = generateQRList();

    const handlePrint = () => {
        // Crear una nueva ventana para imprimir
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            alert('Por favor, permite las ventanas emergentes para imprimir');
            return;
        }

        // Generar el contenido HTML para impresión
        let printContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Plantilla QR Múltiple</title>
                <style>
                    @page {
                        size: letter;
                        margin: 0.5cm;
                    }
                    body {
                        margin: 0;
                        padding: 0;
                        font-family: Arial, sans-serif;
                    }
                    .page {
                        page-break-after: always;
                        width: 21.6cm;
                        height: 27.9cm;
                        margin: 0 auto;
                        padding: 0.5cm;
                        box-sizing: border-box;
                    }
                    .grid {
                        display: grid;
                        grid-template-columns: repeat(${QRS_PER_ROW}, 1fr);
                        gap: 0.5cm;
                        width: 100%;
                        height: 100%;
                    }
                    .qr-item {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        width: 3cm;
                        height: 3cm;
                        margin: 0 auto;
                    }
                    .qr-code {
                        width: 2.5cm;
                        height: 2.5cm;
                    }
                    .product-name {
                        margin-top: 0.2cm;
                        font-size: 0.3cm;
                        text-align: center;
                        max-width: 3cm;
                        overflow: hidden;
                        text-overflow: ellipsis;
                        white-space: nowrap;
                    }
                </style>
            </head>
            <body>
        `;

        // Generar cada página
        for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
            printContent += `<div class="page"><div class="grid">`;

            for (let qrIndex = 0; qrIndex < QRS_PER_PAGE; qrIndex++) {
                const globalIndex = pageIndex * QRS_PER_PAGE + qrIndex;
                if (globalIndex >= totalCodigos) {
                    // Si ya no hay más QR, agregar celdas vacías para mantener la cuadrícula
                    printContent += `<div></div>`;
                    continue;
                }

                const qr = qrList[globalIndex];
                printContent += `
                    <div class="qr-item">
                        <img class="qr-code" src="https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qr.codigo_qr)}" alt="QR" />
                        <div class="product-name">${qr.nombre}</div>
                    </div>
                `;
            }

            printContent += `</div></div>`;
        }

        printContent += `
            </body>
            </html>
        `;

        // Escribir el contenido en la nueva ventana y imprimir
        printWindow.document.write(printContent);
        printWindow.document.close();
        printWindow.focus();

        // Esperar un momento para que carguen las imágenes
        setTimeout(() => {
            printWindow.print();
            // No cerramos la ventana para que el usuario pueda ver el resultado
        }, 500);
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="lg"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 3,
                    maxWidth: '900px'
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
                <Typography variant="h6" fontWeight="bold">
                    Plantilla de Códigos QR Múltiple
                </Typography>
                <IconButton onClick={onClose} sx={{ color: 'white' }}>
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <Typography variant="body1"></Typography>

            <DialogContent sx={{ p: 3 }}>
                <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                        <Typography variant="body2" color="text.secondary">
                            {totalCodigos} códigos • {totalPages} hoja(s) tamaño carta
                        </Typography>
                        <Box display="flex" gap={1} mt={1}>
                            {productos.map((p, idx) => (
                                <Chip
                                    key={idx}
                                    label={`${p.nombre}: ${p.cantidad}`}
                                    size="small"
                                    sx={{ bgcolor: alpha('#303030', 0.1) }}
                                />
                            ))}
                        </Box>
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                        Cada cuadro: 3cm x 3cm
                    </Typography>
                </Box>

                {/* Vista previa en el modal */}
                <Box sx={{
                    maxHeight: '400px',
                    overflow: 'auto',
                    border: '1px solid #e0e0e0',
                    borderRadius: 2,
                    p: 2,
                    bgcolor: '#fafafa'
                }}>
                    {/* Mostrar solo la primera página como vista previa */}
                    <Box sx={{ mb: 2 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                            Vista previa (primera página)
                        </Typography>
                        <Box sx={{
                            display: 'grid',
                            gridTemplateColumns: `repeat(${QRS_PER_ROW}, 1fr)`,
                            gap: `${MARGIN_PX}px`,
                            padding: `${MARGIN_PX}px`,
                            bgcolor: 'white',
                            borderRadius: 1,
                            border: '1px solid #e0e0e0'
                        }}>
                            {qrList.slice(0, Math.min(QRS_PER_PAGE, totalCodigos)).map((qr, idx) => (
                                <Box
                                    key={idx}
                                    sx={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        width: `${QR_SIZE_PX}px`,
                                        height: `${QR_SIZE_PX}px`,
                                        margin: '0 auto'
                                    }}
                                >
                                    <img
                                        src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qr.codigo_qr)}`}
                                        alt="QR"
                                        style={{ width: '80%', height: '80%' }}
                                    />
                                    <Typography
                                        variant="caption"
                                        align="center"
                                        sx={{
                                            mt: 0.5,
                                            fontSize: '0.6rem',
                                            maxWidth: '100%',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap'
                                        }}
                                    >
                                        {qr.nombre}
                                    </Typography>
                                </Box>
                            ))}
                        </Box>
                    </Box>
                </Box>

                {/* Instrucciones de impresión */}
                <Box sx={{ mt: 2, p: 2, bgcolor: '#e3f2fd', borderRadius: 2 }}>
                    <Typography variant="body2" color="primary.dark">
                        <strong>📌 Instrucciones:</strong>
                    </Typography>
                    <Typography variant="body2" color="primary.dark" sx={{ mt: 1 }}>
                        • Al hacer clic en "Imprimir", se abrirá una nueva ventana con la plantilla optimizada para impresión.
                    </Typography>
                    <Typography variant="body2" color="primary.dark">
                        • Asegúrate de seleccionar "Tamaño carta" y "Sin márgenes" en la configuración de impresión.
                    </Typography>
                    <Typography variant="body2" color="primary.dark">
                        • Los códigos QR están configurados para medir exactamente 3cm x 3cm.
                    </Typography>
                </Box>
            </DialogContent>

            <DialogActions sx={{ p: 3, borderTop: '1px solid #e0e0e0' }}>
                <Button onClick={onClose} variant="outlined">
                    Cancelar
                </Button>
                <Button
                    onClick={handlePrint}
                    variant="contained"
                    startIcon={<PrintIcon />}
                    sx={{ bgcolor: '#303030', '&:hover': { bgcolor: '#1a1a1a' } }}
                >
                    Imprimir
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default QRPrintDialog;