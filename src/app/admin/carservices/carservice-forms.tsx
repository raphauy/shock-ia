"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { toast } from "@/components/ui/use-toast"
import { useEffect, useState } from "react"
import { deleteCarServiceAction, createOrUpdateCarServiceAction, getCarServiceDAOAction } from "./carservice-actions"
import { carServiceSchema, CarServiceFormValues } from '@/services/carservice-services'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Loader } from "lucide-react"

type Props= {
  id?: string
  closeDialog: () => void
}

export function CarServiceForm({ id, closeDialog }: Props) {
  const form = useForm<CarServiceFormValues>({
    resolver: zodResolver(carServiceSchema),
    defaultValues: {},
    mode: "onChange",
  })
  const [loading, setLoading] = useState(false)

  const onSubmit = async (data: CarServiceFormValues) => {
    setLoading(true)
    try {
      await createOrUpdateCarServiceAction(id ? id : null, data)
      toast({ title: id ? "CarService updated" : "CarService created" })
      closeDialog()
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (id) {
      getCarServiceDAOAction(id).then((data) => {
        if (data) {
          form.reset(data)
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
            name="nombreReserva"
            render={({ field }) => (
              <FormItem>
                <FormLabel>NombreReserva</FormLabel>
                <FormControl>
                  <Input placeholder="CarService's nombreReserva" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
      
          <FormField
            control={form.control}
            name="telefonoContacto"
            render={({ field }) => (
              <FormItem>
                <FormLabel>TelefonoContacto</FormLabel>
                <FormControl>
                  <Input placeholder="CarService's telefonoContacto" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
      
          <FormField
            control={form.control}
            name="fechaReserva"
            render={({ field }) => (
              <FormItem>
                <FormLabel>FechaReserva</FormLabel>
                <FormControl>
                  <Input placeholder="CarService's fechaReserva" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
      
          <FormField
            control={form.control}
            name="localReserva"
            render={({ field }) => (
              <FormItem>
                <FormLabel>LocalReserva</FormLabel>
                <FormControl>
                  <Input placeholder="CarService's localReserva" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
      
          <FormField
            control={form.control}
            name="marcaAuto"
            render={({ field }) => (
              <FormItem>
                <FormLabel>MarcaAuto</FormLabel>
                <FormControl>
                  <Input placeholder="CarService's marcaAuto" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
      
          <FormField
            control={form.control}
            name="modeloAuto"
            render={({ field }) => (
              <FormItem>
                <FormLabel>ModeloAuto</FormLabel>
                <FormControl>
                  <Input placeholder="CarService's modeloAuto" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
      
          <FormField
            control={form.control}
            name="matriculaAuto"
            render={({ field }) => (
              <FormItem>
                <FormLabel>MatriculaAuto</FormLabel>
                <FormControl>
                  <Input placeholder="CarService's matriculaAuto" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
      
          <FormField
            control={form.control}
            name="kilometraje"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Kilometraje</FormLabel>
                <FormControl>
                  <Input placeholder="CarService's kilometraje" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
      
          <FormField
            control={form.control}
            name="conversationId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>ConversationId</FormLabel>
                <FormControl>
                  <Input placeholder="CarService's conversationId" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          

        <div className="flex justify-end">
            <Button onClick={() => closeDialog()} type="button" variant={"secondary"} className="w-32">Cancel</Button>
            <Button type="submit" className="w-32 ml-2">
              {loading ? <Loader className="w-4 h-4 animate-spin" /> : <p>Save</p>}
            </Button>
          </div>
        </form>
      </Form>
    </div>     
  )
}

export function DeleteCarServiceForm({ id, closeDialog }: Props) {
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    if (!id) return
    setLoading(true)
    deleteCarServiceAction(id)
    .then(() => {
      toast({title: "CarService deleted" })
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
      <Button onClick={handleDelete} variant="destructive" className="w-32 gap-1 ml-2">
        { loading && <Loader className="w-4 h-4 animate-spin" /> }
        Delete  
      </Button>
    </div>
  )
}

