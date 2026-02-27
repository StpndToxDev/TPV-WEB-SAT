export interface Inventario {
    id_inventario: string;
    id_producto: string;
    talla: string;
    stock_actual: number;
    stock_minimo: number;
}

export interface ProductoInventario extends Producto {
    inventario: Inventario[];
    stockTotal: number;
}

// Reutilizamos la interfaz de Producto existente
import type { Producto } from './Product.types';