"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { DeleteConversationForm } from "./delete-form";

 
type DeleteProps= {
  id: string
  description: string
  redirectUri: string
  notifyDelete?: () => void
}

export function DeleteConversationDialog({ id, description, redirectUri, notifyDelete }: DeleteProps) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Trash2 className="w-5 h-5 hover:cursor-pointer"/>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Eliminar conversación</DialogTitle>
          <DialogDescription className="py-8">{description}</DialogDescription>
        </DialogHeader>
        <DeleteConversationForm closeDialog={() => setOpen(false)} id={id} redirectUri={redirectUri} />
      </DialogContent>
    </Dialog>
  )
}

interface CollectionProps{
  id: string
  title: string
}




  
