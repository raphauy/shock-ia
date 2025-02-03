"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ReminderForm, DeleteReminderForm } from "./reminder-forms"
import { PlusCircle, Pencil, Trash2 } from "lucide-react"
import { useState } from "react"
import { ContactDAO } from "@/services/contact-services"
import { ReminderDefinitionDAO } from "@/services/reminder-definition-services"

type Props= {
  id?: string
  contacts: ContactDAO[]
  reminderDefinitions: ReminderDefinitionDAO[]
}

const addTrigger= <Button><PlusCircle size={22} className="mr-2"/>Crear Recordatorio de prueba</Button>
const updateTrigger= <Pencil size={30} className="pr-2 hover:cursor-pointer"/>

export function ReminderDialog({ id, contacts, reminderDefinitions }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {id ? updateTrigger : addTrigger }
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{id ? 'Actualizar' : 'Crear'} Recordatorio</DialogTitle>
          <DialogDescription>
            {id ? 'Actualiza el recordatorio con los siguientes campos:' : 'Crea un nuevo recordatorio con los siguientes campos:'}
          </DialogDescription>
        </DialogHeader>
        <ReminderForm closeDialog={() => setOpen(false)} id={id} contacts={contacts} reminderDefinitions={reminderDefinitions} />
      </DialogContent>
    </Dialog>
  )
}
  
type DeleteProps= {
  id: string
  description: string
}

export function DeleteReminderDialog({ id, description }: DeleteProps) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Trash2 className="hover:cursor-pointer"/>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Eliminar Recordatorio</DialogTitle>
          <DialogDescription className="py-8">{description}</DialogDescription>
        </DialogHeader>
        <DeleteReminderForm closeDialog={() => setOpen(false)} id={id} />
      </DialogContent>
    </Dialog>
  )
}



