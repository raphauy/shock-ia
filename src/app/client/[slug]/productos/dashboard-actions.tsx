"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"
import { EcommerceFeed } from "@/lib/generated/prisma"
import { Loader, RotateCw, Database, AlertTriangle, Zap } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { syncProductsAction, generateEmbeddingsAction, syncOnlyNewProductsAction } from "./actions"
import { Input } from "@/components/ui/input"
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { InfoIcon } from "lucide-react"

/**
 * Formatea el tiempo de ejecución para mostrar minutos cuando es necesario
 * @param seconds Tiempo en segundos
 * @returns Tiempo formateado como "X min Y seg" o "X.XX segundos"
 */
function formatExecutionTime(seconds: number): string {
  if (seconds < 60) {
    return `${seconds.toFixed(2)} segundos`;
  }
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60);
  
  if (remainingSeconds === 0) {
    return `${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}`;
  }
  
  return `${minutes} ${minutes === 1 ? 'minuto' : 'minutos'} ${remainingSeconds} ${remainingSeconds === 1 ? 'segundo' : 'segundos'}`;
}

interface DashboardActionsProps {
  feed: EcommerceFeed | null
  clientId: string
}

export default function DashboardActions({ feed, clientId }: DashboardActionsProps) {
  const [isSyncing, setIsSyncing] = useState(false)
  const [isFastSyncing, setIsFastSyncing] = useState(false)
  const [isGeneratingEmbeddings, setIsGeneratingEmbeddings] = useState(false)
  const [syncResults, setSyncResults] = useState<{ 
    syncCount: number, 
    newProducts: number, 
    updatedProducts: number, 
    unchangedProducts: number, 
    deletedProducts: number,
    executionTime: number 
  } | null>(null)
  const [fastSyncResults, setFastSyncResults] = useState<{ 
    newProducts: number, 
    totalProcessed: number,
    deletedProducts: number,
    executionTime: number 
  } | null>(null)
  const [embeddingResults, setEmbeddingResults] = useState<{ 
    updatedCount: number,
    executionTime: number
  } | null>(null)
  const [maxProducts, setMaxProducts] = useState<number>(1000)
  const [maxNewProducts, setMaxNewProducts] = useState<number>(100)
  const [maxEmbeddings, setMaxEmbeddings] = useState<number>(50)

  const handleMaxProductsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10)
    setMaxProducts(isNaN(value) ? 0 : value)
  }

  const handleMaxNewProductsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10)
    setMaxNewProducts(isNaN(value) ? 10 : value)
  }

  const handleMaxEmbeddingsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10)
    setMaxEmbeddings(isNaN(value) ? 10 : value)
  }

  const handleSyncProducts = async () => {
    if (!feed) {
      toast({
        title: "Error",
        description: "No hay feed configurado para sincronizar",
        variant: "destructive"
      })
      return
    }

    setIsSyncing(true)
    setSyncResults(null)
    
    try {
      const result = await syncProductsAction(feed.id, maxProducts)
      setSyncResults(result)
      
      toast({
        title: "Sincronización completa finalizada",
        description: `Se sincronizaron ${result.syncCount} productos en ${formatExecutionTime(result.executionTime)}: ${result.newProducts} nuevos, ${result.updatedProducts} actualizados, ${result.unchangedProducts} sin cambios, ${result.deletedProducts} eliminados`,
      })
    } catch (error) {
      console.error("Error sincronizando productos:", error)
      toast({
        title: "Error de sincronización",
        description: error instanceof Error ? error.message : "Error desconocido",
        variant: "destructive"
      })
    } finally {
      setIsSyncing(false)
    }
  }

  const handleFastSyncProducts = async () => {
    if (!feed) {
      toast({
        title: "Error",
        description: "No hay feed configurado para sincronizar",
        variant: "destructive"
      })
      return
    }

    setIsFastSyncing(true)
    setFastSyncResults(null)
    
    try {
      const result = await syncOnlyNewProductsAction(feed.id, maxNewProducts)
      setFastSyncResults(result)
      
      toast({
        title: "Sincronización rápida completada",
        description: `Se crearon ${result.newProducts} productos nuevos y se eliminaron ${result.deletedProducts} productos en ${formatExecutionTime(result.executionTime)}`,
      })
    } catch (error) {
      console.error("Error en sincronización rápida:", error)
      toast({
        title: "Error de sincronización rápida",
        description: error instanceof Error ? error.message : "Error desconocido",
        variant: "destructive"
      })
    } finally {
      setIsFastSyncing(false)
    }
  }

  const handleGenerateEmbeddings = async () => {
    setIsGeneratingEmbeddings(true)
    setEmbeddingResults(null)
    
    try {
      const result = await generateEmbeddingsAction(clientId, maxEmbeddings)
      setEmbeddingResults(result)
      
      toast({
        title: "Embeddings generados",
        description: `Se actualizaron ${result.updatedCount} embeddings en ${formatExecutionTime(result.executionTime)}`,
      })
    } catch (error) {
      console.error("Error generando embeddings:", error)
      toast({
        title: "Error generando embeddings",
        description: error instanceof Error ? error.message : "Error desconocido",
        variant: "destructive"
      })
    } finally {
      setIsGeneratingEmbeddings(false)
    }
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card className="flex flex-col">
        <CardHeader>
          <CardTitle>Sincronización de Productos</CardTitle>
          <CardDescription>
            Actualiza tu catálogo con los datos más recientes de tu feed
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-grow">
          <div className="space-y-4">
            {/* Sincronización completa */}
            <div>
              <h3 className="text-sm font-medium mb-2">Sincronización Completa</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Actualiza productos existentes y crea nuevos.
              </p>

              <div className="flex items-center gap-2 mb-4">
                <div className="flex-grow flex items-center gap-2">
                  <label htmlFor="maxProducts" className="text-sm font-medium">
                    Límite:
                  </label>
                  <div className="relative flex-grow max-w-[150px]">
                    <Input
                      id="maxProducts"
                      type="number"
                      value={maxProducts === 0 ? "" : maxProducts}
                      onChange={handleMaxProductsChange}
                      placeholder="Sin límite"
                      min="0"
                      className="w-full"
                      disabled={isSyncing}
                    />
                  </div>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <InfoIcon className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>0 o vacío = sin límite</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Button 
                  onClick={handleSyncProducts} 
                  disabled={isSyncing || isFastSyncing || !feed} 
                  size="sm"
                  className="w-36"
                >
                  {isSyncing ? (
                    <>
                      <Loader className="mr-2 h-4 w-4 animate-spin" />
                      Sincronizando...
                    </>
                  ) : (
                    <>
                      <RotateCw className="mr-2 h-4 w-4" />
                      Completa
                    </>
                  )}
                </Button>
              </div>

              {syncResults && (
                <div className="bg-muted p-3 rounded-md">
                  <p className="text-sm font-medium">Resultado de la sincronización:</p>
                  <p className="text-sm">Se sincronizaron {syncResults.syncCount} productos</p>
                  <div className="mt-1 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                    <p>• {syncResults.newProducts} productos nuevos</p>
                    <p>• {syncResults.updatedProducts} productos actualizados</p>
                    <p>• {syncResults.unchangedProducts} sin cambios</p>
                    <p>• {syncResults.deletedProducts} productos eliminados</p>
                    <p>• Tiempo: {formatExecutionTime(syncResults.executionTime)}</p>
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Sincronización rápida */}
            <div>
              <h3 className="text-sm font-medium mb-2">Sincronización Rápida</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Solo crea productos nuevos.
              </p>

              <div className="flex items-center gap-2 mb-4">
                <div className="flex-grow flex items-center gap-2">
                  <label htmlFor="maxNewProducts" className="text-sm font-medium">
                    Nuevos:
                  </label>
                  <div className="relative flex-grow max-w-[150px]">
                    <Input
                      id="maxNewProducts"
                      type="number"
                      value={maxNewProducts}
                      onChange={handleMaxNewProductsChange}
                      placeholder="10"
                      min="0"
                      className="w-full"
                      disabled={isFastSyncing}
                    />
                  </div>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <InfoIcon className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Número máximo de productos nuevos a crear</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Button 
                  onClick={handleFastSyncProducts} 
                  disabled={isSyncing || isFastSyncing || !feed} 
                  size="sm"
                  className="w-36"
                >
                  {isFastSyncing ? (
                    <>
                      <Loader className="mr-2 h-4 w-4 animate-spin" />
                      Procesando...
                    </>
                  ) : (
                    <>
                      <Zap className="mr-2 h-4 w-4" />
                      Solo nuevos
                    </>
                  )}
                </Button>
              </div>

              {fastSyncResults && (
                <div className="bg-muted p-3 rounded-md">
                  <p className="text-sm font-medium">Resultado de la sincronización rápida:</p>
                  <p className="text-sm">{fastSyncResults.newProducts} productos nuevos creados</p>
                  <p className="text-sm">{fastSyncResults.deletedProducts} productos eliminados</p>
                  <p className="text-sm">Tiempo: {formatExecutionTime(fastSyncResults.executionTime)}</p>
                </div>
              )}
            </div>
          </div>

          {!feed && (
            <div className="flex items-center gap-2 text-amber-600 mt-4">
              <AlertTriangle className="h-4 w-4" />
              <p className="text-sm">No hay feed configurado para este cliente</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="flex flex-col">
        <CardHeader>
          <CardTitle>Generación de Embeddings</CardTitle>
          <CardDescription>
            Actualiza los vectores para búsquedas semánticas
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-grow">
          <p className="text-sm text-muted-foreground mb-4">
            Esta acción generará o actualizará los embeddings para tus productos, 
            permitiendo realizar búsquedas semánticas más precisas.
          </p>

          <div className="flex items-center gap-2 mb-4">
            <div className="flex-grow flex items-center gap-2">
              <label htmlFor="maxEmbeddings" className="text-sm font-medium">
                Límite:
              </label>
              <div className="relative flex-grow max-w-[150px]">
                <Input
                  id="maxEmbeddings"
                  type="number"
                  value={maxEmbeddings === 0 ? "" : maxEmbeddings}
                  onChange={handleMaxEmbeddingsChange}
                  placeholder="Sin límite"
                  min="0"
                  className="w-full"
                  disabled={isGeneratingEmbeddings}
                />
              </div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <InfoIcon className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>0 o vacío = sin límite</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          {embeddingResults && (
            <div className="bg-muted p-3 rounded-md">
              <p className="text-sm font-medium">Resultado:</p>
              <div className="mt-1 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                <p>• {embeddingResults.updatedCount} embeddings generados</p>
                <p>• Tiempo: {formatExecutionTime(embeddingResults.executionTime)}</p>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button 
            onClick={handleGenerateEmbeddings} 
            disabled={isGeneratingEmbeddings} 
            className="w-full"
          >
            {isGeneratingEmbeddings ? (
              <>
                <Loader className="mr-2 h-4 w-4 animate-spin" />
                Generando...
              </>
            ) : (
              <>
                <Database className="mr-2 h-4 w-4" />
                Generar
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
} 