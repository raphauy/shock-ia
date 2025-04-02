"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, ExternalLink } from "lucide-react";
import { getClientFunctionsAction } from "@/app/admin/fc-fee/actions";
import { cn } from "@/lib/utils";

interface Repository {
  name: string;
  url: string;
}

interface FunctionWithRepos {
  name: string;
  description: string | null;
  repositoryCount: number;
  repositories: Repository[];
}

interface ClientFunctionsDialogProps {
  clientId: string;
  clientName: string;
}

export default function ClientFunctionsDialog({
  clientId,
  clientName,
}: ClientFunctionsDialogProps) {
  const [functions, setFunctions] = useState<FunctionWithRepos[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleOpenChange = async (open: boolean) => {
    setIsOpen(open);

    if (open && functions.length === 0) {
      setIsLoading(true);
      try {
        const clientFunctions = await getClientFunctionsAction(clientId);
        setFunctions(clientFunctions);
      } catch (error) {
        console.error("Error al cargar las funciones:", error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Ver Funciones
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Funciones de {clientName}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[calc(80vh-100px)] mt-4 pr-4">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : functions.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              No hay funciones asociadas a este cliente.
            </p>
          ) : (
            <div className="space-y-6">
              {functions.map((func, index) => (
                <div key={index} className="p-4 rounded-md bg-muted">
                  <h3 className="font-medium text-lg">{func.name}</h3>
                  
                  {func.description && (
                    <p className={cn(
                      "text-sm text-muted-foreground mt-2 mb-4",
                      "line-clamp-4 overflow-hidden"
                    )}>
                      {func.description}
                    </p>
                  )}
                  
                  {func.repositories.length > 0 && (
                    <div className="mt-3">
                      <h4 className="text-sm font-medium mb-2">Detalles:</h4>
                      <ul className="space-y-2">
                        {func.repositories.map((repo, repoIdx) => (
                          <li key={repoIdx} className="bg-card p-2 rounded-sm text-sm flex justify-between items-center">
                            <span>{repo.name}</span>
                            {repo.url && (
                              <a 
                                href={repo.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="inline-flex items-center text-primary hover:underline"
                              >
                                <ExternalLink className="h-3.5 w-3.5 ml-1" />
                              </a>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
} 