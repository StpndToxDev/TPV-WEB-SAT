// src/api/qrService.ts
import { supabase } from './supabaseClient';
import type { QRProduct } from '../types/QR.types';

export const qrService = {
    // Obtener todos los productos para el dropdown
    listarProductos: async (): Promise<QRProduct[]> => {
        try {
            const { data, error } = await supabase
                .from('productos')
                .select('id_producto, nombre, codigo_qr')
                .order('nombre');

            if (error) throw error;

            return data || [];
        } catch (error) {
            console.error('Error al listar productos para QR:', error);
            throw new Error(error instanceof Error ? error.message : 'Error al cargar productos');
        }
    },

    // Obtener un producto específico
    obtenerProducto: async (id: string): Promise<QRProduct | null> => {
        try {
            const { data, error } = await supabase
                .from('productos')
                .select('id_producto, nombre, codigo_qr')
                .eq('id_producto', id)
                .single();

            if (error) throw error;

            return data;
        } catch (error) {
            console.error('Error al obtener producto:', error);
            return null;
        }
    }
};