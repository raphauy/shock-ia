"use client";

import { useEffect, useState } from "react";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/use-toast";
import { updateFeedAutomationAction } from "./actions";
import { Loader } from "lucide-react";

interface FeedAutomationToggleProps {
  feedId: string;
  initialState: boolean;
}

export function FeedAutomationToggle({ feedId, initialState }: FeedAutomationToggleProps) {
  const [isAutomated, setIsAutomated] = useState(initialState);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsAutomated(initialState);
  }, [initialState, feedId]);

  const handleToggle = async () => {
    setIsLoading(true);
    try {
      const result = await updateFeedAutomationAction(feedId, !isAutomated);

      if (!result.success) {
        throw new Error(result.error || "Error al actualizar la sincronización automática");
      }

      setIsAutomated(!isAutomated);
      toast({
        title: "Estado actualizado",
        description: `Sincronización automática ${!isAutomated ? "activada" : "desactivada"}`,
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la sincronización automática",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <div className="flex items-center justify-center gap-2 w-10">
        {
            isLoading ? <Loader className="w-5 h-5 animate-spin" /> : 
            <Switch
              id={`automate-sync-${feedId}`}
              checked={isAutomated}
              onCheckedChange={handleToggle}
            />
        }
      </div>
    </div>
  );
} 