import apiClient from './axiosConfig';
import type { ApiResponse } from '../types/Artist.types';
import type { ReporteProducto, ReporteRequest } from '../types/Report.types';

export const reportService = {
  obtenerReporteArtista: async (params: ReporteRequest): Promise<ReporteProducto[]> => {
    const queryParams = new URLSearchParams({
      accion: 'reporte_ventas_artista',
      id_artista: params.id_artista
    });
    
    if (params.fecha_inicio) {
      queryParams.append('fecha_inicio', params.fecha_inicio);
    }
    if (params.fecha_fin) {
      queryParams.append('fecha_fin', params.fecha_fin);
    }
    
    const response = await apiClient.get<ApiResponse<ReporteProducto[]>>('/exec', {
      params: queryParams
    });
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Error al obtener reporte');
  }
};