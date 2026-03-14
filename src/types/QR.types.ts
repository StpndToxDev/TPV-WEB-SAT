// src/types/QR.types.ts
export interface QRProduct {
    id_producto: string;
    nombre: string;
    codigo_qr: string;
}

export interface QRTemplateConfig {
    producto: QRProduct | null;
    cantidad: number;
}