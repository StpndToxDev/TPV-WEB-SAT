// src/api/inventoryService.ts
import { supabase } from './supabaseClient';
import type { Inventario } from '../types/Inventory.types';
import type { ApiResponse } from '../types/Artist.types';

export const inventoryService = {
    // Listar todo el inventario
    listar: async (): Promise<Inventario[]> => {
        try {
            const { data, error } = await supabase
                .from('inventario')
                .select('*')
                .order('id_producto')
                .order('talla');

            if (error) throw error;

            return data || [];
        } catch (error) {
            console.error('Error en listar inventario:', error);
            throw new Error(error instanceof Error ? error.message : 'Error al listar inventario');
        }
    },

    // Obtener inventario por producto
    obtenerPorProducto: async (idProducto: string): Promise<Inventario[]> => {
        try {
            const { data, error } = await supabase
                .from('inventario')
                .select('*')
                .eq('id_producto', idProducto)
                .order('talla');

            if (error) throw error;

            return data || [];
        } catch (error) {
            console.error('Error en obtener inventario por producto:', error);
            throw new Error(error instanceof Error ? error.message : 'Error al obtener inventario del producto');
        }
    },

    // Actualizar stock (puede actualizar stock_actual, stock_minimo o ambos)
    actualizarStock: async (
        idProducto: string, 
        talla: string, 
        nuevoStock?: number, 
        nuevoStockMinimo?: number
    ): Promise<void> => {
        try {
            // Construir objeto de actualización solo con los campos proporcionados
            const updates: Partial<Inventario> = {};
            if (nuevoStock !== undefined) updates.stock_actual = nuevoStock;
            if (nuevoStockMinimo !== undefined) updates.stock_minimo = nuevoStockMinimo;

            // Si no hay nada que actualizar, salir
            if (Object.keys(updates).length === 0) return;

            // Intentar actualizar el registro existente
            const { error } = await supabase
                .from('inventario')
                .update(updates)
                .eq('id_producto', idProducto)
                .eq('talla', talla);

            if (error) {
                // Si el error es porque no existe el registro (PGRST116), intentar crearlo
                if (error.code === 'PGRST116' && nuevoStock !== undefined) {
                    // Obtener el último ID de inventario para generar uno nuevo
                    const { data: ultimos } = await supabase
                        .from('inventario')
                        .select('id_inventario')
                        .order('id_inventario', { ascending: false })
                        .limit(1);

                    let nuevoId = 'INV001';
                    if (ultimos && ultimos.length > 0) {
                        const ultimoId = ultimos[0].id_inventario;
                        const numero = parseInt(ultimoId.substring(3)) + 1;
                        nuevoId = 'INV' + numero.toString().padStart(3, '0');
                    }

                    // Crear nuevo registro
                    const { error: insertError } = await supabase
                        .from('inventario')
                        .insert([{
                            id_inventario: nuevoId,
                            id_producto: idProducto,
                            talla: talla,
                            stock_actual: nuevoStock,
                            stock_minimo: nuevoStockMinimo || 5
                        }]);

                    if (insertError) throw insertError;
                } else {
                    throw error;
                }
            }
        } catch (error) {
            console.error('Error en actualizar stock:', error);
            throw new Error(error instanceof Error ? error.message : 'Error al actualizar stock');
        }
    }
};