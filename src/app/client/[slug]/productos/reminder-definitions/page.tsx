import { getClientBySlug } from "@/services/clientService"
import { getReminderDefinitionsDAO } from "@/services/reminder-definition-services"
import { notFound } from "next/navigation"
import { ReminderDefinitionDialog } from "@/app/client/[slug]/crm/reminder-definitions/reminderdefinition-dialogs"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { ReminderDefinitionList } from "@/app/client/[slug]/crm/reminder-definitions/reminder-definition-list"

type Props= {
  params: {
    slug: string
  }
}

export default async function ReminderDefinitionsPage({ params }: Props) {
  const clientSlug= params.slug
  const client= await getClientBySlug(clientSlug)
  if (!client) {
    return notFound()
  }
  const clientId= client.id
  const data = await getReminderDefinitionsDAO(clientId, false)

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Plantillas de Recordatorios para Órdenes Abandonadas</h1>
        <Link href={`/client/${clientSlug}/productos/config`}>
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a configuración
          </Button>
        </Link>
      </div>

      <div className="bg-card rounded-md border p-6">
        <div className="flex justify-between items-center mb-4">
          <p className="text-muted-foreground">
            Administra las plantillas de recordatorios para órdenes abandonadas.
          </p>
          <ReminderDefinitionDialog clientId={clientId} past={false}/>
        </div>

        {data.length === 0 ? (
          <div className="bg-muted p-8 rounded-md text-center">
            <p className="text-muted-foreground mb-4">No hay plantillas de recordatorio definidas.</p>
            <ReminderDefinitionDialog clientId={clientId} past={false}/>
          </div>
        ) : (
          <ReminderDefinitionList reminderDefinitions={data}/>
        )}
      </div>
    </div>
  )
}