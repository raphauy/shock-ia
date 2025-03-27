import { PackageX, Package, Loader, ShieldAlert } from "lucide-react"
import { Orden } from "../ordenes/types"
import OrdenCardSimple from "./orden-card-simple"
import CodeBlock from "@/components/code-block"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface ResultadoOrdenProps {
  ordenId?: string
  orden?: Orden
  cargando: boolean
  error?: string
}

export default function ResultadoOrden({ ordenId, orden, cargando, error }: ResultadoOrdenProps) {
  // Si no hay ordenId, mostrar mensaje inicial
  if (!ordenId) {
    return (
      <div className="flex flex-col items-center justify-center py-12 bg-card shadow rounded-md">
        <div className="bg-muted p-3 rounded-full">
          <Package className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="mt-4 text-lg font-medium">Busca una orden para ver sus detalles</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Ingresa el ID de la orden en el campo de búsqueda arriba
        </p>
      </div>
    )
  }

  // Si está cargando, mostrar loader
  if (cargando) {
    return (
      <div className="flex flex-col items-center justify-center py-12 bg-card shadow rounded-md">
        <div className="animate-pulse flex flex-col items-center space-y-4">
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
            <Loader className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
          <div className="h-4 w-48 bg-muted rounded"></div>
          <div className="h-3 w-36 bg-muted rounded"></div>
        </div>
        <p className="mt-6 text-muted-foreground">Consultando orden {ordenId}...</p>
      </div>
    )
  }

  // Si hay un error, mostrarlo
  if (error) {
    const isAccessDenied = error.includes("Acceso denegado")

    return (
      <div className="flex flex-col items-center justify-center py-12 bg-card shadow rounded-md">
        <div className={`${isAccessDenied ? 'bg-orange-100 dark:bg-orange-950/30' : 'bg-destructive/10'} p-3 rounded-full`}>
          {isAccessDenied ? (
            <ShieldAlert className="h-8 w-8 text-orange-500 dark:text-orange-400" />
          ) : (
            <PackageX className="h-8 w-8 text-destructive" />
          )}
        </div>
        <h3 className="mt-4 text-lg font-medium">
          {isAccessDenied ? 'Acceso restringido' : 'Error al consultar orden'}
        </h3>
        <p className="mt-2 text-sm text-muted-foreground max-w-md text-center">
          {error}
        </p>
        {isAccessDenied && (
          <div className="mt-4 text-xs text-muted-foreground max-w-sm text-center">
            Es posible que necesites solicitar permisos adicionales para ver esta orden.
          </div>
        )}
      </div>
    )
  }

  // Si no se encontró la orden
  if (!orden) {
    return (
      <div className="flex flex-col items-center justify-center py-12 bg-card shadow rounded-md">
        <div className="bg-muted p-3 rounded-full">
          <PackageX className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="mt-4 text-lg font-medium">Orden no encontrada</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          No se encontró ninguna orden con el ID {ordenId}
        </p>
      </div>
    )
  }

  // Si hay una orden, mostrarla
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">
        Detalles de la Orden
      </h2>
      
      <Tabs defaultValue="vista">
        <TabsList className="mb-4">
          <TabsTrigger value="vista">Vista Formateada</TabsTrigger>
          <TabsTrigger value="json">JSON Raw (Lo que recibe el LLM)</TabsTrigger>
        </TabsList>
        
        <TabsContent value="vista">
          <OrdenCardSimple orden={orden} />
        </TabsContent>
        
        <TabsContent value="json">
          <div className="border rounded-lg overflow-hidden shadow-sm">
            <div className="bg-muted p-4">
              <h3 className="font-mono text-sm">Respuesta de la API (raw)</h3>
            </div>
            <div className="max-h-[600px] overflow-auto">
              <CodeBlock 
                code={JSON.stringify(orden, null, 2)} 
                showLineNumbers={true} 
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
} 