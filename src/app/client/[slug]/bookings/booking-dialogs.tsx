"use client"

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CircleX, Pencil, PlusCircle, Trash2, XIcon } from "lucide-react";
import { useState } from "react";
import { BookingForm, CancelBookingForm, DeleteBookingForm } from "./booking-forms";

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
        <Button variant="outline" size="sm">
          <Trash2 className="h-4 w-4 mr-2 mb-0.5" />
          <p>Eliminar reserva</p>
        </Button>
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

type CancelProps= {
  id: string
  description: string
  size?: "sm" | "lg"
}

export function CancelBookingDialog({ id, description, size }: CancelProps) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {
          size === "sm" ? (
            <Button variant="ghost" size="icon" className="h-8 w-8 hover:border">
              <CircleX className="h-4 w-4"/>
            </Button>
          ) : (
            <Button variant="outline" size="sm">
              <XIcon className="h-4 w-4 mr-2" />
                Cancelar reserva
            </Button>
          )
        }
        
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancelar Reserva</DialogTitle>
          <DialogDescription className="py-8">{description}</DialogDescription>
        </DialogHeader>
        <CancelBookingForm id={id} closeDialog={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  )
}