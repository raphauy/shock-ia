import { getClientBySlug } from "@/services/clientService"
import { formatCurrency } from "@/lib/utils"
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { toZonedTime } from 'date-fns-tz'
import CheckOrdersButton from './check-orders-button'
import AbandonedOrdersStats from './stats'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Send, Settings } from "lucide-react"
import Link from "next/link"
import SendReminderButton from './send-reminder-button'
import { AbandonedOrderStatus } from "@/lib/generated/prisma"
import { getAbandonedOrdersByClientId } from "@/services/abandoned-orders-service"
import Pagination from '../components/pagination'
import SearchFilter from './search-filter'
import { Card } from "@/components/ui/card"

// Forzar que la página siempre se renderice dinámicamente
export const dynamic = 'force-dynamic'

// Tipo para las variantes de badge disponibles en nuestro sistema
type BadgeVariant = 'statusPendiente' | 'statusProgramado' | 'statusEnviado' | 'secondary' | 'statusError'

// Mapa de variantes de badge según el status
const statusVariantMap: Record<AbandonedOrderStatus, BadgeVariant> = {
    'PENDIENTE': 'statusPendiente',
    'RECORDATORIO_PROGRAMADO': 'statusProgramado',
    'RECORDATORIO_ENVIADO': 'statusEnviado',
    'EXPIRADA': 'secondary',
    'ERROR': 'statusError'
}

// Mapa de textos a mostrar para cada status
const statusTextMap: Record<AbandonedOrderStatus, string> = {
    'PENDIENTE': 'Pendiente',
    'RECORDATORIO_PROGRAMADO': 'Programado',
    'RECORDATORIO_ENVIADO': 'Enviado',
    'EXPIRADA': 'Expirada',
    'ERROR': 'Error'
}

// Formatear fecha para mostrar en la UI ajustada al timezone de Montevideo
const formatearFecha = (fecha: Date) => {
    try {
        // Asegurarnos de que estamos trabajando con un objeto Date
        const fechaObj = fecha instanceof Date ? fecha : new Date(fecha);
        
        // Convertir a timezone de Montevideo
        const timeZone = 'America/Montevideo'
        const fechaMontevideo = toZonedTime(fechaObj, timeZone)
        
        // Formatear la fecha ya ajustada al timezone correcto
        return format(fechaMontevideo, "dd MMM yyyy, HH:mm", { locale: es })
    } catch (e) {
        console.error("Error al formatear fecha:", e, "Fecha original:", fecha)
        // Fallback a formato simple, intentando convertir a Date si es necesario
        try {
            const fechaObj = fecha instanceof Date ? fecha : new Date(fecha);
            return format(fechaObj, "dd/MM/yyyy HH:mm")
        } catch {
            return "Fecha inválida"
        }
    }
}

type Props = {
    params: {
        slug: string
    },
    searchParams: {
        page?: string,
        filter?: string
    }
}

// Componente para mostrar el badge de estado y su información adicional
type StatusBadgeProps = {
    status: AbandonedOrderStatus;
    fechaRecordatorio?: Date | null;
    fechaRecuperada?: Date | null;
    error?: string | null;
}

function StatusBadge({ status, fechaRecordatorio, fechaRecuperada, error }: StatusBadgeProps) {
    return (
        <div className="space-y-1">
            <Badge variant={statusVariantMap[status]}>
                {statusTextMap[status]}
            </Badge>
            
            {/* Información adicional según el estado */}
            {status === 'RECORDATORIO_PROGRAMADO' && fechaRecordatorio && (
                <div className="text-xs text-muted-foreground">
                    Para: {formatearFecha(fechaRecordatorio)}
                </div>
            )}
            
            {status === 'RECORDATORIO_ENVIADO' && fechaRecuperada && (
                <div className="text-xs text-muted-foreground">
                    Enviado: {formatearFecha(fechaRecuperada)}
                </div>
            )}
            
            {status === 'EXPIRADA' && fechaRecuperada && (
                <div className="text-xs text-muted-foreground">
                    Expirada: {formatearFecha(fechaRecuperada)}
                </div>
            )}
            
            {status === 'ERROR' && (
                <div className="text-xs text-destructive max-w-[200px] truncate" title={error || "Error desconocido"}>
                    {error || "Error desconocido"}
                </div>
            )}
        </div>
    );
}

