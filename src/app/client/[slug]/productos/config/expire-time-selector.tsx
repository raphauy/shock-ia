"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import { Loader, Save, Clock } from "lucide-react";
import { setExpireTimeAction } from "./actions";
import { Label } from "@/components/ui/label";

interface ExpireTimeSelectorProps {
    currentValue: string;
    clientId: string;
}

export default function ExpireTimeSelector({ currentValue, clientId }: ExpireTimeSelectorProps) {
    const [expireTime, setExpireTime] = useState<string>(currentValue || "48");
    const [isLoading, setIsLoading] = useState<boolean>(false);
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Solo permitir números
        const value = e.target.value.replace(/[^0-9]/g, '');
        setExpireTime(value);
    };
    
    const handleSave = async () => {
        if (!expireTime) {
            toast({
                title: "Error",
                description: "Debes ingresar un valor para el tiempo de expiración",
                variant: "destructive"
            });
            return;
        }
        
        const numValue = parseInt(expireTime, 10);
        if (isNaN(numValue) || numValue <= 0 || numValue > 720) {
            toast({
                title: "Error",
                description: "El tiempo de expiración debe ser un número entre 1 y 720 horas",
                variant: "destructive"
            });
            return;
        }
        
        setIsLoading(true);
        
        try {
            const result = await setExpireTimeAction(clientId, expireTime);
            
            if (result.error) {
                toast({
                    title: "Error",
                    description: result.message,
                    variant: "destructive"
                });
            } else {
                toast({
                    title: "Éxito",
                    description: "Tiempo de expiración configurado correctamente"
                });
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Ocurrió un error al configurar el tiempo de expiración",
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <h2 className="text-lg font-medium">Tiempo de expiración de órdenes abandonadas</h2>
                <p className="text-sm text-muted-foreground">
                    Establece cuántas horas deben transcurrir desde el abandono para que una orden sea considerada expirada.
                </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-[1fr,auto] gap-4 items-end">
                <div className="space-y-2">
                    <Label htmlFor="expire-time">Tiempo en horas</Label>
                    <div className="relative">
                        <Input
                            id="expire-time"
                            type="text"
                            value={expireTime}
                            onChange={handleChange}
                            className="pr-12"
                            placeholder="48"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleSave();
                                }
                            }}
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-muted-foreground">
                            horas
                        </div>
                    </div>
                </div>
                
                <Button 
                    onClick={handleSave} 
                    disabled={isLoading || !expireTime || expireTime === currentValue}
                    className="gap-2"
                >
                    {isLoading ? <Loader className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Guardar
                </Button>
            </div>
            
            <div className="bg-muted p-4 rounded-md text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>Una vez expirada, la orden no recibirá recordatorios automáticos.</span>
                </div>
            </div>
        </div>
    );
} 