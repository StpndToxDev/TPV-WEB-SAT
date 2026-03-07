// src/api/artistService.ts
import { supabase } from './supabaseClient';
import type { Artist, CreateArtistPayload, ApiResponse } from '../types/Artist.types';

export const artistService = {
    // Obtener todos los artistas (GET)
    listar: async (): Promise<Artist[]> => {
        try {
            const { data, error } = await supabase
                .from('artistas')
                .select('*')
                .order('id_artista');

            if (error) throw error;

            return data || [];
        } catch (error) {
            console.error('Error en listar artistas:', error);
            throw new Error(error instanceof Error ? error.message : 'Error al listar artistas');
        }
    },

    // Crear un nuevo artista (POST)
    crear: async (payload: CreateArtistPayload): Promise<Artist> => {
        try {
            // Obtener el último ID para generar el siguiente (ART001, ART002...)
            const { data: ultimos } = await supabase
                .from('artistas')
                .select('id_artista')
                .order('id_artista', { ascending: false })
                .limit(1);

            let nuevoId = 'ART001';
            if (ultimos && ultimos.length > 0) {
                const ultimoId = ultimos[0].id_artista;
                const numero = parseInt(ultimoId.substring(3)) + 1;
                nuevoId = 'ART' + numero.toString().padStart(3, '0');
            }

            const { data, error } = await supabase
                .from('artistas')
                .insert([{
                    id_artista: nuevoId,
                    nombre: payload.nombre,
                    pais: payload.pais || '',
                    contacto: payload.contacto || ''
                }])
                .select()
                .single();

            if (error) throw error;

            return data;
        } catch (error) {
            console.error('Error en crear artista:', error);
            throw new Error(error instanceof Error ? error.message : 'Error al crear artista');
        }
    },

    // Actualizar un artista existente (POST)
    actualizar: async (id: string, payload: CreateArtistPayload): Promise<void> => {
        try {
            const updates: Partial<Artist> = {};
            if (payload.nombre !== undefined) updates.nombre = payload.nombre;
            if (payload.pais !== undefined) updates.pais = payload.pais;
            if (payload.contacto !== undefined) updates.contacto = payload.contacto;

            const { error } = await supabase
                .from('artistas')
                .update(updates)
                .eq('id_artista', id);

            if (error) throw error;
        } catch (error) {
            console.error('Error en actualizar artista:', error);
            throw new Error(error instanceof Error ? error.message : 'Error al actualizar artista');
        }
    },

    // Eliminar un artista (POST)
    eliminar: async (id: string): Promise<void> => {
        try {
            const { error } = await supabase
                .from('artistas')
                .delete()
                .eq('id_artista', id);

            if (error) throw error;
        } catch (error) {
            console.error('Error en eliminar artista:', error);
            throw new Error(error instanceof Error ? error.message : 'Error al eliminar artista');
        }
    }
};