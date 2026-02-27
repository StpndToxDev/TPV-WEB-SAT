import apiClient from './axiosConfig';
import type { ApiResponse } from '../types/Artist.types';
import type { Producto } from '../types/Product.types';
import type { Inventario } from '../types/Inventory.types';
import type { Venta, DashboardStats } from '../types/Dashboard.types';
import { productService } from './productService';
import { inventoryService } from './inventoryService';

export const dashboardService = {
    obtenerStats: async (): Promise<DashboardStats> => {
        try {
            // Cargar todos los datos en paralelo
            const [productos, inventario, ventas, artistas] = await Promise.all([
                productService.listar(),
                inventoryService.listar(),
                obtenerVentas(),
                obtenerArtistas()
            ]);

            // Calcular totales
            const totalArtistas = artistas.length;
            const totalProductos = productos.length;

            // Procesar ventas por mes
            const ventasPorMes = procesarVentasPorMes(ventas);

            // Calcular top productos
            const topProductos = calcularTopProductos(ventas, productos);

            // Obtener alertas de stock
            const alertasStock = obtenerAlertasStock(productos, inventario);

            // Calcular resumen del mes actual
            const resumenVentas = calcularResumenMes(ventas);

            return {
                totalArtistas,
                totalProductos,
                ventasPorMes,
                topProductos,
                alertasStock,
                resumenVentas
            };
        } catch (error) {
            console.error('Error al obtener stats del dashboard:', error);
            throw error;
        }
    }
};

// Funciones auxiliares
async function obtenerVentas(): Promise<Venta[]> {
    try {
        console.log('🔍 Obteniendo ventas...');
        const response = await apiClient.get<ApiResponse<Venta[]>>('/exec', {
            params: { accion: 'listar_ventas' }
        });
        console.log('✅ Respuesta ventas:', response.data);
        if (response.data.success && response.data.data) {
            return response.data.data;
        }
        return [];
    } catch (error) {
        console.error('❌ Error al obtener ventas:', error);
        return [];
    }
}

async function obtenerArtistas(): Promise<any[]> {
    try {
        const response = await apiClient.get<ApiResponse<any[]>>('/exec', {
            params: { accion: 'listar_artistas' }
        });
        if (response.data.success && response.data.data) {
            return response.data.data;
        }
        return [];
    } catch (error) {
        console.error('Error al obtener artistas:', error);
        return [];
    }
}

function procesarVentasPorMes(ventas: Venta[]): { mes: string; total: number; cantidad: number }[] {
    // Primero, agrupar por id_venta para obtener ventas únicas
    const ventasUnicas: Record<string, Venta[]> = {};

    ventas.forEach(venta => {
        if (!ventasUnicas[venta.id_venta]) {
            ventasUnicas[venta.id_venta] = [];
        }
        ventasUnicas[venta.id_venta].push(venta);
    });

    // Ahora procesamos cada venta única
    const ventasPorMes: Record<string, { total: number; cantidad: number }> = {};

    Object.values(ventasUnicas).forEach(lineasVenta => {
        if (lineasVenta.length === 0) return;

        // Tomamos la primera línea para la fecha (todas tienen la misma)
        const primeraLinea = lineasVenta[0];
        const fecha = new Date(primeraLinea.fecha_hora);

        if (isNaN(fecha.getTime())) {
            console.warn('Fecha inválida:', primeraLinea.fecha_hora);
            return;
        }

        const mesKey = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;

        if (!ventasPorMes[mesKey]) {
            ventasPorMes[mesKey] = { total: 0, cantidad: 0 };
        }

        // Sumar el total de todas las líneas de esta venta
        const totalVenta = lineasVenta.reduce((sum, linea) => sum + linea.subtotal, 0);
        ventasPorMes[mesKey].total += totalVenta;
        ventasPorMes[mesKey].cantidad += 1; // Una venta, no importa cuántas líneas
    });

    const resultado = Object.entries(ventasPorMes)
        .map(([key, value]) => ({
            mes: key,
            total: value.total,
            cantidad: value.cantidad
        }))
        .sort((a, b) => a.mes.localeCompare(b.mes))
        .slice(-6); // Últimos 6 meses

    console.log('Ventas por mes (agrupadas):', resultado);
    return resultado;
}

