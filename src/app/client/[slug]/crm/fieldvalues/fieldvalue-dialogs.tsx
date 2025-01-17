"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { FieldValueForm, DeleteFieldValueForm } from "./fieldvalue-forms"
import { PlusCircle, Pencil, Trash2 } from "lucide-react"
import { useState } from "react"

type Props= {
  id?: string
  contactId: string
  customFieldId: string
  customFieldName: string
  customFieldType: string
  update: () => void
}

const addTrigger= <PlusCircle size={20} className="hover:cursor-pointer"/>
const updateTrigger= <Pencil size={20} className="hover:cursor-pointer"/>

export function FieldValueDialog({ id, contactId, customFieldId, customFieldName, customFieldType, update }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {id ? updateTrigger : addTrigger }
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{id ? 'Actualizar' : 'Crear'} {customFieldName}</DialogTitle>
          <DialogDescription>
            {id ? 'Actualiza el valor de este campo personalizado:' : 'Crea un nuevo valor para este campo personalizado:'}
          </DialogDescription>
        </DialogHeader>
        <FieldValueForm closeDialog={() => setOpen(false)} id={id} contactId={contactId} customFieldId={customFieldId} customFieldName={customFieldName} customFieldType={customFieldType} update={update} />
      </DialogContent>
    </Dialog>
  )
}
  
type DeleteProps= {
  id: string
  description: string
}

export function DeleteFieldValueDialog({ id, description }: DeleteProps) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Trash2 className="hover:cursor-pointer"/>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete FieldValue</DialogTitle>
          <DialogDescription className="py-8">{description}</DialogDescription>
        </DialogHeader>
        <DeleteFieldValueForm closeDialog={() => setOpen(false)} id={id} />
      </DialogContent>
    </Dialog>
  )
}



