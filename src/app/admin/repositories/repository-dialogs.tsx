"use client"

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { PlusCircle, Trash2 } from "lucide-react";
import { useState } from "react";
import { DeleteRepositoryForm, RepositoryForm } from "./repository-forms";

export function RepositoryDialog() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="whitespace-nowrap">
          <PlusCircle size={22} className="mr-2"/>
          Crear Repositorio
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Crear Repositorio</DialogTitle>
        </DialogHeader>
        <RepositoryForm closeDialog={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  )
}
  
type DeleteProps= {
  id: string
  description: string
  withText: boolean
  clientCount: number
}

export function DeleteRepositoryDialog({ id, description, withText, clientCount }: DeleteProps) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
      {
        withText ? 
        <Button variant="destructive">Eliminar FC</Button>         
        :
        <Trash2 size={30} className="hover:cursor-pointer" />
      }
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Eliminar FC</DialogTitle>
          <DialogDescription className="py-8 whitespace-pre-wrap">{description}</DialogDescription>
        </DialogHeader>
        <DeleteRepositoryForm closeDialog={() => setOpen(false)} id={id} redirect={withText} clientCount={clientCount} />
      </DialogContent>
    </Dialog>
  )
}

