import apiClient from './axiosConfig';
import type {CreateArtistPayload } from '../types/Artist.types';
import type { ApiResponse } from '../types/Artist.types';
import type {Artist} from '../types/Artist.types';

// Helper para convertir un objeto a `application/x-www-form-urlencoded`
// Este formato es el que usa la función doPost de nuestro Apps Script.
const toFormUrlEncoded = (obj: Record<string, string>) => {
    return Object.keys(obj)
        .map(key => encodeURIComponent(key) + '=' + encodeURIComponent(obj[key]))
        .join('&');
};

export const artistService = {

    // Obtener todos los artistas (GET)
    listar: async (): Promise<Artist[]> => {
        // Llamamos al endpoint GET de Apps Script con el parámetro 'accion'
        const response = await apiClient.get<ApiResponse<Artist[]>>('/exec', {
            params: {
                accion: 'listar_artistas'
            }
        });
        // La API de Apps Script nos responde con { success, message, data }
        if (response.data.success && response.data.data) {
            return response.data.data;
        } else {
            throw new Error(response.data.message || 'Error al listar artistas');
        }
    },

    // Crear un nuevo artista (POST)
    crear: async (payload: CreateArtistPayload): Promise<Artist> => {
        // Preparamos los datos para el POST en formato urlencoded
        const formData = toFormUrlEncoded({
            tipo: 'crear_artista',
            nombre: payload.nombre,
            pais: payload.pais,
            contacto: payload.contacto
        });

        const response = await apiClient.post<ApiResponse<Artist>>('/exec', formData);
        if (response.data.success && response.data.data) {
            return response.data.data;
        } else {
            throw new Error(response.data.message || 'Error al crear artista');
        }
    },

    // Actualizar un artista existente (POST)
    actualizar: async (id: string, payload: CreateArtistPayload): Promise<void> => {
        const formData = toFormUrlEncoded({
            tipo: 'actualizar_artista',
            id_artista: id,
            nombre: payload.nombre,
            pais: payload.pais,
            contacto: payload.contacto
        });

        const response = await apiClient.post<ApiResponse<null>>('/exec', formData);
        if (!response.data.success) {
            throw new Error(response.data.message || 'Error al actualizar artista');
        }
    },

    // Eliminar un artista (POST)
    eliminar: async (id: string): Promise<void> => {
        const formData = toFormUrlEncoded({
            tipo: 'eliminar_artista',
            id_artista: id
        });

        const response = await apiClient.post<ApiResponse<null>>('/exec', formData);
         if (!response.data.success) {
            throw new Error(response.data.message || 'Error al eliminar artista');
        }
    }
};