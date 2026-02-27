export interface ReporteProducto {
  id_producto: string;
  nombre: string;
  imagen_url: string;
  categoria: string;
  cantidad_vendida: number;
  total_vendido: number;
  ganancia: number;
}

export interface ReporteRequest {
  id_artista: string;
  fecha_inicio?: string;
  fecha_fin?: string;
}