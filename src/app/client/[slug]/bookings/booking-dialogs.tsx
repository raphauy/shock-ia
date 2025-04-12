"use client"

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { EventType } from "@/lib/generated/prisma";
import { Ban, CheckCircle, CircleX, Pencil, PlusCircle, Trash2, XIcon } from "lucide-react";
import { useState } from "react";
import { BlockSlotForm, BookingForm, CancelBookingForm, ConfirmBookingForm, DeleteBookingForm } from "./booking-forms";

type Props= {
  id?: string
  eventId: string
  clientId: string
  date: Date
  eventType: EventType
  maxSeats?: number
}


const updateTrigger= <Pencil size={30} className="pr-2 hover:cursor-pointer"/>

export function BookingDialog({ id, eventId, clientId, date, eventType, maxSeats }: Props) {
  const [open, setOpen] = useState(false);

  const addTrigger= eventType === EventType.SINGLE_SLOT ? <PlusCircle className="h-4 w-4 text-green-500"/> 
  : 
  <Button size="sm" className="gap-2">
    <PlusCircle className="h-4 w-4"/>
    <p>Crear reserva</p>
  </Button>

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
        <BookingForm closeDialog={() => setOpen(false)} id={id} eventId={eventId} clientId={clientId} date={date} maxSeats={maxSeats} />
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
            <CircleX className="h-4 w-4"/>
          ) : (
            <Button variant="outline" size="sm" className="w-44">
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

type BlockProps= {
  eventId: string
  start: Date
  end: Date
  description: string
  size?: "sm" | "lg"
  seats?: number
}

export function BlockSlotDialog({ eventId, start, end, description, size, seats }: BlockProps) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {
          size === "sm" ? (
            <Ban className="h-4 w-4 text-red-500"/>
          ) : (
            <Button variant="outline" size="sm">
              <XIcon className="h-4 w-4 mr-2" />
                Bloquear slot
            </Button>
          )
        }
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Bloquear slot</DialogTitle>
          <DialogDescription className="py-8">{description}</DialogDescription>
        </DialogHeader>
        <BlockSlotForm eventId={eventId} start={start} end={end} closeDialog={() => setOpen(false)} seats={seats} />
      </DialogContent>
    </Dialog>
  )
}

type ConfirmProps= {
  bookingId: string
  phone: string
  clientHaveCRM: boolean
}

export function ConfirmBookingDialog({ bookingId, phone, clientHaveCRM }: ConfirmProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="w-44" disabled={phone.includes("@") || !clientHaveCRM}>
          <CheckCircle className="h-4 w-4 mr-2" />
          Confirmar reserva
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirmar Reserva</DialogTitle>
          <DialogDescription className="text-foreground text-md">
            Destinatario: {phone}
          </DialogDescription>
        </DialogHeader>
        <ConfirmBookingForm closeDialog={() => setOpen(false)} bookingId={bookingId} />
      </DialogContent>
    </Dialog>
  )
}
