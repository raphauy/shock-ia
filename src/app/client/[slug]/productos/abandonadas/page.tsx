import { getClientBySlug } from "@/services/clientService"
import { prisma } from "@/lib/db"
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

// Forzar que la página siempre se renderice dinámicamente
export const dynamic = 'force-dynamic'

// Formatear fecha para mostrar en la UI ajustada al timezone de Montevideo
const formatearFecha = (fecha: Date) => {
    try {
        // Convertir a timezone de Montevideo
        const timeZone = 'America/Montevideo'
        const fechaMontevideo = toZonedTime(fecha, timeZone)
        
        // Formatear la fecha ya ajustada al timezone correcto
        return format(fechaMontevideo, "dd MMM yyyy, HH:mm", { locale: es })
    } catch (e) {
        console.error("Error al formatear fecha:", e)
        // Fallback a formato simple
        return format(fecha, "dd/MM/yyyy HH:mm")
    }
}

type Props = {
    params: {
        slug: string
    }
}

export default async function AbandonadasPage({ params }: Props) {
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
    
    // Obtener las órdenes abandonadas de la base de datos
    const abandonedOrders = await prisma.abandonedOrder.findMany({
        where: {
            clientId: client.id
        },
        orderBy: {
            fechaAbandono: 'desc'
        }
    })
    
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
            {abandonedOrders.length > 0 && (
                <AbandonedOrdersStats orders={abandonedOrders} />
            )}
            
            {abandonedOrders.length === 0 ? (
                <div className="bg-card p-8 rounded-md shadow text-center">
                    <p className="text-muted-foreground">No se encontraron órdenes abandonadas</p>
                </div>
            ) : (
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
                                            <div className="font-medium">{order.compradorNombre}</div>
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
                                            {order.status === 'PENDIENTE' && (
                                                <Badge
                                                    variant="statusPendiente"
                                                >
                                                    Pendiente
                                                </Badge>
                                            )}
                                            {order.status === 'RECORDATORIO_ENVIADO' && (
                                                <Badge
                                                    variant="statusEnviado"
                                                >
                                                    Recordatorio enviado
                                                </Badge>
                                            )}
                                            {order.status === 'ERROR' && (
                                                <Badge
                                                    variant="statusError"
                                                >
                                                    Error
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {order.status === 'PENDIENTE' && (
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="h-8 w-8 text-primary hover:text-primary/80"
                                                    title="Enviar recordatorio"
                                                >
                                                    <Send className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            )}
        </div>
    )
}