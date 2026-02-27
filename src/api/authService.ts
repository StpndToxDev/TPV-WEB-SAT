import apiClient from './axiosConfig';
import type { ApiResponse } from '../types/Artist.types';
import type { LoginResponse, VerificarUsuarioResponse } from '../types/Auth.types';

const toFormUrlEncoded = (obj: Record<string, string>) => {
  return Object.keys(obj)
    .map(key => encodeURIComponent(key) + '=' + encodeURIComponent(obj[key]))
    .join('&');
};

export const authService = {
  verificarUsuario: async (username: string): Promise<VerificarUsuarioResponse> => {
    const response = await apiClient.get<ApiResponse<VerificarUsuarioResponse>>('/exec', {
      params: {
        accion: 'verificar_usuario',
        username: username
      }
    });
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Error al verificar usuario');
  },

  login: async (username: string, password: string): Promise<LoginResponse> => {
    const formData = toFormUrlEncoded({
      tipo: 'login',
      username: username,
      password: password
    });

    const response = await apiClient.post<ApiResponse<LoginResponse>>('/exec', formData);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Error en login');
  },

  establecerPassword: async (username: string, password: string): Promise<LoginResponse> => {
    const formData = toFormUrlEncoded({
      tipo: 'establecer_password',
      username: username,
      password: password
    });

    const response = await apiClient.post<ApiResponse<LoginResponse>>('/exec', formData);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Error al establecer contraseña');
  }
};