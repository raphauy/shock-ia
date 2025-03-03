"use client"

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/use-toast"
import { BookingFormValues, bookingSchema } from '@/services/booking-services'
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader } from "lucide-react"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { blockSlotAction, cancelBookingAction, ConfirmBookingAction, createOrUpdateBookingAction, deleteBookingAction, getBookingDAOAction, getConfirmationMessageAction } from "./booking-actions"
import { checkValidPhone } from "@/lib/utils"

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
    // check if the phone is valid
    if (!checkValidPhone(data.contact)) {
      toast({ title: "Error", description: "El teléfono no es válido, el formato debe ser +598991234567 o 598991234567", variant: "destructive" })
      return
    }
    setLoading(true)
    try {
      await createOrUpdateBookingAction(id ? id : null, data)
      toast({ title: id ? "Reserva actualizada" : "Reserva creada" })
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
            <Button onClick={() => closeDialog()} type="button" variant={"secondary"} className="w-32">Cancelar</Button>
            <Button type="submit" className="w-32 ml-2">
              {loading ? <Loader className="h-4 w-4 animate-spin" /> : <p>Guardar</p>}
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
      <Button onClick={() => closeDialog && closeDialog()} type="button" variant={"secondary"} className="w-32">Cancelar</Button>
      <Button onClick={handleDelete} variant="destructive" className="w-32 ml-2 gap-1">
        { loading && <Loader className="h-4 w-4 animate-spin" /> }
        Eliminar  
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

type ConfirmProps = {
  bookingId: string
  closeDialog: () => void
}

export function ConfirmBookingForm({ bookingId, closeDialog }: ConfirmProps) {

  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")

  useEffect(() => {
    getConfirmationMessageAction(bookingId)
    .then((message: string) => {
      setMessage(message)
    })
  }, [bookingId])

  function handleSubmit() {
    setLoading(true)
    ConfirmBookingAction(bookingId, message)
    .then(() => {
      toast({title: "Confirmación enviada" })
      closeDialog()
    })
    .catch((error) => {
      toast({title: "Error", description: error.message, variant: "destructive"})
    })
    .finally(() => {
      setLoading(false)
    })
  }

  return (
    <div className="space-y-4">      
      <p className="italic">{message}</p>
      <p>{!message && "No se pudo generar el mensaje de confirmación, probablemente el evento no tenga una plantilla de confirmación configurada."}</p>
      <div className="flex justify-end">
        <Button onClick={() => closeDialog && closeDialog()} type="button" variant={"secondary"} className="w-32">Cancelar</Button>
        <Button onClick={handleSubmit} disabled={!message} className="w-32 ml-2 gap-1">
          { loading && <Loader className="h-4 w-4 animate-spin" /> }
          Confirmar  
        </Button>
      </div>
    </div>
  )

}
