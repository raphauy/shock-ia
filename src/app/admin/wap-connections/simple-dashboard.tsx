"use client"

import { useEffect, useState, useMemo, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader, RefreshCw, Search, X } from "lucide-react"
import { SimpleTable } from "./simple-table"
import { toast } from "@/components/ui/use-toast"
import { fetchInstanceAction, getWebhookStatusAction, setWebhookAction } from "./actions"
import { NotificationConfigDialog } from "./notification-config-dialog"

interface WhatsappInstance {
  id: string
  name: string
  client: {
    id: string
    name: string
    slug: string
  }
}

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

interface SimpleDashboardProps {
  initialInstances: WhatsappInstance[]
}

export function SimpleDashboard({ initialInstances }: SimpleDashboardProps) {
  // Estado para todas las instancias
  const [instances, setInstances] = useState<InstanceData[]>(
    initialInstances.map(instance => ({
      id: instance.id,
      name: instance.name,
      clientId: instance.client.id,
      clientName: instance.client.name,
      status: "unknown",
      webhookEnabled: false,
      isLoading: false,
      profilePicUrl: null
    }))
  )
  
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [filterText, setFilterText] = useState("")
  const [webhookLoadingState, setWebhookLoadingState] = useState<Record<string, boolean>>({})
  const [initialLoadComplete, setInitialLoadComplete] = useState(false)
  
  // Función para cargar todos los estados - usando useCallback
  const loadAllStatuses = useCallback(async () => {
    setIsRefreshing(true)
    
    // Marcar todas las instancias como cargando
    setInstances(current => 
      current.map(instance => ({
        ...instance,
        isLoading: true
      }))
    )
    
    try {
      const statusPromises = instances.map(async (instance) => {
        try {
          // Obtener instancia completa con fetchInstanceAction (incluye profilePicUrl)
          const instanceData = await fetchInstanceAction(instance.name)
          
          // Obtener estado de webhook
          const webhookStatus = await getWebhookStatusAction(instance.name)
          
          return {
            id: instance.id,
            status: instanceData?.connectionStatus || "error",
            webhookEnabled: webhookStatus.enabled,
            profilePicUrl: instanceData?.profilePicUrl || null
          }
        } catch (error) {
          console.error(`Error loading status for ${instance.name}:`, error)
          return {
            id: instance.id,
            status: "error",
            webhookEnabled: false,
            profilePicUrl: null
          }
        }
      })
      
      const results = await Promise.all(statusPromises)
      
      // Actualizar todos los estados a la vez
      setInstances(current => 
        current.map(instance => {
          const result = results.find(r => r.id === instance.id)
          return {
            ...instance,
            status: result?.status || "error",
            webhookEnabled: result?.webhookEnabled || false,
            profilePicUrl: result?.profilePicUrl || null,
            isLoading: false
          }
        })
      )
    } catch (error) {
      console.error("Error loading statuses:", error)
      toast({
        title: "Error al cargar los estados",
        description: "Ocurrió un error al cargar la información de las instancias",
        variant: "destructive"
      })
      
      // Marcar todas como no cargando
      setInstances(current => 
        current.map(instance => ({
          ...instance,
          isLoading: false
        }))
      )
    } finally {
      setIsRefreshing(false)
    }
  }, [instances])
  
  // Cargar estados iniciales
  useEffect(() => {
    if (!initialLoadComplete) {
      loadAllStatuses()
      setInitialLoadComplete(true)
    }
  }, [initialLoadComplete, loadAllStatuses])
  
  // Filtrar instancias por nombre de cliente - usando useMemo para evitar recálculos innecesarios
  const filteredInstances = useMemo(() => 
    instances.filter(instance => 
      instance.clientName.toLowerCase().includes(filterText.toLowerCase())
    ),
    [instances, filterText]
  )
  
  // Dividir por estado de conexión
  const connectedInstances = useMemo(() => 
    filteredInstances.filter(instance => instance.status === 'open'),
    [filteredInstances]
  )
  
  const disconnectedInstances = useMemo(() => 
    filteredInstances.filter(instance => instance.status !== 'open'),
    [filteredInstances]
  )

  // Función para manejar cambios en el webhook
  async function handleWebhookToggle(instanceId: string, clientId: string, instanceName: string, enabled: boolean) {
    // Marcar esta instancia como cargando
    setWebhookLoadingState(prev => ({
      ...prev,
      [instanceId]: true
    }))
    
    try {
      const success = await setWebhookAction(clientId, enabled)
      
      if (success) {
        // Actualizar el estado local
        setInstances(current => 
          current.map(instance => 
            instance.id === instanceId 
              ? { ...instance, webhookEnabled: enabled } 
              : instance
          )
        )
        
        toast({
          title: enabled ? "Monitoreo habilitado" : "Monitoreo deshabilitado"
        })
      } else {
        toast({
          title: "Error cambiando estado del monitoreo",
          description: "La acción no se completó correctamente",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error cambiando estado del monitoreo",
        description: error instanceof Error ? error.message : "Error desconocido",
        variant: "destructive"
      })
    } finally {
      setWebhookLoadingState(prev => ({
        ...prev,
        [instanceId]: false
      }))
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Filtrar por cliente"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="pl-8"
          />
          {filterText && (
            <button 
              onClick={() => setFilterText('')}
              className="absolute right-2 top-2.5 text-muted-foreground hover:text-foreground"
              aria-label="Limpiar filtro"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="flex gap-2">
          <NotificationConfigDialog />
          <Button 
            onClick={loadAllStatuses} 
            disabled={isRefreshing}
            variant="outline"
          >
            {isRefreshing ? <Loader className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}            
              Actualizar Estados
          </Button>
        </div>
      </div>

      <div className="space-y-6 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-6">
        <div>
          <SimpleTable 
            title="Conectados" 
            instances={connectedInstances} 
            emptyMessage={filterText ? "No hay instancias conectadas que coincidan con el filtro" : "No hay instancias conectadas"} 
            onWebhookToggle={handleWebhookToggle}
            isWebhookLoading={webhookLoadingState}
          />
        </div>
        <div>
          <SimpleTable 
            title="No conectados" 
            instances={disconnectedInstances} 
            emptyMessage={filterText ? "No hay instancias no conectadas que coincidan con el filtro" : "No hay instancias no conectadas"} 
            onWebhookToggle={handleWebhookToggle}
            isWebhookLoading={webhookLoadingState}
          />
        </div>
      </div>
    </div>
  )
} 