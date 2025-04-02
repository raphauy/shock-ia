"use client";

import { useEffect, useState } from "react";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/use-toast";
import { Client } from "@prisma/client";
import { toggleFCImplementationAction } from "@/app/admin/fc-fee/actions";

interface FCImplementationToggleProps {
  client: Client;
  initialState: boolean;
}

export default function FCImplementationToggle({
  client,
  initialState,
}: FCImplementationToggleProps) {
  const [isImplemented, setIsImplemented] = useState(initialState);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsImplemented(initialState);
  }, [initialState, client.id]);

  const handleToggleImplementation = async () => {
    setIsLoading(true);
    try {
      const result = await toggleFCImplementationAction(client.id, !isImplemented);

      if (!result.success) {
        throw new Error(result.error || "Error al actualizar el estado de implementación");
      }

      setIsImplemented(!isImplemented);
      toast({
        title: "Estado actualizado",
        description: `Cliente ${client.name} ${!isImplemented ? "marcado como implementado" : "marcado como pendiente"}`,
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado de implementación",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <Switch
        checked={isImplemented}
        onCheckedChange={handleToggleImplementation}
        disabled={isLoading}
        aria-label="Toggle FC implementation"
      />
      <span className="text-sm text-muted-foreground">
        {isImplemented ? "Implementado" : "Pendiente"}
      </span>
    </div>
  );
} 