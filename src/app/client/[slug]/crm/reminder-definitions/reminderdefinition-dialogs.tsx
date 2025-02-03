"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ReminderDefinitionForm, DeleteReminderDefinitionForm } from "./reminderdefinition-forms"
import { PlusCircle, Pencil, Trash2 } from "lucide-react"
import { useState } from "react"

type Props= {
  id?: string
  clientId: string
}

const addTrigger= <Button><PlusCircle size={22} className="mr-2"/>Crear Plantilla</Button>
const updateTrigger= <Pencil size={27} className="pr-2 hover:cursor-pointer text-muted-foreground"/>

export function ReminderDefinitionDialog({ id, clientId }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {id ? updateTrigger : addTrigger }
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{id ? 'Actualizar' : 'Crear'} plantilla de recordatorio</DialogTitle>
          <DialogDescription>
            {id ? 'Actualiza la plantilla de recordatorio con los siguientes campos:' : 'Crea una nueva plantilla de recordatorio con los siguientes campos:'}
          </DialogDescription>
        </DialogHeader>
        <ReminderDefinitionForm closeDialog={() => setOpen(false)} id={id} clientId={clientId} />
      </DialogContent>
    </Dialog>
  )
}
  
type DeleteProps= {
  id: string
  description: string
}

export function DeleteReminderDefinitionDialog({ id, description }: DeleteProps) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Trash2 size={20} className="hover:cursor-pointer text-muted-foreground"/>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Eliminar plantilla de recordatorio</DialogTitle>
          <DialogDescription className="py-8">{description}</DialogDescription>
        </DialogHeader>
        <DeleteReminderDefinitionForm closeDialog={() => setOpen(false)} id={id} />
      </DialogContent>
    </Dialog>
  )
}



