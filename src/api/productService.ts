// src/api/productService.ts
import { supabase } from './supabaseClient';
import type { Producto, CreateProductPayload, Artista } from '../types/Product.types';
import type { ApiResponse } from '../types/Artist.types';

export const productService = {
    // Listar todos los productos
    listar: async (): Promise<Producto[]> => {
        try {
            const { data, error } = await supabase
                .from('productos')
                .select('*')
                .order('nombre');

            if (error) throw error;

            return data || [];
        } catch (error) {
            console.error('Error en listar productos:', error);
            throw new Error(error instanceof Error ? error.message : 'Error al listar productos');
        }
    },

    // Obtener un producto por ID
    obtener: async (id: string): Promise<Producto> => {
        try {
            const { data, error } = await supabase
                .from('productos')
                .select('*')
                .eq('id_producto', id)
                .single();

            if (error) throw error;

            return data;
        } catch (error) {
            console.error('Error en obtener producto:', error);
            throw new Error(error instanceof Error ? error.message : 'Error al obtener producto');
        }
    },

    // Crear un nuevo producto
    crear: async (payload: CreateProductPayload): Promise<Producto> => {
        try {
            // Obtener el último ID para generar el siguiente (PROD001, PROD002...)
            const { data: ultimos } = await supabase
                .from('productos')
                .select('id_producto')
                .order('id_producto', { ascending: false })
                .limit(1);

            let nuevoId = 'PROD001';
            if (ultimos && ultimos.length > 0) {
                const ultimoId = ultimos[0].id_producto;
                const numero = parseInt(ultimoId.substring(4)) + 1;
                nuevoId = 'PROD' + numero.toString().padStart(3, '0');
            }

            // Preparar los datos según el tipo de precio
            const productoData: any = {
                id_producto: nuevoId,
                codigo_qr: payload.codigo_qr || '',
                nombre: payload.nombre,
                descripcion: payload.descripcion || '',
                imagen_url: payload.imagen_url || '',
                id_artista: payload.id_artista || '',
                ganancia_artista: payload.ganancia_artista || '',
                categoria: payload.categoria || '',
                tipo_precio: payload.tipo_precio || 'fijo'
            };

            // Manejar precios según el tipo
            if (payload.tipo_precio === 'fijo') {
                productoData.precio_fijo = payload.precio_fijo ? parseFloat(payload.precio_fijo) : null;
                productoData.precios_talla = null;
                productoData.precios_cantidad = null;
            } else if (payload.tipo_precio === 'por_talla') {
                productoData.precio_fijo = null;
                productoData.precios_talla = payload.precios_talla ? JSON.parse(payload.precios_talla) : null;
                productoData.precios_cantidad = null;
            } else if (payload.tipo_precio === 'por_cantidad') {
                productoData.precio_fijo = null;
                productoData.precios_talla = null;
                productoData.precios_cantidad = payload.precios_cantidad ? JSON.parse(payload.precios_cantidad) : null;
            }

            const { data, error } = await supabase
                .from('productos')
                .insert([productoData])
                .select()
                .single();

            if (error) throw error;

            // CORREGIDO: Usar productService en lugar de this
            await productService.crearInventarioParaProducto(nuevoId, payload.categoria || '');

            return data;
        } catch (error) {
            console.error('Error en crear producto:', error);
            throw new Error(error instanceof Error ? error.message : 'Error al crear producto');
        }
    },

    // Función auxiliar para crear inventario automático
    crearInventarioParaProducto: async (idProducto: string, categoria: string): Promise<void> => {
        try {
            const tallas = categoria === 'ropa' 
                ? ['S', 'M', 'L', 'XL', 'XXL', '3XL']
                : ['UNICA'];

            // Obtener último ID de inventario
            const { data: ultimos } = await supabase
                .from('inventario')
                .select('id_inventario')
                .order('id_inventario', { ascending: false })
                .limit(1);

            let ultimoNum = 0;
            if (ultimos && ultimos.length > 0) {
                ultimoNum = parseInt(ultimos[0].id_inventario.substring(3));
            }

            const inserts = tallas.map((talla, index) => ({
                id_inventario: 'INV' + (ultimoNum + index + 1).toString().padStart(3, '0'),
                id_producto: idProducto,
                talla: talla,
                stock_actual: 0,
                stock_minimo: 5
            }));

            const { error } = await supabase
                .from('inventario')
                .insert(inserts);

            if (error) throw error;
        } catch (error) {
            console.error('Error al crear inventario para producto:', error);
            // No lanzamos error porque el producto ya se creó, solo registramos
        }
    },

    // Actualizar un producto
    actualizar: async (id: string, payload: CreateProductPayload): Promise<void> => {
        try {
            // Preparar los datos según el tipo de precio
            const productoData: any = {};

            if (payload.codigo_qr !== undefined) productoData.codigo_qr = payload.codigo_qr;
            if (payload.nombre !== undefined) productoData.nombre = payload.nombre;
            if (payload.descripcion !== undefined) productoData.descripcion = payload.descripcion;
            if (payload.imagen_url !== undefined) productoData.imagen_url = payload.imagen_url;
            if (payload.id_artista !== undefined) productoData.id_artista = payload.id_artista;
            if (payload.ganancia_artista !== undefined) productoData.ganancia_artista = payload.ganancia_artista;
            if (payload.categoria !== undefined) productoData.categoria = payload.categoria;
            if (payload.tipo_precio !== undefined) productoData.tipo_precio = payload.tipo_precio;

            // Manejar precios según el tipo
            if (payload.tipo_precio === 'fijo') {
                productoData.precio_fijo = payload.precio_fijo ? parseFloat(payload.precio_fijo) : null;
                productoData.precios_talla = null;
                productoData.precios_cantidad = null;
            } else if (payload.tipo_precio === 'por_talla') {
                productoData.precio_fijo = null;
                productoData.precios_talla = payload.precios_talla ? JSON.parse(payload.precios_talla) : null;
                productoData.precios_cantidad = null;
            } else if (payload.tipo_precio === 'por_cantidad') {
                productoData.precio_fijo = null;
                productoData.precios_talla = null;
                productoData.precios_cantidad = payload.precios_cantidad ? JSON.parse(payload.precios_cantidad) : null;
            }

            const { error } = await supabase
                .from('productos')
                .update(productoData)
                .eq('id_producto', id);

            if (error) throw error;
        } catch (error) {
            console.error('Error en actualizar producto:', error);
            throw new Error(error instanceof Error ? error.message : 'Error al actualizar producto');
        }
    },

    // Eliminar un producto
    eliminar: async (id: string): Promise<void> => {
        try {
            const { error } = await supabase
                .from('productos')
                .delete()
                .eq('id_producto', id);

            if (error) throw error;
        } catch (error) {
            console.error('Error en eliminar producto:', error);
            throw new Error(error instanceof Error ? error.message : 'Error al eliminar producto');
        }
    },

    // Obtener lista de artistas (para el selector)
    listarArtistas: async (): Promise<Artista[]> => {
        try {
            const { data, error } = await supabase
                .from('artistas')
                .select('id_artista, nombre, pais, contacto')
                .order('nombre');

            if (error) throw error;

            return data || [];
        } catch (error) {
            console.error('Error en listar artistas:', error);
            throw new Error(error instanceof Error ? error.message : 'Error al listar artistas');
        }
    }
};