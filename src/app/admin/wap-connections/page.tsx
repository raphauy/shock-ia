import { getAllWhatsappInstances } from "@/services/clientService"
import { SimpleDashboard } from "./simple-dashboard"

export const maxDuration = 800

export default async function WapConnectionsPage() {
  const instances = await getAllWhatsappInstances()

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Monitoreo de Conexiones WhatsApp</h1>
        <p className="text-muted-foreground">Vista de todas las conexiones por estado</p>
      </div>
      
      <SimpleDashboard initialInstances={instances} />
    </div>
  )
}
