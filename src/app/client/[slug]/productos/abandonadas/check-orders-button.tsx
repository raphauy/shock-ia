"use client";

import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Loader, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { checkAbandonedOrdersAction } from "./actions";

interface CheckOrdersButtonProps {
    clientId: string;
}

export default function CheckOrdersButton({ clientId }: CheckOrdersButtonProps) {
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const { toast } = useToast();

    const handleCheckOrders = async () => {
        try {
            setIsLoading(true);
            
            // Usar la server action para buscar y procesar órdenes abandonadas
            const data = await checkAbandonedOrdersAction(clientId);
            
            // Mostrar notificación de éxito o error
            if (data.error) {
                toast({
                    title: "Error",
                    description: data.mensaje,
                    variant: "destructive"
                });
            } else {
                let description = data.mensaje;
                
                // Si hay datos adicionales, incluirlos en la descripción
                if (data.totalOrdenes !== undefined) {
                    description += `\nTotal: ${data.totalOrdenes}, Nuevas: ${data.ordenesProcesadas}, Existentes: ${data.ordenesExistentes}`;
                    
                    if (data.errores && data.errores > 0) {
                        description += `, Sin teléfono: ${data.errores}`;
                    }
                }
                
                toast({
                    title: "Proceso completado",
                    description: description,
                });
            }
            
            // Si fue exitoso y se procesaron órdenes, refrescar la página
            if (!data.error && data.ordenesProcesadas && data.ordenesProcesadas > 0) {
                // La revalidación de ruta ya está manejada por la server action,
                // pero mantenemos el refresh explícito para asegurar la actualización de la UI
                setTimeout(() => {
                    router.refresh();
                }, 1500);
            }
        } catch (error: any) {
            console.error("Error al buscar órdenes abandonadas:", error);
            toast({
                title: "Error",
                description: "Ocurrió un error al buscar órdenes abandonadas. Por favor, intenta de nuevo.",
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Button
            onClick={handleCheckOrders}
            disabled={isLoading}
            variant="default"
            className="flex items-center gap-2"
        >
            {isLoading ? <Loader className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            Buscar órdenes abandonadas
        </Button>
    );
} 