export default async function AbandonadasPage({ params, searchParams }: Props) {
    const { slug } = params
    const client = await getClientBySlug(slug)
    
    if (!client) {
        return (
            <div className="container mx-auto py-6">
                <div className="bg-destructive/20 p-4 rounded-md">
                    <p className="text-destructive font-medium">Cliente no encontrado</p>
                </div>
            </div>
        )
    }
    
    // Obtener el número de página de los parámetros de búsqueda
    const currentPage = searchParams.page ? parseInt(searchParams.page) : 1
    
    // Obtener el filtro de búsqueda
    const filter = searchParams.filter || ""
    
    // Definir el número de elementos por página
    const itemsPerPage = 20
    
    // Obtener las órdenes abandonadas utilizando la capa de servicios con paginación y filtro
    const { data: abandonedOrders, meta } = await getAbandonedOrdersByClientId(
        client.id, 
        currentPage, 
        itemsPerPage,
        filter
    );
    
    // Obtener todas las órdenes (sin paginación) para estadísticas
    const allOrdersResponse = await getAbandonedOrdersByClientId(client.id, 1, 1000); // Usar un límite alto
    const allOrders = allOrdersResponse.data;
    
    return (
        <div className="container mx-auto py-6 space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Órdenes Abandonadas</h1>
                <div className="flex items-center gap-2">
                    <Link href={`/client/${slug}/productos/config`}>
                        <Button variant="outline" size="sm">
                            <Settings className="h-4 w-4 mr-2" />
                            Configurar
                        </Button>
                    </Link>
                    <CheckOrdersButton clientId={client.id} />
                </div>
            </div>
            
            {/* Estadísticas */}
            {allOrders.length > 0 && (
                <AbandonedOrdersStats orders={allOrders} />
            )}
            
            {/* Filtros */}
            <Card className="p-4">
                <SearchFilter initialFilter={filter} />
            </Card>
            
            {/* Resultados del filtro */}
            {filter && (
                <div className="text-sm text-muted-foreground">
                    <span className="font-medium">{meta.totalItems}</span> resultados para la búsqueda <span className="font-medium">&ldquo;{filter}&rdquo;</span>
                </div>
            )}
            
            {abandonedOrders.length === 0 ? (
                <div className="bg-card p-8 rounded-md shadow text-center">
                    {filter ? (
                        <p className="text-muted-foreground">No se encontraron órdenes abandonadas que coincidan con &ldquo;{filter}&rdquo;</p>
                    ) : (
                        <p className="text-muted-foreground">No se encontraron órdenes abandonadas</p>
                    )}
                </div>
            ) : (
                <>
                    <div className="rounded-md border">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>ID</TableHead>
                                        <TableHead>Cliente</TableHead>
                                        <TableHead>Fecha de inicio</TableHead>
                                        <TableHead>Fecha de abandono</TableHead>
                                        <TableHead>Productos</TableHead>
                                        <TableHead>Total</TableHead>
                                        <TableHead>Estado</TableHead>
                                        <TableHead className="text-center">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {abandonedOrders.map((order) => (
                                        <TableRow key={order.id}>
                                            <TableCell className="font-medium">{order.externalId}</TableCell>
                                            <TableCell>
                                                {
                                                    order.conversationId ? (
                                                        <Link href={`/client/${slug}/chats?id=${order.conversationId}`} target="_blank">
                                                            <Button variant="link" className="p-0">                                                                
                                                                {order.compradorNombre}
                                                            </Button>
                                                        </Link>
                                                    ) : (
                                                        <p>{order.compradorNombre}</p>
                                                    )
                                                }
                                                {order.compradorTelefono && (
                                                    <div className="text-xs text-muted-foreground">{order.compradorTelefono}</div>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {formatearFecha(order.fechaInicio)}
                                            </TableCell>
                                            <TableCell>
                                                {formatearFecha(order.fechaAbandono)}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {order.productos?.length || 0}
                                            </TableCell>
                                            <TableCell>
                                                {formatCurrency(Number(order.importeTotal))}
                                            </TableCell>
                                            <TableCell>
                                                <StatusBadge
                                                    status={order.status as AbandonedOrderStatus}
                                                    fechaRecordatorio={order.fechaRecordatorio}
                                                    fechaRecuperada={
                                                        (order.status === 'RECORDATORIO_ENVIADO' || 
                                                        order.status === 'EXPIRADA') ? 
                                                        order.updatedAt : null
                                                    }
                                                    error={order.error}
                                                />
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {order.status === 'PENDIENTE' && (
                                                    <SendReminderButton orderId={order.id} />
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                    
                    {/* Paginación */}
                    {meta.totalPages > 1 && (
                        <Pagination
                            totalItems={meta.totalItems}
                            itemsPerPage={meta.itemsPerPage}
                            currentPage={meta.currentPage}
                            siblingsCount={1}
                        />
                    )}
                </>
            )}
        </div>
    )
}