import apiClient from './axiosConfig';
import type { Inventario } from '../types/Inventory.types';
import type { ApiResponse } from '../types/Artist.types';

const toFormUrlEncoded = (obj: Record<string, string>) => {
    return Object.keys(obj)
        .map(key => encodeURIComponent(key) + '=' + encodeURIComponent(obj[key]))
        .join('&');
};

export const inventoryService = {
    listar: async (): Promise<Inventario[]> => {
        const response = await apiClient.get<ApiResponse<Inventario[]>>('/exec', {
            params: { accion: 'listar_inventario' }
        });
        if (response.data.success && response.data.data) {
            return response.data.data;
        }
        throw new Error(response.data.message || 'Error al listar inventario');
    },

    obtenerPorProducto: async (idProducto: string): Promise<Inventario[]> => {
        const response = await apiClient.get<ApiResponse<Inventario[]>>('/exec', {
            params: { 
                accion: 'inventario_por_producto',
                id_producto: idProducto
            }
        });
        if (response.data.success && response.data.data) {
            return response.data.data;
        }
        throw new Error(response.data.message || 'Error al obtener inventario del producto');
    },

    actualizarStock: async (
        idProducto: string, 
        talla: string, 
        nuevoStock?: number, 
        nuevoStockMinimo?: number
    ): Promise<void> => {
        const params: Record<string, string> = {
            tipo: 'actualizar_stock',
            id_producto: idProducto,
            talla: talla
        };
        
        if (nuevoStock !== undefined) {
            params.nuevo_stock = nuevoStock.toString();
        }
        
        if (nuevoStockMinimo !== undefined) {
            params.nuevo_stock_minimo = nuevoStockMinimo.toString();
        }

        const formData = toFormUrlEncoded(params);
        const response = await apiClient.post<ApiResponse<null>>('/exec', formData);
        
        if (!response.data.success) {
            throw new Error(response.data.message || 'Error al actualizar stock');
        }
    }
};