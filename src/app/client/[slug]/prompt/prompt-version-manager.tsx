"use client"

import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { format } from 'date-fns'
import { useEffect, useState } from 'react'
import PromptVersionList from './prompt-version-list'
import { ArrowUpCircle, Clock, FileText, History, Loader, Save } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { PromptVersionDAO, PromptVersionFormValues } from "@/services/prompt-version-services"
import { useSession } from "next-auth/react"
import { toast } from "@/components/ui/use-toast"
import { deletePromptVersionAction, updatePromptAction, updatePromptAndCreateVersionAction } from "@/app/client/[slug]/prompt/promptversion-actions"
import { cn } from "@/lib/utils"
import { toZonedTime } from "date-fns-tz"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

type Props = {
  clientId: string
  timezone: string
  prompt: string
  versions: PromptVersionDAO[]
}
    
export default function PromptVersionManager({ clientId, timezone, prompt, versions }: Props) {
    const [loadingGuardar, setLoadingGuardar] = useState(false)
    const [loadingAplicar, setLoadingAplicar] = useState(false)
    const [currentPrompt, setCurrentPrompt] = useState("")
    const [selectedVersion, setSelectedVersion] = useState<PromptVersionDAO | null>(null)
    const [activeVersionId, setActiveVersionId] = useState<string | null>(null)

    const [charCountSaved, setCharCountSaved] = useState(0)
    const [charCount, setCharCount] = useState(0)
  
    const session = useSession()
    const currentUser = session?.data?.user?.name || session?.data?.user?.email

    useEffect(() => {        
        const count= prompt.length
        setCharCount(count)
        setCharCountSaved(count)
        setCurrentPrompt(prompt)
        
        // Buscar la versión activa al cargar
        const activeVersion = versions.find(v => v.content === prompt)
        if (activeVersion) {
            setActiveVersionId(activeVersion.id)
        }
    }, [prompt, versions])

    const saveVersion = () => {
        setLoadingGuardar(true)
        const newVersion: PromptVersionFormValues = {
        content: currentPrompt,
        user: currentUser as string,
        clientId: clientId
        }
        
        updatePromptAndCreateVersionAction(newVersion)
        .then((newVersion) => {
            toast({ title: "Versión guardada" })
            setCharCountSaved(charCount)
            setSelectedVersion(null)
            // Actualizar la versión activa al guardar una nueva
            if (newVersion && newVersion.id) {
                setActiveVersionId(newVersion.id)
            }
        })
        .catch(() => {
            toast({ title: "Error", description: "Error al guardar la versión del prompt" })
        })
        .finally(() => {
            setLoadingGuardar(false)
        })
    }

    const deleteVersion = (id: string) => {
        setLoadingGuardar(true)
        deletePromptVersionAction(id)
        .then(() => {
        toast({title: "Versión eliminada" })
        })
        .catch((error) => {
        toast({title: "Error", description: error.message, variant: "destructive"})
        })
        .finally(() => {
        setLoadingGuardar(false)
        })
    }

    const handleUseVersion = (version: PromptVersionDAO) => {
        setCurrentPrompt(version.content)
        setLoadingAplicar(true)
        updatePromptAction(version)
        .then(() => {
            toast({title: "Prompt actualizado"})
            const count= version.content.length
            setCharCount(count)
            setCharCountSaved(count)
            // Actualizar la versión activa
            setActiveVersionId(version.id)
        })
        .catch(() => {
            toast({title: "Error", description: "Error al actualizar el prompt", variant: "destructive"})
        })
        .finally(() => {
            setLoadingAplicar(false)
        })
    }

    const viewVersion = (version: PromptVersionDAO) => {
        setSelectedVersion(version)
    }

    if (!currentUser) {
        return <div>Usuario no encontrado</div>
    }


    return (
        <div className="container mx-auto py-6 space-y-8">
            <Card className="shadow-sm">
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-2xl">Editor de Prompt</CardTitle>
                            <CardDescription>Crea y gestiona versiones de prompts para este cliente</CardDescription>
                        </div>
                        <Badge variant="outline" className="px-3 py-1">
                            <Clock className="w-3.5 h-3.5 mr-1" />
                            <span>{charCount} caracteres</span>
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent>
                    <Textarea
                        value={currentPrompt}
                        placeholder="Escribe tu prompt aquí..."
                        className="w-full min-h-[450px] font-mono text-sm resize-y"
                        onChange={(e) => {
                            const text = e.target.value
                            setCharCount(text.length)
                            setCurrentPrompt(text)
                        }}
                    />
                    <div className="flex justify-between items-center mt-4">
                        <p className="text-sm text-muted-foreground">
                            {charCountSaved !== charCount ? 
                                "Hay cambios sin guardar" : 
                                "Todos los cambios están guardados"}
                        </p>
                        <Button 
                            onClick={saveVersion} 
                            className={cn("", {
                                "opacity-50 cursor-not-allowed": charCountSaved === charCount
                            })}
                            disabled={charCountSaved === charCount}
                            size="lg"
                        >
                            {loadingGuardar ? <Loader className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
                            Guardar versión
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Tabs defaultValue="historial" className="w-full">
                <TabsList className="grid w-full max-w-md grid-cols-2">
                    <TabsTrigger value="historial">
                        <History className="w-4 h-4 mr-2" />
                        Historial de Versiones
                    </TabsTrigger>
                    <TabsTrigger value="comparar">
                        <FileText className="w-4 h-4 mr-2" />
                        Comparar Versiones
                    </TabsTrigger>
                </TabsList>
                
                <TabsContent value="historial" className="mt-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card className="md:col-span-1 shadow-sm">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-lg flex items-center">
                                    <History className="w-5 h-5 mr-2" />
                                    Historial
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0 h-[350px]">
                                <PromptVersionList
                                    versions={versions}
                                    timezone={timezone}
                                    selectedVersion={selectedVersion}
                                    currentPrompt={currentPrompt}
                                    activeVersionId={activeVersionId}
                                    onViewVersion={viewVersion}
                                    onUseVersion={handleUseVersion}
                                    onDeleteVersion={deleteVersion}
                                />
                            </CardContent>
                        </Card>
                        
                        <Card className="md:col-span-2 shadow-sm">
                            <CardHeader className="pb-2">
                                {selectedVersion ? (
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-lg">
                                            Versión de {selectedVersion.user}
                                            <span className="block text-sm font-normal text-muted-foreground mt-1">
                                                {format(toZonedTime(selectedVersion.timestamp, timezone), "dd/MM/yyyy HH:mm:ss")}
                                            </span>
                                        </CardTitle>
                                        <Button 
                                            onClick={() => handleUseVersion(selectedVersion)} 
                                            disabled={loadingAplicar || activeVersionId === selectedVersion.id}
                                            variant="secondary"
                                        >
                                            {loadingAplicar ? 
                                                <Loader className="mr-2 h-4 w-4 animate-spin" /> : 
                                                <ArrowUpCircle className="mr-2 h-4 w-4" />
                                            }
                                            Aplicar esta versión
                                        </Button>
                                    </div>
                                ) : (
                                    <CardTitle className="text-lg">Contenido de la versión</CardTitle>
                                )}
                            </CardHeader>
                            <CardContent className="h-[350px] p-0">
                                <ScrollArea className="h-full">
                                    <div className="p-4">
                                        {selectedVersion ? (
                                            <p className="whitespace-pre-wrap font-mono text-sm">{selectedVersion.content}</p>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center h-full text-center p-6">
                                                <FileText className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
                                                <p className="text-muted-foreground">Selecciona una versión del historial para ver su contenido</p>
                                            </div>
                                        )}
                                    </div>
                                </ScrollArea>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
                
                <TabsContent value="comparar" className="mt-4">
                    <Card className="shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-lg">Comparación de versiones</CardTitle>
                            <CardDescription>
                                Selecciona una versión del historial para compararla con la versión actual
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {selectedVersion ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <h3 className="text-sm font-medium mb-2">Versión actual</h3>
                                        <div className="border rounded-md p-4 h-[300px] overflow-auto">
                                            <p className="whitespace-pre-wrap font-mono text-sm">{currentPrompt}</p>
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-medium mb-2">
                                            Versión seleccionada
                                            <span className="text-xs font-normal text-muted-foreground ml-2">
                                                ({format(toZonedTime(selectedVersion.timestamp, timezone), "dd/MM/yyyy HH:mm")})
                                            </span>
                                        </h3>
                                        <div className="border rounded-md p-4 h-[300px] overflow-auto">
                                            <p className="whitespace-pre-wrap font-mono text-sm">{selectedVersion.content}</p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-[300px] text-center">
                                    <FileText className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
                                    <p className="text-muted-foreground">Selecciona una versión del historial para compararla</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}