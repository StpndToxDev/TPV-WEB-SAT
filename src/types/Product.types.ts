export interface Producto {
    id_producto: string;
    codigo_qr: string;
    nombre: string;
    descripcion: string;
    imagen_url: string;
    id_artista: string;
    ganancia_artista: string;
    categoria: string;
    tipo_precio: string;
    precio_fijo: number | null;
    precios_talla: Record<string, number> | null;
    precios_cantidad: Record<string, number> | null;
}

export interface CreateProductPayload {
    codigo_qr: string;
    nombre: string;
    descripcion: string;
    imagen_url: string;
    id_artista: string;
    ganancia_artista: string;
    categoria: string;
    tipo_precio: string;
    precio_fijo: string;
    precios_talla: string;
    precios_cantidad: string;
}

export interface Artista {
    id_artista: string;
    nombre: string;
    pais: string;
    contacto: string;
}