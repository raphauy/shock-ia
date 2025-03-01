"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { toast } from "@/components/ui/use-toast"
import { useEffect, useState } from "react"
import { deleteBookingAction, createOrUpdateBookingAction, getBookingDAOAction, cancelBookingAction, blockSlotAction } from "./booking-actions"
import { bookingSchema, BookingFormValues } from '@/services/booking-services'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Loader } from "lucide-react"

type Props= {
  id?: string
  eventId: string
  clientId: string
  date: Date
  closeDialog: () => void
  maxSeats?: number
}

export function BookingForm({ id, eventId, clientId, date, closeDialog, maxSeats = 1 }: Props) {
  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      eventId,
      clientId,
      start: date,
      seats: "1",
      name: "",
      contact: "",
    },
    mode: "onChange",
  })
  const [loading, setLoading] = useState(false)

  const onSubmit = async (data: BookingFormValues) => {
    setLoading(true)
    try {
      await createOrUpdateBookingAction(id ? id : null, data)
      toast({ title: id ? "Booking updated" : "Booking created" })
      closeDialog()
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (id) {
      getBookingDAOAction(id).then((data) => {
        if (data) {
          form.setValue("start", data.start)
          form.setValue("seats", data.seats.toString())
          form.setValue("name", data.name)
          form.setValue("contact", data.contact)
          form.setValue("eventId", data.eventId)
          form.setValue("clientId", data.clientId)
        }
        Object.keys(form.getValues()).forEach((key: any) => {
          if (form.getValues(key) === null) {
            form.setValue(key, "")
          }
        })
      })
    }
  }, [form, id])

  return (
    <div className="p-4 bg-white rounded-md">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

        <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre</FormLabel>
                <FormControl>
                  <Input placeholder="Nombre del que reserva" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="contact"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Whatsapp</FormLabel>
                <FormControl>
                  <Input placeholder="Whatsapp del que reserva" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="seats"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cupos</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="Número de cupos" 
                    {...field} 
                    min="1" 
                    max={maxSeats.toString()} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
      
        <div className="flex justify-end">
            <Button onClick={() => closeDialog()} type="button" variant={"secondary"} className="w-32">Cancel</Button>
            <Button type="submit" className="w-32 ml-2">
              {loading ? <Loader className="h-4 w-4 animate-spin" /> : <p>Save</p>}
            </Button>
          </div>
        </form>
      </Form>
    </div>     
  )
}

type DeleteProps= {
  id: string
  closeDialog: () => void
}

export function DeleteBookingForm({ id, closeDialog }: DeleteProps) {
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    if (!id) return
    setLoading(true)
    deleteBookingAction(id)
    .then(() => {
      toast({title: "Reserva eliminada" })
    })
    .catch((error) => {
      toast({title: "Error", description: error.message, variant: "destructive"})
    })
    .finally(() => {
      setLoading(false)
      closeDialog && closeDialog()
    })
  }
  
  return (
    <div>
      <Button onClick={() => closeDialog && closeDialog()} type="button" variant={"secondary"} className="w-32">Cancel</Button>
      <Button onClick={handleDelete} variant="destructive" className="w-32 ml-2 gap-1">
        { loading && <Loader className="h-4 w-4 animate-spin" /> }
        Delete  
      </Button>
    </div>
  )
}

type CancelProps= {
  id: string
  closeDialog: () => void
}

export function CancelBookingForm({ id, closeDialog }: CancelProps) {
  const [loading, setLoading] = useState(false)

  async function handleCancel() {
    if (!id) return
    setLoading(true)
    cancelBookingAction(id)
    .then(() => {
      toast({title: "Reserva cancelada" })
    })
    .catch((error) => {
      toast({title: "Error", description: error.message, variant: "destructive"})
    })
    .finally(() => {
      setLoading(false)
      closeDialog && closeDialog()
    })
  }

  return (
    <div>
      <Button onClick={() => closeDialog && closeDialog()} type="button" variant={"secondary"} className="w-32">Cancelar</Button>
      <Button onClick={handleCancel} variant="destructive" className="ml-2 gap-1">
        { loading && <Loader className="h-4 w-4 animate-spin" /> }
        Cancelar reserva  
      </Button>
    </div>
  )
}

type BlockProps= {
  eventId: string
  start: Date
  end: Date
  closeDialog: () => void
  seats?: number
}

export function BlockSlotForm({ eventId, start, end, closeDialog, seats = 1 }: BlockProps) {
  const [loading, setLoading] = useState(false)

  async function handleBlock() {
    if (!eventId) return
    setLoading(true)
    blockSlotAction(eventId, start, end, seats)
    .then((ok) => {
      if (ok) {
        toast({title: `Slot bloqueado (${seats} cupo${seats !== 1 ? 's' : ''})` })
      } else {
        toast({title: "Error", description: "No se pudo bloquear el slot", variant: "destructive"})
      } 
    })
    .catch((error) => {
      toast({title: "Error", description: error.message, variant: "destructive"})
    })
    .finally(() => {
      setLoading(false)
      closeDialog && closeDialog()
    })
  }

  return (
    <div>
      <Button onClick={() => closeDialog && closeDialog()} type="button" variant={"secondary"} className="w-32">Cancelar</Button>
      <Button onClick={handleBlock} variant="destructive" className="ml-2 gap-1">
        { loading && <Loader className="h-4 w-4 animate-spin" /> }
        Bloquear {seats} cupo{seats !== 1 ? 's' : ''}
      </Button>
    </div>
  )
}