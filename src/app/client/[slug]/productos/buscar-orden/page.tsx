import { getClientBySlug } from "@/services/clientService"
import { getOrderData } from "@/services/fenicio-services"
import { Orden } from "../ordenes/types"
import BuscadorOrden from "./buscador"
import ResultadoOrden from "./resultado-orden"

type Props = {
  params: {
    slug: string
  },
  searchParams: {
    ordenId?: string
    raw?: string
  }
}

// Forzar que la página siempre se renderice dinámicamente
export const dynamic = 'force-dynamic'

export default async function BuscarOrden({ params, searchParams }: Props) {
    const { slug } = params
    const { ordenId, raw } = searchParams
    
    // Convertir el parámetro raw a booleano
    const showRawJson = raw === 'true'
    
    // Obtener datos del cliente
    const client = await getClientBySlug(params.slug)
    if (!client) {
        return <div>Cliente no encontrado</div>
    }
    
    // Variables para el estado de la consulta
    let orden: Orden | undefined = undefined
    let error: string | undefined = undefined
    // En un RSC, el estado de carga no es perceptible para el usuario,
    // ya que la página se renderiza completamente en el servidor antes de enviarse al cliente
    let cargando = false
    
    // Si hay un ordenId en la URL, consultar la orden
    if (ordenId) {
        try {
            const respuesta = await getOrderData(client.id, ordenId)
            
            if (respuesta.error) {
                error = respuesta.msj || "Error desconocido al consultar la orden"
            } else if (respuesta.orden) {
                orden = respuesta.orden
            }
        } catch (err: any) {
            error = `Error al consultar la orden: ${err.message}`
            console.error(`❌ Error no manejado al consultar orden ${ordenId}:`, err)
        }
    }
    
    return (
        <div className="container mx-auto py-6 space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">Buscar Orden</h1>
            
            {/* Componente de búsqueda (client component) */}
            <BuscadorOrden slug={slug} />
            
            {/* Resultado de la búsqueda */}
            <div className="bg-card p-4 rounded-md shadow">
                <ResultadoOrden 
                    ordenId={ordenId}
                    orden={orden}
                    cargando={cargando}
                    error={error}
                    raw={showRawJson}
                />
            </div>
        </div>
    )
}