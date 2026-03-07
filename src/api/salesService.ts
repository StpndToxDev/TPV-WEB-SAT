// src/api/salesService.ts
import { supabase } from './supabaseClient';
import type { VentasResponse, VentaResumen, VentaItem } from '../types/Sales.types';

export const salesService = {
    obtenerVentas: async (fechaInicio?: string, fechaFin?: string): Promise<VentasResponse> => {
        try {
            console.log('🔍 Obteniendo ventas desde Supabase...');

            // Construir query base para ventas con sus detalles
            let query = supabase
                .from('ventas')
                .select(`
                    id_venta,
                    fecha_hora,
                    metodo_pago,
                    notas,
                    ventas_detalle (
                        id_venta,
                        id_producto,
                        talla,
                        cantidad,
                        precio_unitario,
                        subtotal,
                        productos (
                            nombre,
                            categoria,
                            ganancia_artista
                        )
                    )
                `)
                .order('fecha_hora', { ascending: false });

            // Aplicar filtros de fecha si existen
            if (fechaInicio) {
                query = query.gte('fecha_hora', fechaInicio);
            }
            if (fechaFin) {
                // Agregar un día para incluir todo el día de fecha_fin
                const fechaFinDate = new Date(fechaFin);
                fechaFinDate.setDate(fechaFinDate.getDate() + 1);
                query = query.lt('fecha_hora', fechaFinDate.toISOString().split('T')[0]);
            }

            const { data: ventas, error } = await query;

            if (error) throw error;

            if (!ventas || ventas.length === 0) {
                return { resumen: [], detalle: [] };
            }

            // Obtener artistas para enriquecer los datos
            const { data: artistas } = await supabase
                .from('artistas')
                .select('id_artista, nombre');

            const artistasMap = new Map(artistas?.map(a => [a.id_artista, a.nombre]) || []);

            // Procesar ventas para obtener resumen y detalle
            const resumen: VentaResumen[] = [];
            const detalle: VentaItem[] = [];

            ventas.forEach(venta => {
                const ventaInfo = venta;
                const detalles = venta.ventas_detalle || [];

                // Calcular total de la venta
                const totalVenta = detalles.reduce((sum, det) => sum + (det.subtotal || 0), 0);

                // Crear items de detalle para esta venta
                const productosVenta: VentaItem[] = detalles.map(det => {
                    const productoInfo = Array.isArray(det.productos) ? det.productos[0] : det.productos;
                    
                    return {
                        id_venta: venta.id_venta,
                        fecha_hora: venta.fecha_hora,
                        id_producto: det.id_producto,
                        nombre_producto: productoInfo?.nombre || 'Producto desconocido',
                        talla: det.talla || 'UNICA',
                        cantidad: det.cantidad || 0,
                        precio_unitario: det.precio_unitario || 0,
                        subtotal: det.subtotal || 0,
                        metodo_pago: venta.metodo_pago || '',
                        notas: venta.notas || '',
                        nombre_artista: '', // Se llenará después
                        ganancia_producto: (parseFloat(productoInfo?.ganancia_artista) || 0) * (det.cantidad || 0)
                    };
                });

                // Agregar al detalle general
                detalle.push(...productosVenta);

                // Crear resumen de venta
                resumen.push({
                    id_venta: venta.id_venta,
                    fecha_hora: venta.fecha_hora,
                    metodo_pago: venta.metodo_pago || '',
                    total: totalVenta,
                    productos: productosVenta
                });
            });

            // Enriquecer con nombres de artistas
            // Para cada item en detalle, necesitamos el id_artista del producto
            // Esto requeriría otra consulta o podríamos haberlo incluido en la consulta original
            
            // Opción: Obtener todos los productos con su id_artista
            const { data: productos } = await supabase
                .from('productos')
                .select('id_producto, id_artista');

            const productosMap = new Map(productos?.map(p => [p.id_producto, p.id_artista]) || []);

            // Enriquecer detalle con nombre de artista
            const detalleEnriquecido = detalle.map(item => {
                const idArtista = productosMap.get(item.id_producto);
                return {
                    ...item,
                    nombre_artista: idArtista ? artistasMap.get(idArtista) || 'Artista desconocido' : 'Artista desconocido'
                };
            });

            // Actualizar los productos en resumen con los nombres de artista
            const resumenEnriquecido = resumen.map(venta => ({
                ...venta,
                productos: venta.productos.map(prod => {
                    const idArtista = productosMap.get(prod.id_producto);
                    return {
                        ...prod,
                        nombre_artista: idArtista ? artistasMap.get(idArtista) || 'Artista desconocido' : 'Artista desconocido'
                    };
                })
            }));

            console.log('✅ Ventas obtenidas:', resumenEnriquecido.length);
            return {
                resumen: resumenEnriquecido,
                detalle: detalleEnriquecido
            };
        } catch (error) {
            console.error('❌ Error al obtener ventas:', error);
            throw new Error(error instanceof Error ? error.message : 'Error al obtener ventas');
        }
    }
};