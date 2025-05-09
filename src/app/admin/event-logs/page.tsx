import { getDatesFromSearchParams } from "@/lib/utils"
import { 
  getFilteredEventLogs, 
  getAllEventTypes, 
  getAllClientNames
} from "@/services/event-log-services"
import EventLogList from "./event-log-list"
import { Suspense } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import DateRangeFilter from "@/components/filters/date-range-filter"
import SelectFilter from "@/components/filters/select-filter"
import SearchFilter from "@/components/filters/search-filter"

type Props = {
  searchParams: Promise<{
    from: string
    to: string
    last: string
    eventType: string
    clientName: string
    metadataSearch: string
    page: string
  }>
}

export default async function EventLogsPage(props: Props) {
  const searchParams = await props.searchParams;
  // Obtener fechas de los parámetros de búsqueda
  const { from, to } = getDatesFromSearchParams(searchParams)

  // Obtener filtros adicionales
  const eventType = searchParams.eventType ?? undefined
  const clientName = searchParams.clientName ?? undefined
  const metadataSearch = searchParams.metadataSearch ?? undefined

  // Paginación
  const page = searchParams.page ? parseInt(searchParams.page) : 1
  const limit = 20
  const offset = (page - 1) * limit

  // Cargar datos para selectores
  const allEventTypes = await getAllEventTypes()
  const allClientNames = await getAllClientNames()

  // Cargar logs filtrados
  const { eventLogs, total } = await getFilteredEventLogs({
    eventType,
    clientName,
    metadataSearch,
    from: from || undefined,
    to: to || undefined,
    limit,
    offset
  })

  const baseUrl = `/admin/event-logs`
  const totalPages = Math.ceil(total / limit)

  return (
    <div className="container mx-auto p-4 max-w-screen-2xl">
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-center">Registros de Eventos del Sistema</h1>
        
        {/* Tarjeta de filtros con componentes reutilizables */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Período de tiempo</h3>
                <DateRangeFilter basePath={baseUrl} />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Cliente</h3>
                  <SelectFilter
                    basePath={baseUrl}
                    paramName="clientName"
                    options={allClientNames}
                    placeholder="Todos los clientes"
                  />
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Tipo de evento</h3>
                  <SelectFilter
                    basePath={baseUrl}
                    paramName="eventType"
                    options={allEventTypes}
                    placeholder="Todos los tipos"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Buscar en metadata</h3>
                <SearchFilter
                  basePath={baseUrl}
                  paramName="metadataSearch"
                  placeholder="Buscar en JSON..."
                />
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Información de resultados y paginación */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Mostrando {eventLogs.length} de {total} registros
          </div>
          
          {/* Paginación */}
          {totalPages > 1 && (
            <div className="flex justify-end gap-2">
              {page > 1 && (
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                >
                  <a href={`${baseUrl}?page=${page - 1}&eventType=${eventType || ''}&clientName=${clientName || ''}&metadataSearch=${metadataSearch || ''}&from=${from?.toISOString() || ''}&to=${to?.toISOString() || ''}`}>
                    Anterior
                  </a>
                </Button>
              )}
              
              <span className="flex items-center px-2 text-sm">
                Página {page} de {totalPages}
              </span>
              
              {page < totalPages && (
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                >
                  <a href={`${baseUrl}?page=${page + 1}&eventType=${eventType || ''}&clientName=${clientName || ''}&metadataSearch=${metadataSearch || ''}&from=${from?.toISOString() || ''}&to=${to?.toISOString() || ''}`}>
                    Siguiente
                  </a>
                </Button>
              )}
            </div>
          )}
        </div>
        
        {/* Lista de logs */}
        <Suspense fallback={<div>Cargando...</div>}>
          <EventLogList eventLogs={eventLogs} />
        </Suspense>
      </div>
    </div>
  )
}
