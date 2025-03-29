"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { toast } from "@/hooks/use-toast"
import { useEffect, useState } from "react"
import { deleteReminderDefinitionAction, createOrUpdateReminderDefinitionAction, getReminderDefinitionDAOAction } from "./reminderdefinition-actions"
import { ReminderDefinitionSchema, ReminderDefinitionFormValues, ReminderDefinitionDAO } from '@/services/reminder-definition-services'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Loader } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"




type Props = {
  id?: string
  clientId: string
  past: boolean
  closeDialog: () => void
}

export function ReminderDefinitionForm({ id, clientId, past, closeDialog }: Props) {
  const form = useForm<ReminderDefinitionFormValues>({
    resolver: zodResolver(ReminderDefinitionSchema),
    defaultValues: {
      name: "",
      description: "",
      message: "",
      minutesDelay: "30",
      past: past
    },
    mode: "onChange",
  })
  const [loading, setLoading] = useState(false)


  const onSubmit = async (data: ReminderDefinitionFormValues) => {
    setLoading(true)
    try {
      await createOrUpdateReminderDefinitionAction(id ? id : null, data, clientId)
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
            name: data.name,
            description: data.description || "",
            message: data.message,
            minutesDelay: data.minutesDelay !== null ? data.minutesDelay.toString() : "",
            past: data.past
          })
        }
        Object.keys(form.getValues()).forEach((key: any) => {
          const formKey = key as keyof ReminderDefinitionFormValues;
          if (form.getValues(formKey) === null) {
            form.setValue(formKey, "" as any);
          }
        })
      })
    }
  }, [form, id])

  const delayLabel = past ? "Minutos antes del evento" : "Minutos después del abandono";

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
                  <Input placeholder="Descripción de la plantilla" {...field} value={field.value ?? ''}/>
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
                  <p>- {`{fecha}`} para referirte a la fecha del evento/abandono.</p>
                  <p>- {`{hora}`} para referirte a la hora del evento/abandono.</p>
                  <p>- {`{fecha_y_hora}`} para referirte a la fecha y hora del evento/abandono.</p>
                  {past && <p>- {`{evento}`} para referirte al nombre del evento.</p>}
                  {!past && <p>- {`{productosCantidad}`} para referirte a la cantidad de productos en la orden.</p>}
                </FormDescription>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="minutesDelay"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{delayLabel}</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="Minutos" {...field} />
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
