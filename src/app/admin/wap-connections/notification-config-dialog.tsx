"use client";

import { useState, useEffect } from "react";
import { Loader, Save, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { getNotificationNumbersAction, setNotificationNumbersAction } from "./actions";

export function NotificationConfigDialog() {
  const [open, setOpen] = useState(false);
  const [notificationNumbers, setNotificationNumbers] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Cargar los números de teléfono actuales cuando se abre el diálogo
  useEffect(() => {
    if (open) {
      loadNotificationNumbers();
    }
  }, [open]);

  async function loadNotificationNumbers() {
    setIsLoading(true);
    try {
      const numbers = await getNotificationNumbersAction();
      setNotificationNumbers(numbers);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los números de notificación",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const success = await setNotificationNumbersAction(notificationNumbers);
      if (success) {
        toast({
          title: "Configuración guardada",
          description: "Los números de notificación se han actualizado correctamente",
        });
        setOpen(false);
      } else {
        toast({
          title: "Error",
          description: "No se pudieron guardar los números de notificación",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Ocurrió un error al guardar la configuración",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Settings className="h-4 w-4" />
          Configurar notificaciones
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Configurar notificaciones</DialogTitle>
          <DialogDescription>
            Ingresa los números de teléfono que recibirán notificaciones cuando una instancia de WhatsApp se desconecte.
            Separa múltiples números con comas.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="grid gap-2">
            <Label htmlFor="phone-numbers">Números de teléfono</Label>
            <Input 
              id="phone-numbers"
              placeholder="+598xxxxxxxx, +598yyyyyyyy"
              value={notificationNumbers}
              onChange={(e) => setNotificationNumbers(e.target.value)}
            />
            <p className="text-sm text-muted-foreground">
              Formato internacional con código de país (ej: +598xxxxxxxx)
            </p>
          </div>
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button 
              variant="outline" 
              onClick={() => setOpen(false)}
              type="button"
            >
              Cancelar
            </Button>
            <Button 
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? <Loader className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Guardar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 