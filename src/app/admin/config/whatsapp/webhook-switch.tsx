"use client"

import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { useEffect, useState, useCallback } from "react"
import { Loader } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { getWebhookStatusAction, setWebhookAction } from "./actions"

interface WebhookSwitchProps {
  clientId: string
  instanceName: string
}

export function WebhookSwitch({ clientId, instanceName }: WebhookSwitchProps) {
  const [isEnabled, setIsEnabled] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const getWebhookStatus = useCallback(async () => {
    try {
      setIsLoading(true)
      const status = await getWebhookStatusAction(instanceName)
      setIsEnabled(status.enabled)
    } catch (error) {
      toast({ 
        title: "Error obteniendo estado del webhook", 
        description: error instanceof Error ? error.message : "Error desconocido", 
        variant: "destructive" 
      })
    } finally {
      setIsLoading(false)
    }
  }, [instanceName])

  useEffect(() => {
    getWebhookStatus()
  }, [getWebhookStatus])

  async function handleSwitchChange(checked: boolean) {
    try {
      setIsLoading(true)
      const success = await setWebhookAction(clientId, checked)
      
      if (success) {
        setIsEnabled(checked)
        toast({ 
          title: checked ? "Monitoreo habilitado" : "Monitoreo deshabilitado",
        })
      } else {
        // Revertir al estado anterior si la acción falló
        setIsEnabled(!checked)
        toast({ 
          title: "Error cambiando estado del webhook", 
          description: "La acción no se completó correctamente", 
          variant: "destructive" 
        })
      }
    } catch (error) {
      setIsEnabled(!checked) // Revertir al estado anterior
      toast({ 
        title: "Error cambiando estado del webhook", 
        description: error instanceof Error ? error.message : "Error desconocido", 
        variant: "destructive" 
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-between space-x-2 p-4 border rounded-lg mt-4">
      <div className="space-y-1">
        <Label htmlFor="webhook-switch" className="font-medium">
          Monitorear estado de conexión
        </Label>
        <p className="text-sm text-muted-foreground">
          Notifica a los administradores cuando WhatsApp
        </p>
        <p className="text-sm text-muted-foreground">
          se desconecta
        </p>
      </div>
      <div className="flex items-center">
        {isLoading ? (
          <Loader className="w-4 h-4 animate-spin" />
        ) : (
          <Switch
            id="webhook-switch"
            checked={isEnabled}
            onCheckedChange={handleSwitchChange}
          />
        )}
      </div>
    </div>
  )
} 