import apiClient from './axiosConfig';
import type { Producto } from '../types/Product.types';
import type { CreateProductPayload } from '../types/Product.types';
import type { Artista } from '../types/Product.types';
import type { ApiResponse } from '../types/Artist.types';

const toFormUrlEncoded = (obj: Record<string, string>) => {
    return Object.keys(obj)
        .map(key => encodeURIComponent(key) + '=' + encodeURIComponent(obj[key]))
        .join('&');
};

export const productService = {
    // Listar todos los productos
    listar: async (): Promise<Producto[]> => {
        const response = await apiClient.get<ApiResponse<Producto[]>>('/exec', {
            params: { accion: 'listar_productos' }
        });
        if (response.data.success && response.data.data) {
            return response.data.data;
        }
        throw new Error(response.data.message || 'Error al listar productos');
    },

    // Obtener un producto por ID
    obtener: async (id: string): Promise<Producto> => {
        const response = await apiClient.get<ApiResponse<Producto>>('/exec', {
            params: { 
                accion: 'obtener_producto',
                id: id
            }
        });
        if (response.data.success && response.data.data) {
            return response.data.data;
        }
        throw new Error(response.data.message || 'Error al obtener producto');
    },

    // Crear un nuevo producto
    crear: async (payload: CreateProductPayload): Promise<Producto> => {
        const formData = toFormUrlEncoded({
            tipo: 'crear_producto',
            codigo_qr: payload.codigo_qr,
            nombre: payload.nombre,
            descripcion: payload.descripcion,
            imagen_url: payload.imagen_url,
            id_artista: payload.id_artista,
            _artista: payload.id_artista,
            categoria: payload.categoria,
            tipo_precio: payload.tipo_precio,
            precio_fijo: payload.precio_fijo,
            precios_talla: payload.precios_talla,
            precios_cantidad: payload.precios_cantidad
        });

        const response = await apiClient.post<ApiResponse<Producto>>('/exec', formData);
        if (response.data.success && response.data.data) {
            return response.data.data;
        }
        throw new Error(response.data.message || 'Error al crear producto');
    },

    // Actualizar un producto
    actualizar: async (id: string, payload: CreateProductPayload): Promise<void> => {
        const formData = toFormUrlEncoded({
            tipo: 'actualizar_producto',
            id_producto: id,
            codigo_qr: payload.codigo_qr,
            nombre: payload.nombre,
            descripcion: payload.descripcion,
            imagen_url: payload.imagen_url,
            id_artista: payload.id_artista,
            ganancia_artista: payload.ganancia_artista,
            categoria: payload.categoria,
            tipo_precio: payload.tipo_precio,
            precio_fijo: payload.precio_fijo,
            precios_talla: payload.precios_talla,
            precios_cantidad: payload.precios_cantidad
        });

        const response = await apiClient.post<ApiResponse<null>>('/exec', formData);
        if (!response.data.success) {
            throw new Error(response.data.message || 'Error al actualizar producto');
        }
    },

    // Eliminar un producto
    eliminar: async (id: string): Promise<void> => {
        const formData = toFormUrlEncoded({
            tipo: 'eliminar_producto',
            id_producto: id
        });

        const response = await apiClient.post<ApiResponse<null>>('/exec', formData);
        if (!response.data.success) {
            throw new Error(response.data.message || 'Error al eliminar producto');
        }
    },

    // Obtener lista de artistas (para el selector)
    listarArtistas: async (): Promise<Artista[]> => {
        const response = await apiClient.get<ApiResponse<Artista[]>>('/exec', {
            params: { accion: 'listar_artistas' }
        });
        if (response.data.success && response.data.data) {
            return response.data.data;
        }
        throw new Error(response.data.message || 'Error al listar artistas');
    }
};