function calcularTopProductos(ventas: Venta[], productos: Producto[]): any[] {
    const ventasPorProducto: Record<string, { total: number; cantidad: number }> = {};

    ventas.forEach(venta => {
        if (!ventasPorProducto[venta.id_producto]) {
            ventasPorProducto[venta.id_producto] = { total: 0, cantidad: 0 };
        }
        ventasPorProducto[venta.id_producto].total += venta.subtotal;
        ventasPorProducto[venta.id_producto].cantidad += venta.cantidad;
    });

    const resultado = Object.entries(ventasPorProducto)
        .map(([id_producto, stats]) => {
            const producto = productos.find(p => p.id_producto === id_producto);
            return {
                id_producto,
                nombre: producto?.nombre || 'Producto sin nombre',
                totalVendido: stats.total,
                cantidadVendida: stats.cantidad,
                imagen_url: producto?.imagen_url
            };
        })
        .sort((a, b) => b.totalVendido - a.totalVendido)
        .slice(0, 3);

    console.log('Top productos:', resultado);
    return resultado;
}

function calcularResumenMes(ventas: Venta[]) {
    // Agrupar por id_venta para contar ventas únicas
    const ventasUnicas: Record<string, Venta[]> = {};

    ventas.forEach(venta => {
        if (!ventasUnicas[venta.id_venta]) {
            ventasUnicas[venta.id_venta] = [];
        }
        ventasUnicas[venta.id_venta].push(venta);
    });

    const ahora = new Date();
    const mesActual = ahora.getMonth();
    const añoActual = ahora.getFullYear();

    // Ventas del mes actual (únicas)
    const ventasMesActual = Object.values(ventasUnicas).filter(lineasVenta => {
        if (lineasVenta.length === 0) return false;
        const fecha = new Date(lineasVenta[0].fecha_hora);
        return !isNaN(fecha.getTime()) &&
            fecha.getMonth() === mesActual &&
            fecha.getFullYear() === añoActual;
    });

    const mesAnterior = mesActual === 0 ? 11 : mesActual - 1;
    const añoAnterior = mesActual === 0 ? añoActual - 1 : añoActual;

    const ventasMesAnterior = Object.values(ventasUnicas).filter(lineasVenta => {
        if (lineasVenta.length === 0) return false;
        const fecha = new Date(lineasVenta[0].fecha_hora);
        return !isNaN(fecha.getTime()) &&
            fecha.getMonth() === mesAnterior &&
            fecha.getFullYear() === añoAnterior;
    });

    const totalVentasMes = ventasMesActual.length;

    // Sumar ingresos de todas las líneas de las ventas del mes
    const ingresosMes = ventasMesActual.reduce((sum, lineasVenta) =>
        sum + lineasVenta.reduce((subSum, linea) => subSum + linea.subtotal, 0), 0);

    const ingresosMesAnterior = ventasMesAnterior.reduce((sum, lineasVenta) =>
        sum + lineasVenta.reduce((subSum, linea) => subSum + linea.subtotal, 0), 0);

    const variacionPorcentual = ingresosMesAnterior > 0
        ? ((ingresosMes - ingresosMesAnterior) / ingresosMesAnterior) * 100
        : 0;

    return {
        totalVentasMes,
        ingresosMes,
        variacionPorcentual
    };
}

function obtenerAlertasStock(productos: Producto[], inventario: Inventario[]): any[] {
    const alertas: any[] = [];

    inventario.forEach(inv => {
        if (inv.stock_actual <= inv.stock_minimo) {
            const producto = productos.find(p => p.id_producto === inv.id_producto);
            if (producto) {
                alertas.push({
                    id_producto: inv.id_producto,
                    nombre: producto.nombre,
                    talla: inv.talla,
                    stock_actual: inv.stock_actual,
                    stock_minimo: inv.stock_minimo,
                    imagen_url: producto.imagen_url,
                    categoria: producto.categoria
                });
            }
        }
    });

    return alertas.sort((a, b) => a.stock_actual - b.stock_actual);
}
