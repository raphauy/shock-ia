"use client"

import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { cn, getStatusColorAndLabel } from "@/lib/utils"
import { Loader } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface InstanceData {
  id: string
  name: string
  clientId: string
  clientName: string
  status: string
  webhookEnabled: boolean
  isLoading: boolean
  profilePicUrl: string | null
}

interface SimpleTableProps {
  title: string
  instances: InstanceData[]
  emptyMessage?: string
  onWebhookToggle: (instanceId: string, clientId: string, instanceName: string, enabled: boolean) => void
  isWebhookLoading: Record<string, boolean>
}

export function SimpleTable({ 
  title, 
  instances, 
  emptyMessage = "No hay instancias disponibles",
  onWebhookToggle,
  isWebhookLoading
}: SimpleTableProps) {
  const isDisconnectedTable = title === "No conectados";
  return (
    <div className="space-y-2">
      <h2 className="text-xl font-semibold">{title}</h2>
      
      <div className="rounded-md border">
        <table className="w-full">
          <thead>
            <tr className="bg-muted/50 border-b">
              <th className="p-4 text-left font-medium">Cliente</th>
              <th className="p-4 text-left font-medium">Estado</th>
              <th className="p-4 text-center font-medium">Notificaciones</th>
            </tr>
          </thead>
          <tbody>
            {instances.length === 0 ? (
              <tr>
                <td colSpan={3} className="p-8 text-center text-muted-foreground">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              instances.map((instance) => (
                <tr key={instance.id} className="border-b transition-colors hover:bg-muted/50 h-16">
                  <td className={cn("align-middle", isDisconnectedTable ? "p-3" : "p-4")}>
                    <div className="flex items-center gap-2">
                      {!isDisconnectedTable ? (
                        <Avatar className="h-8 w-8 flex-shrink-0">
                          {instance.profilePicUrl ? (
                            <AvatarImage src={instance.profilePicUrl} alt={instance.clientName} />
                          ) : (
                            <AvatarFallback>{instance.clientName.slice(0, 2).toUpperCase()}</AvatarFallback>
                          )}
                        </Avatar>
                      ) : (
                        <div className="h-8" />
                      )}
                      <span>{instance.clientName}</span>
                    </div>
                  </td>
                  <td className="p-4 align-middle">
                    {instance.isLoading ? (
                      <div className="flex items-center">
                        <Loader className="w-4 h-4 mr-2 animate-spin" />
                        <span className="text-muted-foreground">Actualizando...</span>
                      </div>
                    ) : (
                      <Badge 
                        className="font-medium"
                        variant={instance.status as "open" | "close" | "connecting"}
                      >
                        {getStatusColorAndLabel(instance.status)}
                      </Badge>
                    )}
                  </td>
                  <td className="p-4 align-middle flex justify-center">
                    {isWebhookLoading[instance.id] ? (
                      <Loader className="w-4 h-4 animate-spin" />
                    ) : (
                      <Switch
                        checked={instance.webhookEnabled}
                        onCheckedChange={(checked) => 
                          onWebhookToggle(instance.id, instance.clientId, instance.name, checked)
                        }
                      />
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
} 