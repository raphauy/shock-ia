"use client"

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/use-toast"
import { ClientUserFormValues, ClientUserSchema } from "@/services/user-service"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader } from "lucide-react"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { createOrUpdateClientUserAction, deleteClientUserAction, getUserDAOAction } from "./client-users-actions"

type Props = {
  id?: string
  clientId: string
  closeDialog: () => void
}

export function ClientUserForm({ id, clientId, closeDialog }: Props) {
  const form = useForm<ClientUserFormValues>({
    resolver: zodResolver(ClientUserSchema),
    defaultValues: {
      name: "",
      email: "",
      clientId: clientId
    },
    mode: "onChange",
  })
  const [loading, setLoading] = useState(false)

  const onSubmit = async (data: ClientUserFormValues) => {
    setLoading(true)
    try {
      await createOrUpdateClientUserAction(id ? id : null, data)
      toast({ 
        title: id ? "Usuario actualizado" : "Usuario creado"
      })
      closeDialog()
    } catch (error: any) {
      console.error('Error:', error)
      toast({ 
        title: "Error", 
        description: error.message || "Ocurrió un error al procesar la solicitud",
        variant: "destructive" 
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (id) {
      getUserDAOAction(id).then((data) => {
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
                  <Input placeholder="Nombre" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Email" 
                    {...field} 
                    value={field.value?.toLowerCase()}
                    onChange={e => field.onChange(e.target.value.toLowerCase())}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-end">
            <Button onClick={() => closeDialog()} type="button" variant={"secondary"} className="w-32">Cancel</Button>
            <Button 
              type="submit" 
              className="w-32 ml-2"
            >
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

export function DeleteClientUserForm({ id, closeDialog }: DeleteProps) {
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    if (!id) return
    setLoading(true)
    try {
      await deleteClientUserAction(id)
      toast({ title: "Usuario eliminado" })
      closeDialog && closeDialog()
    } catch (error: any) {
      console.error('Error:', error)
      toast({ 
        title: "Error", 
        description: error.message || "Ocurrió un error al eliminar el usuario",
        variant: "destructive" 
      })
    } finally {
      setLoading(false)
    }
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
