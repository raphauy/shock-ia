"use client";

import { useState } from "react";
import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { Loader2, Save, Timer, TimerOff } from "lucide-react";
import { setAbandonedOrdersTemplateAction } from "../abandonadas/actions";
import { ReminderDefinitionDAO } from "@/services/reminder-definition-services";
import { formatMinutesDelay } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface TemplateSelectorProps {
    templates: ReminderDefinitionDAO[];
    clientId: string;
    currentTemplateId: string | null;
}

export default function TemplateSelector({ templates, clientId, currentTemplateId }: TemplateSelectorProps) {
    const [selectedTemplateId, setSelectedTemplateId] = useState<string>(currentTemplateId || "");
    const [isLoading, setIsLoading] = useState<boolean>(false);
    
    const handleChange = (value: string) => {
        setSelectedTemplateId(value);
    };
    
    const handleSave = async () => {
        if (!selectedTemplateId) {
            toast({
                title: "Error",
                description: "Debes seleccionar una plantilla",
                variant: "destructive"
            });
            return;
        }
        
        setIsLoading(true);
        
        try {
            const result = await setAbandonedOrdersTemplateAction(clientId, selectedTemplateId);
            
            if (result.error) {
                toast({
                    title: "Error",
                    description: result.mensaje,
                    variant: "destructive"
                });
            } else {
                toast({
                    title: "Éxito",
                    description: "Plantilla configurada correctamente"
                });
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Ocurrió un error al configurar la plantilla",
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <h2 className="text-lg font-medium">Seleccionar plantilla para recordatorio</h2>
                <p className="text-sm text-muted-foreground">
                    Elige la plantilla que se utilizará para enviar un recordatorio a clientes con órdenes abandonadas.
                </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-[1fr,auto] gap-4 items-end">
                <Select
                    value={selectedTemplateId}
                    onValueChange={handleChange}
                >
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecciona una plantilla" />
                    </SelectTrigger>
                    <SelectContent>
                        {templates.map((template) => (
                            <SelectItem key={template.id} value={template.id}>
                                {template.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                
                <Button 
                    onClick={handleSave} 
                    disabled={isLoading || !selectedTemplateId || selectedTemplateId === currentTemplateId}
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Guardando...
                        </>
                    ) : (
                        <>
                            <Save className="mr-2 h-4 w-4" />
                            Guardar
                        </>
                    )}
                </Button>
            </div>
            
            {selectedTemplateId && (
                <div className="bg-muted p-4 rounded-md mt-4">
                    <h3 className="font-medium mb-2">Vista previa de la plantilla</h3>
                    
                    {(() => {
                        const selectedTemplate = templates.find(t => t.id === selectedTemplateId);
                        if (!selectedTemplate) return null;
                        
                        const { past, minutesDelay, description } = selectedTemplate;
                        
                        return (
                            <>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${past ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'}`}>
                                        {past ? 'Recordatorio previo' : 'Recordatorio posterior'}
                                    </span>
                                    
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                        {past ? <Timer className="h-3.5 w-3.5" /> : <TimerOff className="h-3.5 w-3.5" />}
                                        <span>
                                            {formatMinutesDelay(minutesDelay, past)}
                                            {past ? " del evento" : " del abandono"}
                                        </span>
                                    </div>
                                </div>
                                
                                {description && (
                                    <p className="text-sm text-muted-foreground mb-2">
                                        {description}
                                    </p>
                                )}
                            </>
                        );
                    })()}
                    
                    <div className="bg-background p-3 rounded border text-sm whitespace-pre-wrap">
                        {templates.find(t => t.id === selectedTemplateId)?.message}
                    </div>
                </div>
            )}
        </div>
    );
} 