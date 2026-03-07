// src/api/authService.ts
import { supabase } from './supabaseClient';
import type { LoginResponse, VerificarUsuarioResponse } from '../types/Auth.types';

// Función auxiliar para hashear contraseñas (SHA-256 en Base64)
// IMPORTANTE: Debe ser la misma implementación que en Android
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashBase64 = btoa(String.fromCharCode(...hashArray));
  return hashBase64;
}

export const authService = {
  // VERIFICAR USUARIO: GET /?accion=verificar_usuario
  verificarUsuario: async (username: string): Promise<VerificarUsuarioResponse> => {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('username, nombre, activo, primer_login')
        .eq('username', username)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Usuario no encontrado
          return {
            existe: false,
            activo: false,
            primerLogin: false,
            nombre: ''
          };
        }
        throw error;
      }

      return {
        existe: true,
        activo: data.activo,
        primerLogin: data.primer_login,
        nombre: data.nombre
      };
    } catch (error) {
      console.error('Error en verificarUsuario:', error);
      throw new Error(error instanceof Error ? error.message : 'Error al verificar usuario');
    }
  },

  // LOGIN: POST /?tipo=login
  login: async (username: string, password: string): Promise<LoginResponse> => {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('username, nombre, activo, primer_login, password_hash')
        .eq('username', username)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          throw new Error('Usuario no encontrado');
        }
        throw error;
      }

      if (!data.activo) {
        throw new Error('Usuario desactivado');
      }

      if (data.primer_login) {
        return {
          primerLogin: true,
          username: data.username,
          nombre: data.nombre
        };
      }

      // Verificar contraseña
      const passwordHash = await hashPassword(password);
      if (passwordHash === data.password_hash) {
        return {
          primerLogin: false,
          username: data.username,
          nombre: data.nombre
        };
      } else {
        throw new Error('Contraseña incorrecta');
      }
    } catch (error) {
      console.error('Error en login:', error);
      throw error;
    }
  },

  // ESTABLECER PASSWORD: POST /?tipo=establecer_password
  establecerPassword: async (username: string, password: string): Promise<LoginResponse> => {
    try {
      const passwordHash = await hashPassword(password);

      const { data, error } = await supabase
        .from('usuarios')
        .update({
          password_hash: passwordHash,
          primer_login: false
        })
        .eq('username', username)
        .select('username, nombre')
        .single();

      if (error) throw error;

      return {
        primerLogin: false,
        username: data.username,
        nombre: data.nombre
      };
    } catch (error) {
      console.error('Error en establecerPassword:', error);
      throw new Error(error instanceof Error ? error.message : 'Error al establecer contraseña');
    }
  }
};