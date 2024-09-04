"use client"

import { useEffect, useState } from "react";
import { ArrowLeftRight, ChevronsLeft, ChevronsRight, Loader, Pencil, PlusCircle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { toast } from "@/components/ui/use-toast";
import { BookingForm, DeleteBookingForm } from "./booking-forms"
import { getBookingDAOAction } from "./booking-actions"

type Props= {
  id?: string
  eventId: string
  clientId: string
  date: Date
  availableSeats: number  
}

const addTrigger= <Button variant="ghost" size="icon" className="h-8 w-8 hover:border"><PlusCircle className="h-4 w-4"/></Button>
const updateTrigger= <Pencil size={30} className="pr-2 hover:cursor-pointer"/>

export function BookingDialog({ id, eventId, clientId, date, availableSeats }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {id ? updateTrigger : addTrigger }
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{id ? 'Actualizar' : 'Crear'} Reserva
          </DialogTitle>
        </DialogHeader>
        <BookingForm closeDialog={() => setOpen(false)} id={id} eventId={eventId} clientId={clientId} date={date} availableSeats={availableSeats} />
      </DialogContent>
    </Dialog>
  )
}
  
type DeleteProps= {
  id: string
  description: string
}

export function DeleteBookingDialog({ id, description }: DeleteProps) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Trash2 className="hover:cursor-pointer"/>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Eliminar Reserva</DialogTitle>
          <DialogDescription className="py-8">{description}</DialogDescription>
        </DialogHeader>
        <DeleteBookingForm closeDialog={() => setOpen(false)} id={id} />
      </DialogContent>
    </Dialog>
  )
}

interface CollectionProps{
  id: string
  title: string
}




  
