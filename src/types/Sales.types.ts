export interface VentaItem {
  id_venta: string;
  fecha_hora: string;
  id_producto: string;
  nombre_producto: string;
  talla: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  metodo_pago: string;
  notas: string;
  nombre_artista: string;
  ganancia_producto: number;
}

export interface VentaResumen {
  id_venta: string;
  fecha_hora: string;
  metodo_pago: string;
  total: number;
  productos: VentaItem[];
}

export interface VentasResponse {
  resumen: VentaResumen[];
  detalle: VentaItem[];
}