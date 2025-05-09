import { getClientBySlug } from "@/services/clientService"
import { getReminderDefinitionsDAO } from "@/services/reminder-definition-services"
import { notFound } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getAbandonedOrdersTemplateId, getAbandonedOrdersExpireTime } from "@/services/abandoned-orders-service"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Settings, ListPlus } from "lucide-react"
import TemplateSelector from "./template-selector"
import ExpireTimeSelector from "./expire-time-selector"
import { getValue } from "@/services/config-services"

// Forzar que la página siempre se renderice dinámicamente
export const dynamic = 'force-dynamic'

type Props = {
  params: Promise<{
    slug: string
  }>
}

export default async function ConfigPage(props: Props) {
  const params = await props.params;
  const { slug } = params
  const client = await getClientBySlug(slug)

  if (!client) {
    return notFound()
  }

  // Obtener las plantillas de recordatorio (past=false for future reminders)
  const templates = await getReminderDefinitionsDAO(client.id, false)

  // Obtener la plantilla actualmente configurada
  const currentTemplateId = await getAbandonedOrdersTemplateId(client.id)

  // Obtener el tiempo de expiración actual específico del cliente
  const currentExpireTime = await getAbandonedOrdersExpireTime(client.id)

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Configuración de Productos</h1>
        <Link href={`/client/${slug}/productos/abandonadas`}>
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a órdenes abandonadas
          </Button>
        </Link>
      </div>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle>Configuración del Recordatorio para Órdenes Abandonadas</CardTitle>
            <CardDescription>
              Configura la plantilla que se utilizará para enviar un recordatorio a clientes con órdenes abandonadas.
            </CardDescription>
          </div>
          <Link href={`/client/${slug}/productos/reminder-definitions`}>
            <Button variant="outline" size="sm">
              <ListPlus className="h-4 w-4 mr-2" />
              Ver Plantillas
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {templates.length === 0 ? (
            <div className="bg-muted p-4 rounded-md text-center space-y-3">
              <p className="text-muted-foreground">
                No hay plantillas de recordatorio disponibles para órdenes abandonadas.
              </p>
              <Link href={`/client/${slug}/productos/reminder-definitions`}>
                <Button variant="outline">
                  <ListPlus className="h-4 w-4 mr-2" />
                  Crear Plantillas de Recordatorio
                </Button>
              </Link>
            </div>
          ) : (
            <TemplateSelector 
              templates={templates} 
              clientId={client.id}
              currentTemplateId={currentTemplateId}
            />
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Tiempo de Expiración</CardTitle>
          <CardDescription>
            Configura cuándo una orden abandonada se considera expirada y ya no recibirá recordatorios.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ExpireTimeSelector 
            currentValue={currentExpireTime.toString()} 
            clientId={client.id}
          />
        </CardContent>
      </Card>
    </div>
  )
}