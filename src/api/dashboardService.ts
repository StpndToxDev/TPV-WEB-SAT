// src/api/dashboardService.ts
import { supabase } from './supabaseClient';
import type { Producto } from '../types/Product.types';
import type { Inventario } from '../types/Inventory.types';
import type { Artist } from '../types/Artist.types';  // ← CAMBIADO: Artist en lugar de Artista
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

// Funciones auxiliares - AHORA USAN SUPABASE
async function obtenerVentas(): Promise<Venta[]> {
    try {
        console.log('🔍 Obteniendo ventas desde Supabase...');
        
        // CORREGIDO: Ordenar por fecha_hora de ventas, no de ventas_detalle
        const { data, error } = await supabase
            .from('ventas_detalle')
            .select(`
                id_venta,
                id_producto,
                talla,
                cantidad,
                precio_unitario,
                subtotal,
                ventas (
                    fecha_hora,
                    metodo_pago,
                    notas
                )
            `);

        if (error) throw error;

        if (!data) return [];

        // Transformar al formato Venta esperado
        const ventas: Venta[] = data.map(item => {
            const ventaInfo = Array.isArray(item.ventas) ? item.ventas[0] : item.ventas;
            
            return {
                id_venta: item.id_venta,
                fecha_hora: ventaInfo?.fecha_hora || new Date().toISOString(),
                id_producto: item.id_producto,
                talla: item.talla,
                cantidad: item.cantidad,
                precio_unitario: item.precio_unitario,
                subtotal: item.subtotal,
                metodo_pago: ventaInfo?.metodo_pago || '',
                notas: ventaInfo?.notas || ''
            };
        });

        // Ordenar después de obtener los datos
        ventas.sort((a, b) => new Date(b.fecha_hora).getTime() - new Date(a.fecha_hora).getTime());

        console.log('✅ Ventas obtenidas:', ventas.length);
        return ventas;
    } catch (error) {
        console.error('❌ Error al obtener ventas:', error);
        return [];
    }
}

async function obtenerArtistas(): Promise<Artist[]> {  // ← CAMBIADO: Artist
    try {
        const { data, error } = await supabase
            .from('artistas')
            .select('*')
            .order('nombre');

        if (error) throw error;

        return data || [];
    } catch (error) {
        console.error('Error al obtener artistas:', error);
        return [];
    }
}

// Las funciones de procesamiento NO CAMBIAN
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