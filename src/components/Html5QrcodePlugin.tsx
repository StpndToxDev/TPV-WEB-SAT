// src/components/Html5QrcodePlugin.tsx
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import React, { useEffect, useRef, useState } from 'react';

const qrcodeRegionId = 'html5qr-code-full-region';

interface Html5QrcodePluginProps {
    fps?: number;
    qrbox?: number;
    aspectRatio?: number;
    disableFlip?: boolean;
    qrCodeSuccessCallback: (decodedText: string) => void;
    qrCodeErrorCallback?: (error: string) => void;
}

const Html5QrcodePlugin: React.FC<Html5QrcodePluginProps> = (props) => {
    const scannerRef = useRef<Html5QrcodeScanner | null>(null);
    const [initialized, setInitialized] = useState(false);

    useEffect(() => {
        if (!scannerRef.current && !initialized) {
            try {
                const config = {
                    fps: props.fps || 10,
                    qrbox: props.qrbox || 250,
                    aspectRatio: props.aspectRatio || 1.777,
                    disableFlip: props.disableFlip || false,
                    showTorchButtonIfSupported: true,
                    showZoomSliderIfSupported: true,
                    defaultZoomValueIfSupported: 1,
                    rememberLastUsedCamera: true,
                    formatsToSupport: [ 
                        Html5QrcodeSupportedFormats.QR_CODE
                    ]
                };

                console.log('Inicializando escáner con configuración:', config);

                scannerRef.current = new Html5QrcodeScanner(
                    qrcodeRegionId,
                    config,
                    false
                );

                scannerRef.current.render(
                    props.qrCodeSuccessCallback,
                    (errorMessage: string) => {
                        if (errorMessage && !errorMessage.includes('NotFoundException')) {
                            console.debug('Error de escaneo:', errorMessage);
                            if (props.qrCodeErrorCallback) {
                                props.qrCodeErrorCallback(errorMessage);
                            }
                        }
                    }
                );

                setInitialized(true);
                console.log('Escáner inicializado correctamente');

            } catch (error) {
                console.error('Error al inicializar el escáner:', error);
                if (props.qrCodeErrorCallback) {
                    props.qrCodeErrorCallback('Error al iniciar la cámara');
                }
            }
        }

        return () => {
            if (scannerRef.current) {
                try {
                    console.log('Limpiando escáner...');
                    scannerRef.current.clear().catch((error: any) => {
                        console.error('Error al limpiar el escáner:', error);
                    });
                    scannerRef.current = null;
                    setInitialized(false);
                } catch (error) {
                    console.error('Error al limpiar:', error);
                }
            }
        };
    }, [props.fps, props.qrbox, props.aspectRatio, props.disableFlip]);

    return (
        <div 
            id={qrcodeRegionId} 
            style={{
                width: '100%',
                height: '100%',
                minHeight: '300px'
            }}
        />
    );
};

export default Html5QrcodePlugin;