// src/types/PuntoVenta.types.ts
import type { Producto } from './Product.types';
import type { Inventario } from './Inventory.types';

export interface ItemCarrito {
    producto: Producto;
    talla: string;
    cantidad: number;
    precio_unitario: number;
    subtotal: number;
}

export interface ResultadoBusqueda extends Producto {
    tieneStock: boolean;
}

export interface AlertaStock {
    id_producto: string;
    nombre: string;
    talla: string;
    stock_actual: number;
    stock_minimo: number;
    tipo: 'sin_stock' | 'stock_bajo' | 'se_agotara';
}