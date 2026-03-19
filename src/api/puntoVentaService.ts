// src/api/puntoVentaService.ts
import { supabase } from './supabaseClient';
import type { Producto } from '../types/Product.types';
import type { Inventario } from '../types/Inventory.types';
import type { ItemCarrito } from '../types/PuntoVenta.types';
import { inventoryService } from './inventoryService';

export const puntoVentaService = {
    // Obtener todos los productos
    listarProductos: async (): Promise<Producto[]> => {
        try {
            const { data, error } = await supabase
                .from('productos')
                .select('*')
                .order('nombre');

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error al listar productos:', error);
            throw error;
        }
    },

    // Obtener inventario completo
    listarInventario: async (): Promise<Inventario[]> => {
        try {
            const { data, error } = await supabase
                .from('inventario')
                .select('*');

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error al listar inventario:', error);
            throw error;
        }
    },

    // Buscar producto por código QR
    buscarPorQR: async (qrCode: string): Promise<Producto | null> => {
        try {
            const { data, error } = await supabase
                .from('productos')
                .select('*')
                .eq('codigo_qr', qrCode)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error al buscar por QR:', error);
            return null;
        }
    },

    // Registrar venta
    registrarVenta: async (
        id_venta: string,
        fecha_hora: string,
        metodo_pago: string,
        productos: ItemCarrito[],
        notas: string = ''
    ): Promise<void> => {
        try {
            // Insertar cabecera de venta
            const { error: errorVenta } = await supabase
                .from('ventas')
                .insert([{
                    id_venta,
                    fecha_hora,
                    metodo_pago,
                    notas
                }]);

            if (errorVenta) throw errorVenta;

            // Insertar detalles y actualizar inventario
            for (const item of productos) {
                const talla = item.producto.categoria === 'ropa' ? item.talla : 'UNICA';

                const { error: errorDetalle } = await supabase
                    .from('ventas_detalle')
                    .insert([{
                        id_venta,
                        id_producto: item.producto.id_producto,
                        talla,
                        cantidad: item.cantidad,
                        precio_unitario: item.precio_unitario,
                        subtotal: item.subtotal
                    }]);

                if (errorDetalle) throw errorDetalle;

                // Actualizar inventario
                const inventario = await inventoryService.obtenerPorProducto(item.producto.id_producto);
                const registro = inventario.find(inv => inv.talla === talla);

                if (registro) {
                    const nuevoStock = registro.stock_actual - item.cantidad;
                    await inventoryService.actualizarStock(
                        item.producto.id_producto,
                        talla,
                        nuevoStock
                    );
                }
            }
        } catch (error) {
            console.error('Error al registrar venta:', error);
            throw error;
        }
    },

    // Generar ID de venta (VTA + timestamp)
    generarIdVenta: (): string => {
        const date = new Date();
        const year = date.getFullYear().toString().slice(-2);
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const seconds = date.getSeconds().toString().padStart(2, '0');
        return `VTA${year}${month}${day}${hours}${minutes}${seconds}`;
    },

    // Calcular precio de stickers con promoción
    calcularPrecioStickers: (cantidad: number, precioUnitario: number): number => {
        const descuentoPorTres = 10.0;
        const gruposDeTres = Math.floor(cantidad / 3);
        const precioBase = cantidad * precioUnitario;
        const descuentoTotal = gruposDeTres * descuentoPorTres;
        return precioBase - descuentoTotal;
    }
};