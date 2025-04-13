"use client";

import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { Loader, RefreshCw } from "lucide-react";
import { useState } from "react";
import { syncProductsAction } from "./actions";
import { useSession } from "next-auth/react";

export default function SyncButton() {
  const [isLoading, setIsLoading] = useState(false);
  const { data: session } = useSession();
  
  // Solo mostrar al usuario con email rapha.uy@rapha.uy
  if (session?.user?.email !== "rapha.uy@rapha.uy") {
    return null;
  }

  const handleSync = async () => {
    setIsLoading(true);
    try {
      const result = await syncProductsAction();
      if (!result.success) {
        throw new Error(result.error || "Error desconocido");
      }

      // Formatear tiempo de ejecución para mostrar en minutos y segundos si es relevante
      const executionTime = result.data?.totalExecutionTime || 0;
      let timeDisplay = "";
      if (executionTime < 60) {
        timeDisplay = `${executionTime.toFixed(2)} segundos`;
      } else {
        const minutes = Math.floor(executionTime / 60);
        const seconds = Math.round(executionTime % 60);
        timeDisplay = `${minutes} ${minutes === 1 ? 'minuto' : 'minutos'} ${seconds} ${seconds === 1 ? 'segundo' : 'segundos'}`;
      }
      
      toast({
        title: "Sincronización completada",
        description: `Se procesaron ${result.data?.totalFeeds || 0} feeds y ${result.data?.totalProductsSynced || 0} productos. Tiempo total: ${timeDisplay}`,
      });
    } catch (error) {
      toast({
        title: "Error en la sincronización",
        description: error instanceof Error ? error.message : "Error desconocido",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button 
      onClick={handleSync}
      disabled={isLoading}
      className="flex items-center gap-2"
    >
      {isLoading ? (
        <Loader className="h-4 w-4 animate-spin mr-2" />
      ) : (
        <RefreshCw className="h-4 w-4 mr-2" />
      )}
      Sincronizar ahora
    </Button>
  );
} 