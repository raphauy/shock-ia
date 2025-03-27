import { getClientBySlug } from "@/services/clientService"
import { getFeedURL } from "@/services/product-services"
import axios from "axios"
import { HttpProxyAgent } from "http-proxy-agent"
import { HttpsProxyAgent } from "https-proxy-agent"
import { OrdenesResponse } from "./types"
import OrdenCard from "./orden-card"
import Filtros from "./filtros"
import Paginacion from "./paginacion"
import EstadoCarga from "./estado-carga"

// Forzar que la página siempre se renderice dinámicamente
export const dynamic = 'force-dynamic'

type Props = {
    params: {
        slug: string
    }
    searchParams: { 
        pagina?: string
        estado?: string
        estadoEntrega?: string
        fDesde?: string
        fHasta?: string
        cliente?: string
        incluirAtributosProducto?: string
    }
}

export default async function OrdersPage({ params, searchParams }: Props) {
    const { slug } = params
    const client = await getClientBySlug(slug)
    
    // Parámetros de paginación y filtros
    const pagina = searchParams.pagina ? parseInt(searchParams.pagina) : 1
    const estado = searchParams.estado === "TODAS" ? undefined : searchParams.estado
    const estadoEntrega = searchParams.estadoEntrega === "TODOS" ? undefined : searchParams.estadoEntrega
    const fDesde = searchParams.fDesde || undefined
    const fHasta = searchParams.fHasta || undefined
    const cliente = searchParams.cliente || undefined
    const incluirAtributosProducto = searchParams.incluirAtributosProducto || undefined
    
    // Obtener la URL del feed
    const feedURL = await getFeedURL(client?.id || "")
    
    let apiBaseEndpoint = ""
    let ordenesEndpoint = ""
    if (feedURL) {
        // Extraer el dominio de la URL del feed
        const feedDomain = new URL(feedURL).origin
        // Construir el endpoint base de la API
        apiBaseEndpoint = `${feedDomain}/API_V1`
        // Construir el endpoint específico para órdenes
        ordenesEndpoint = `${apiBaseEndpoint}/ordenes`
    }

    // Configurar el proxy HTTP para todos los entornos
    let httpProxyAgent = undefined
    let httpsProxyAgent = undefined
    const proxyUrl = process.env.PROXY_URL
    if (proxyUrl) {
        httpProxyAgent = new HttpProxyAgent(proxyUrl)
        httpsProxyAgent = new HttpsProxyAgent(proxyUrl)
        console.log("🧪 Usando proxy HTTP configurado en variables de entorno")
    } else {
        console.log("⚠️ No se encontró la URL del proxy en las variables de entorno (PROXY_URL)")
    }

    let ordenesData: OrdenesResponse | null = null
    let ordenesError = null
    let cargando = true

    // Intentar acceder al endpoint de órdenes con parámetros
    if (ordenesEndpoint) {
        try {
            // Construir parámetros de consulta
            const params = new URLSearchParams()
            params.append('pag', pagina.toString())
            params.append('tot', '50') // 50 órdenes por página
            
            // Agregar filtros opcionales si están definidos
            if (estado) params.append('estado', estado)
            if (estadoEntrega) params.append('estadoEntrega', estadoEntrega)
            if (fDesde) params.append('fDesde', fDesde)
            if (fHasta) params.append('fHasta', fHasta)
            if (cliente) params.append('cliente', cliente)
            if (incluirAtributosProducto) params.append('incluirAtributosProducto', incluirAtributosProducto)
            
            const ordenesUrl = `${ordenesEndpoint}?${params.toString()}`
            console.log(`🔍 Consultando órdenes: página ${pagina}, filtros: ${estado ? `estado=${estado}` : ''}${estadoEntrega ? `, entrega=${estadoEntrega}` : ''}${cliente ? `, cliente=${cliente}` : ''}`)
            
            const response = await axios.get(ordenesUrl, {
                httpAgent: httpProxyAgent,
                httpsAgent: httpsProxyAgent,
                headers: {
                    'Accept': 'application/json'
                },
                timeout: 10000
            })
            
            ordenesData = response.data as OrdenesResponse
            
            // Verificar si la respuesta indica acceso denegado
            if (ordenesData.error && ordenesData.msj?.includes("Acceso denegado")) {
                console.error("❌ Acceso denegado al endpoint de órdenes")
                ordenesError = "Acceso denegado: No tienes permisos para acceder a las órdenes de este cliente. Contacta al administrador para solicitar acceso."
                ordenesData = null
            }
            // Resumen simple de los datos obtenidos si no hay error
            else if (ordenesData.ordenes) {
                console.log(`✅ Órdenes recibidas: ${ordenesData.ordenes.length} resultados de un total de ${ordenesData.totAbs || 'desconocido'}`)
            } else {
                console.log("⚠️ No se recibieron órdenes en la respuesta")
            }
            
        } catch (err: any) {
            console.error("❌ Error accediendo al endpoint de órdenes:", err.message)
            ordenesError = `${err.message}${err.response?.status ? ` (Status: ${err.response.status})` : ''}`
        } finally {
            cargando = false
        }
    } else {
        console.log("⚠️ No se pudo obtener la URL del feed para el cliente")
        ordenesError = "No se pudo obtener la URL del feed para el cliente"
        cargando = false
    }

    // Verificar si hay órdenes disponibles
    const hayOrdenes = ordenesData?.ordenes && ordenesData.ordenes.length > 0
    const ordenesVacias = !hayOrdenes && !cargando && !ordenesError
    
    // Verificar si hay más resultados para la paginación
    const hayMasResultados = ordenesData?.ordenes?.length === 50

    return (
        <div className="container mx-auto py-6 space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">Listar Ordenes</h1>
            
            {/* Filtros y buscador */}
            <Filtros slug={slug} searchParams={searchParams} />
            
            {/* Información de órdenes */}
            <div className="bg-card p-4 rounded-md shadow">
                <EstadoCarga 
                    cargando={cargando} 
                    ordenesVacias={ordenesVacias} 
                    error={ordenesError || undefined} 
                />
                
                {ordenesData && hayOrdenes && (
                    <>
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold">
                                Órdenes ({ordenesData.totAbs || 0})
                            </h2>
                        </div>
                        
                        <div className="space-y-4">
                            {ordenesData.ordenes?.map((orden) => (
                                <OrdenCard key={orden.idOrden} orden={orden} />
                            ))}
                        </div>
                        
                        {/* Paginación */}
                        <Paginacion
                            slug={slug}
                            searchParams={searchParams}
                            hayMasResultados={hayMasResultados}
                            paginaActual={pagina}
                            totalItems={ordenesData.totAbs}
                            hayResultadosEnPaginaActual={hayOrdenes}
                        />
                    </>
                )}
            </div>
        </div>
    )
}