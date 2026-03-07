// src/api/reportService.ts
import { supabase } from './supabaseClient';
import type { ReporteProducto, ReporteRequest } from '../types/Report.types';

export const reportService = {
    obtenerReporteArtista: async (params: ReporteRequest): Promise<ReporteProducto[]> => {
        try {
            console.log('🔍 Generando reporte para artista:', params);

            // Construir query base
            let query = supabase
                .from('ventas_detalle')
                .select(`
                    id_producto,
                    cantidad,
                    subtotal,
                    ventas!inner (
                        fecha_hora
                    ),
                    productos!inner (
                        nombre,
                        imagen_url,
                        categoria,
                        id_artista,
                        ganancia_artista
                    )
                `)
                .eq('productos.id_artista', params.id_artista);

            // Aplicar filtros de fecha si existen
            if (params.fecha_inicio) {
                query = query.gte('ventas.fecha_hora', params.fecha_inicio);
            }
            if (params.fecha_fin) {
                // Agregar un día para incluir todo el día de fecha_fin
                const fechaFin = new Date(params.fecha_fin);
                fechaFin.setDate(fechaFin.getDate() + 1);
                query = query.lt('ventas.fecha_hora', fechaFin.toISOString().split('T')[0]);
            }

            const { data, error } = await query;

            if (error) throw error;

            if (!data || data.length === 0) {
                return [];
            }

            // Procesar los datos para agrupar por producto
            const productosMap = new Map<string, ReporteProducto>();

            data.forEach(item => {
                const idProducto = item.id_producto;
                // CORREGIDO: productos es un array, tomamos el primer elemento
                const productoInfo = Array.isArray(item.productos) ? item.productos[0] : item.productos;
                
                // Verificar que productoInfo existe
                if (!productoInfo) return;

                if (!productosMap.has(idProducto)) {
                    productosMap.set(idProducto, {
                        id_producto: idProducto,
                        nombre: productoInfo.nombre || 'Producto sin nombre',
                        imagen_url: productoInfo.imagen_url || '',
                        categoria: productoInfo.categoria || 'Sin categoría',
                        cantidad_vendida: 0,
                        total_vendido: 0,
                        ganancia: 0
                    });
                }

                const prod = productosMap.get(idProducto)!;
                prod.cantidad_vendida += item.cantidad || 0;
                prod.total_vendido += item.subtotal || 0;
                
                // Calcular ganancia (ganancia_artista * cantidad)
                const gananciaUnidad = parseFloat(productoInfo.ganancia_artista) || 0;
                prod.ganancia += gananciaUnidad * (item.cantidad || 0);
            });

            // Convertir a array y ordenar por total vendido (de mayor a menor)
            const resultado = Array.from(productosMap.values())
                .sort((a, b) => b.total_vendido - a.total_vendido);

            console.log('✅ Reporte generado:', resultado);
            return resultado;
        } catch (error) {
            console.error('❌ Error al obtener reporte de artista:', error);
            throw new Error(error instanceof Error ? error.message : 'Error al obtener reporte');
        }
    }
};