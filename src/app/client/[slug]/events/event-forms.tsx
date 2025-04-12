"use client"

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/use-toast"
import { NameFormValues, nameSchema } from '@/services/event-services'
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader } from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { createEventAction, deleteEventAction } from "./event-actions"
import { EventType } from "@/lib/generated/prisma"

type Props= {
  eventType: EventType
  closeDialog: () => void
}

export function EventForm({ eventType, closeDialog }: Props) {
  const form = useForm<NameFormValues>({
    resolver: zodResolver(nameSchema),
    defaultValues: {
      name: "",
    },
    mode: "onChange",
  })
  const [loading, setLoading] = useState(false)

  const params= useParams()
  const clientSlug= params.slug as string

  const router= useRouter()

  const onSubmit = async (data: NameFormValues) => {
    setLoading(true)
    try {
      const created= await createEventAction(clientSlug, data.name, eventType)
      toast({ title: "Evento creado. Redirigiendo..." })
      closeDialog()
      router.push(`/client/${clientSlug}/events/${created?.id}/edit`)
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 bg-white rounded-md">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre del evento</FormLabel>
                <FormControl>
                  <Input placeholder="Nombre del evento" {...field} />
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

export function DeleteEventForm({ id, closeDialog }: DeleteProps) {
  const [loading, setLoading] = useState(false)

  const router= useRouter()
  const params= useParams()
  const clientSlug= params.slug as string

  async function handleDelete() {
    if (!id) return
    setLoading(true)
    deleteEventAction(id)
    .then(() => {
      toast({title: "Evento eliminado" })
      router.push(`/client/${clientSlug}/events`)
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

