export interface DashboardStats {
  totalArtistas: number;
  totalProductos: number;
  ventasPorMes: {
    mes: string;
    total: number;
    cantidad: number;
  }[];
  topProductos: {
    id_producto: string;
    nombre: string;
    totalVendido: number;
    cantidadVendida: number;
    imagen_url?: string;
  }[];
  alertasStock: {
    id_producto: string;
    nombre: string;
    talla: string;
    stock_actual: number;
    stock_minimo: number;
    imagen_url?: string;
    categoria: string;
  }[];
  resumenVentas: {
    totalVentasMes: number;
    ingresosMes: number;
    variacionPorcentual: number;
  };
}

export interface Venta {
  id_venta: string;
  fecha_hora: string;
  id_producto: string;
  talla: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  metodo_pago: string;
  notas?: string;
}