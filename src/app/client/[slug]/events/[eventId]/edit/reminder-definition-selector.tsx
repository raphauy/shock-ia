"use client"

import { addReminderDefinitionToEventAction, removeReminderDefinitionFromEventAction } from "@/app/client/[slug]/events/event-actions"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { toast } from "@/components/ui/use-toast"
import { ReminderDefinitionDAO } from "@/services/reminder-definition-services"
import { formatMinutesDelay } from "@/lib/utils"
import { Bell, Check, Loader, Plus, X } from "lucide-react"
import { useState } from "react"

type Props = {
  eventId: string
  eventReminderDefinitions: ReminderDefinitionDAO[]
  allReminderDefinitions: ReminderDefinitionDAO[]
}

export default function ReminderDefinitionSelector({ eventId, eventReminderDefinitions, allReminderDefinitions }: Props) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const handleToggleReminderDefinition = async (reminderDefinitionId: string, isSelected: boolean) => {
    try {
      setLoading(true)
      setLoadingId(reminderDefinitionId)
      if (isSelected) {
        await removeReminderDefinitionFromEventAction(eventId, reminderDefinitionId)
        toast({ title: "Recordatorio removido" })
      } else {
        await addReminderDefinitionToEventAction(eventId, reminderDefinitionId)
        toast({ title: "Recordatorio agregado" })
      }
    } catch (error) {
      console.error(error)
      toast({ title: "Error al actualizar recordatorios", variant: "destructive" })
    } finally {
      setLoading(false)
      setLoadingId(null)
    }
  }

  const selectedIds = eventReminderDefinitions.map(rd => rd.id)

  return (
    <div className="mt-4">
      <div className="flex flex-col space-y-4">
        {eventReminderDefinitions.length === 0 ? (
          <p className="text-sm text-muted-foreground">No hay recordatorios configurados</p>
        ) : (
          eventReminderDefinitions.map((rd) => {
            const isLoading = loadingId === rd.id
            return (
              <div key={rd.id} className="flex items-center justify-between gap-2 p-3 bg-muted rounded-lg group">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{rd.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatMinutesDelay(rd.minutesDelay, rd.past)}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleToggleReminderDefinition(rd.id, true)}
                  disabled={loading}
                >
                  {isLoading ? (
                    <Loader className="h-4 w-4 animate-spin" />
                  ) : (
                    <X className="h-4 w-4" />
                  )}
                </Button>
              </div>
            )
          })
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button className="mt-4 w-full">
            <Plus className="h-4 w-4 mr-2" />
            Gestionar Recordatorios
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Gestionar Recordatorios</DialogTitle>
            <DialogDescription>
              Selecciona los recordatorios que deseas activar para este evento.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-4">
              {allReminderDefinitions.map((rd) => {
                const isSelected = selectedIds.includes(rd.id)
                const isLoading = loadingId === rd.id
                return (
                  <div key={rd.id}>
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      disabled={loading}
                      onClick={() => handleToggleReminderDefinition(rd.id, isSelected)}
                    >
                      <div className="flex items-center gap-2 flex-1">
                        {isLoading ? (
                          <Loader className="h-5 w-5 animate-spin" />
                        ) : isSelected ? (
                          <Check className="h-5 w-5 text-green-500 font-bold" />
                        ) : (
                          <Plus className="h-5 w-5 text-muted-foreground" />
                        )}
                        <div className="flex flex-col items-start">
                          <span className="font-medium">{rd.name}</span>
                          <span className="text-sm text-muted-foreground">
                            {formatMinutesDelay(rd.minutesDelay, rd.past)}
                          </span>
                        </div>
                      </div>
                    </Button>
                    <Separator className="my-2" />
                  </div>
                )
              })}
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button 
              onClick={() => setOpen(false)}
              className="w-full"
              disabled={loading}
            >
              Terminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}