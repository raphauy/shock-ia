"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { toast } from "@/hooks/use-toast"
import { useEffect, useState } from "react"
import { deleteReminderDefinitionAction, createOrUpdateReminderDefinitionAction, getReminderDefinitionDAOAction } from "./reminderdefinition-actions"
import { ReminderDefinitionSchema, ReminderDefinitionFormValues } from '@/services/reminder-definition-services'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Loader } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"




type Props = {
  id?: string
  clientId: string
  closeDialog: () => void
}

export function ReminderDefinitionForm({ id, clientId, closeDialog }: Props) {
  const form = useForm<ReminderDefinitionFormValues>({
    resolver: zodResolver(ReminderDefinitionSchema),
    defaultValues: {
      name: "",
      description: "",
      message: "",
      minutesBefore: "30",
      clientId
    },
    mode: "onChange",
  })
  const [loading, setLoading] = useState(false)


  const onSubmit = async (data: ReminderDefinitionFormValues) => {
    setLoading(true)
    try {
      await createOrUpdateReminderDefinitionAction(id ? id : null, data)
      toast({ title: id ? "Plantilla de recordatorio actualizada" : "Plantilla de recordatorio creada" })
      closeDialog()
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (id) {
      getReminderDefinitionDAOAction(id).then((data) => {
        if (data) {
          form.reset({
            ...data,
            minutesBefore: data.minutesBefore.toString()
          })
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
    <div className="rounded-md">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre</FormLabel>
                <FormControl>
                  <Input placeholder="Nombre de la plantilla" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descripción</FormLabel>
                <FormControl>
                  <Input placeholder="Descripción de la plantilla" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="message"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Mensaje</FormLabel>
                <FormControl>
                  <Textarea rows={8} placeholder="Mensaje de la plantilla" {...field} />
                </FormControl>
                <FormMessage />
                <FormDescription>
                  <p>Variables disponibles:</p>
                  <p>- {`{nombre}`} para referirte al nombre del contacto.</p>
                  <p>- {`{fecha}`} para referirte a la fecha del recordatorio.</p>
                  <p>- {`{hora}`} para referirte a la hora del recordatorio.</p>
                  <p>- {`{fecha_y_hora}`} para referirte a la fecha y hora del recordatorio.</p>
                  <p>- {`{evento}`} para referirte al nombre del evento.</p>
                </FormDescription>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="minutesBefore"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tiempo antes en minutos</FormLabel>
                <FormControl>
                  <Input placeholder="Tiempo antes" {...field} />
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

export function DeleteReminderDefinitionForm({ id, closeDialog }: DeleteProps) {
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    if (!id) return
    setLoading(true)
    deleteReminderDefinitionAction(id)
    .then(() => {
      toast({title: "ReminderDefinition deleted" })
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
