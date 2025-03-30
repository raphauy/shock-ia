"use client";

import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Loader, PlayCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { processAbandonedOrderAction } from "./actions";

interface SendReminderButtonProps {
    orderId: string;
}

export default function SendReminderButton({ orderId }: SendReminderButtonProps) {
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const { toast } = useToast();

    const handleSendReminder = async () => {
        try {
            setIsLoading(true);
            
            // Usar la server action para procesar la orden y enviar el recordatorio
            const result = await processAbandonedOrderAction(orderId);
            
            // Mostrar notificación de éxito o error
            if (result.error) {
                toast({
                    title: "Error",
                    description: result.mensaje,
                    variant: "destructive"
                });
            } else {
                toast({
                    title: "Recordatorio programado",
                    description: result.mensaje,
                });
                
                // Refrescar la página para mostrar el cambio de estado
                setTimeout(() => {
                    router.refresh();
                }, 1000);
            }
        } catch (error: any) {
            console.error("Error al enviar recordatorio:", error);
            toast({
                title: "Error",
                description: "Ocurrió un error al enviar el recordatorio. Por favor, intenta de nuevo.",
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Button 
            onClick={handleSendReminder}
            disabled={isLoading}
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 text-primary hover:text-primary/80"
            title="Enviar recordatorio"
        >
            {isLoading ? 
                <Loader className="h-5 w-5 animate-spin" /> : 
                <PlayCircle className="h-5 w-5" />
            }
        </Button>
    );
}
