"use client"

import { FunctionDAO } from "@/services/function-services"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { addFunctionToClientAction, removeFunctionFromClientAction } from "../clients/(crud)/actions"
import { useState } from "react"
import { toast } from "@/components/ui/use-toast"
import { Loader } from "lucide-react"

const crmFunctions= ["obtenerDisponibilidad", "reservarParaEvento", "obtenerReservas", "cancelarReserva", "reservarParaEventoDeUnicaVez"]
const productFunctions= ["buscarProducto", "buscarOrden"]

type Props= {
    clientId: string
    haveCRM: boolean
    haveProducts: boolean
    genericFunctions: FunctionDAO[]
    functionsOfClient: FunctionDAO[]
}

const getDescription = (func: FunctionDAO): string => {
    if (func.description) return func.description
    
    if (func.definition) {
        try {
            const def = JSON.parse(func.definition)
            if (def.description) return def.description
        } catch (e) {
            // Si hay error al parsear el JSON, ignoramos silenciosamente
        }
    }
    
    return 'Sin descripción'
}

export function FCPanel({ clientId, haveCRM, haveProducts, genericFunctions, functionsOfClient }: Props) {
    const [loadingFunctions, setLoadingFunctions] = useState<{[key: string]: boolean}>({})
    const functionsWithOutCRM= functionsOfClient.filter(func => !crmFunctions.includes(func.name))
    const functionsWithOutProducts= functionsOfClient.filter(func => !productFunctions.includes(func.name))

    // Funciones custom are the ones that are not in the crmFunctions or productFunctions
    const functionsCustom= functionsOfClient.filter(func => !crmFunctions.includes(func.name) && !productFunctions.includes(func.name))

    const handleToggle = async (functionId: string, isEnabled: boolean) => {
        try {
            setLoadingFunctions(prev => ({ ...prev, [functionId]: true }))
            
            if (isEnabled) {
                await removeFunctionFromClientAction(clientId, functionId)
                toast({ title: "Función desactivada correctamente", description: "Actualizando..." })
            } else {
                await addFunctionToClientAction(clientId, functionId)
                toast({ title: "Función activada correctamente", description: "Actualizando..." })
            }
        } catch (error) {
            toast({ 
                title: "Error al modificar la función",
                variant: "destructive"
            })
            console.error(error)
        } finally {
            setLoadingFunctions(prev => ({ ...prev, [functionId]: false }))
        }
    }

    return (
        <div className="grid gap-6 md:grid-cols-2">
            {/* Panel de Funciones del Cliente */}
            <Card>
                <CardHeader>
                    <CardTitle>Funciones Activas</CardTitle>
                    <CardDescription>
                        Funciones configuradas para este cliente
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {functionsCustom.map((func) => (
                            <div key={func.id} className="border-b pb-3 last:border-0">
                                <h3 className="font-medium">
                                    {func.name}
                                    {func.clients.length === 1 && <span> (Custom)</span>}
                                </h3>
                                <p className="text-sm text-muted-foreground truncate">
                                    {getDescription(func)}
                                </p>
                            </div>
                        ))}
                        {
                            haveCRM &&
                            <div className="border-b pb-3 last:border-0">
                                <h3 className="font-medium">CRM</h3>
                                <div className="text-sm text-muted-foreground">
                                    {crmFunctions.map(func => (
                                        <p key={func}>{func}</p>
                                    ))}
                                </div>
                            </div>
                        }
                        {haveProducts &&
                            <div className="border-b pb-3 last:border-0">
                                <h3 className="font-medium">Productos</h3>
                                <p className="text-sm text-muted-foreground">
                                    buscarProducto
                                </p>
                                {
                                    functionsOfClient.filter(func => func.name === "buscarOrden").map(func => (
                                        <p key={func.id} className="text-sm text-muted-foreground">
                                            {func.name}
                                        </p>
                                    ))
                                }
                            </div>
                        }
                        {functionsOfClient.length === 0 && (
                            <p className="text-sm text-muted-foreground">
                                No hay funciones configuradas
                            </p>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Panel de Funciones Genéricas */}
            <Card>
                <CardHeader>
                    <CardTitle>Funciones Genéricas</CardTitle>
                    <CardDescription>
                        Activa o desactiva las funciones genéricas para este cliente
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {genericFunctions.map((func) => {
                        const isEnabled = functionsOfClient.some(
                            (clientFunc) => clientFunc.id === func.id
                        )
                        return (
                            <div key={func.id} className="flex items-center justify-between space-x-2">
                                <div className="space-y-1 flex-1 min-w-0">
                                    <Label className="flex items-center gap-2" htmlFor={func.id}>{func.name} {loadingFunctions[func.id] && <Loader className="h-4 w-4 animate-spin" />}</Label>
                                    <p className="text-sm text-muted-foreground truncate">
                                        {getDescription(func)}
                                    </p>
                                </div>
                                <Switch
                                    id={func.id}
                                    checked={isEnabled}
                                    disabled={loadingFunctions[func.id]}
                                    onCheckedChange={(checked) => handleToggle(func.id, isEnabled)}
                                />                                
                            </div>
                        )
                    })}
                </CardContent>
            </Card>
        </div>
    )
}