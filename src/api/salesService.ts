import apiClient from './axiosConfig';
import type { ApiResponse } from '../types/Artist.types';
import type { VentasResponse } from '../types/Sales.types';

export const salesService = {
  obtenerVentas: async (fechaInicio?: string, fechaFin?: string): Promise<VentasResponse> => {
    const params: any = {
      accion: 'ventas_con_detalles'
    };
    
    if (fechaInicio) {
      params.fecha_inicio = fechaInicio;
    }
    if (fechaFin) {
      params.fecha_fin = fechaFin;
    }
    
    const response = await apiClient.get<ApiResponse<VentasResponse>>('/exec', { params });
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Error al obtener ventas');
  }
};