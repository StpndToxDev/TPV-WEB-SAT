// src/types/QR.types.ts
export interface QRProduct {
    id_producto: string;
    nombre: string;
    codigo_qr: string;
}

export interface ProductoSeleccionado extends QRProduct {
    cantidad: number;
}

export interface QRTemplateConfig {
    productos: ProductoSeleccionado[];
    totalCodigos: number;
}