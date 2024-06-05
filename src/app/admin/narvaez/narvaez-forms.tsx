"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { toast } from "@/components/ui/use-toast"
import { useEffect, useState } from "react"
import { deleteNarvaezAction, createOrUpdateNarvaezAction, getNarvaezDAOAction } from "./narvaez-actions"
import { narvaezSchema, NarvaezFormValues } from '@/services/narvaez-services'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Loader } from "lucide-react"

type Props= {
  id: string
  closeDialog: () => void
}

export function NarvaezForm({ id, closeDialog }: Props) {
  const form = useForm<NarvaezFormValues>({
    resolver: zodResolver(narvaezSchema),
    defaultValues: {},
    mode: "onChange",
  })
  const [loading, setLoading] = useState(false)

  const onSubmit = async (data: NarvaezFormValues) => {
    setLoading(true)
    try {
      await createOrUpdateNarvaezAction(id ? id : null, data)
      toast({ title: id ? "Narvaez updated" : "Narvaez created" })
      closeDialog()
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    getNarvaezDAOAction(id).then((data) => {
      if (data) {
        data.idTrackeo && form.setValue("idTrackeo", data.idTrackeo)
        data.urlPropiedad && form.setValue("urlPropiedad", data.urlPropiedad)
        data.idPropiedad && form.setValue("idPropiedad", data.idPropiedad)
        data.resumenPedido && form.setValue("resumenPedido", data.resumenPedido)
        data.clasificacion && form.setValue("clasificacion", data.clasificacion)
        data.conversationId && form.setValue("conversationId", data.conversationId)        
      }
      Object.keys(form.getValues()).forEach((key: any) => {
        if (form.getValues(key) === null) {
          form.setValue(key, "")
        }
      })
    })
  }, [form, id])

  return (
    <div className="p-4 bg-white rounded-md">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          
          <FormField
            control={form.control}
            name="idTrackeo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>IdTrackeo</FormLabel>
                <FormControl>
                  <Input placeholder="Narvaez's idTrackeo" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
      
          <FormField
            control={form.control}
            name="urlPropiedad"
            render={({ field }) => (
              <FormItem>
                <FormLabel>UrlPropiedad</FormLabel>
                <FormControl>
                  <Input placeholder="Narvaez's urlPropiedad" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
      
          <FormField
            control={form.control}
            name="idPropiedad"
            render={({ field }) => (
              <FormItem>
                <FormLabel>IdPropiedad</FormLabel>
                <FormControl>
                  <Input placeholder="Narvaez's idPropiedad" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
      
          <FormField
            control={form.control}
            name="resumenPedido"
            render={({ field }) => (
              <FormItem>
                <FormLabel>ResumenPedido</FormLabel>
                <FormControl>
                  <Input placeholder="Narvaez's resumenPedido" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
      
          <FormField
            control={form.control}
            name="clasificacion"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Clasificacion</FormLabel>
                <FormControl>
                  <Input placeholder="Narvaez's clasificacion" {...field} />
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
                  <Input placeholder="Narvaez's conversationId" {...field} />
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

export function DeleteNarvaezForm({ id, closeDialog }: Props) {
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    if (!id) return
    setLoading(true)
    deleteNarvaezAction(id)
    .then(() => {
      toast({title: "Narvaez deleted" })
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

