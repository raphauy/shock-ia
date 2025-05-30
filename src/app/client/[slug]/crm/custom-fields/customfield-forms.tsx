"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { toast } from "@/components/ui/use-toast"
import { useEffect, useState } from "react"
import { deleteCustomFieldAction, createOrUpdateCustomFieldAction, getCustomFieldDAOAction } from "./customfield-actions"
import { CustomFieldSchema, CustomFieldFormValues } from '@/services/customfield-services'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form"
import { Loader } from "lucide-react"
import { Select, SelectItem, SelectContent, SelectValue, SelectTrigger } from "@/components/ui/select"
import { FieldType } from "@/lib/generated/prisma"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"




type Props = {
  id?: string
  clientId: string
  closeDialog: () => void
}

export function CustomFieldForm({ id, clientId, closeDialog }: Props) {
  const form = useForm<CustomFieldFormValues>({
    resolver: zodResolver(CustomFieldSchema),
    defaultValues: {
      name: "",
      description: "",
      type: FieldType.string,
      showInContext: true,
      clientId: clientId
    },
    mode: "onChange",
  })
  const [loading, setLoading] = useState(false)


  const onSubmit = async (data: CustomFieldFormValues) => {
    setLoading(true)
    try {
      await createOrUpdateCustomFieldAction(id ? id : null, data)
      toast({ title: id ? "Campo personalizado actualizado" : "Campo personalizado creado" })
      closeDialog()
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (id) {
      getCustomFieldDAOAction(id).then((data) => {
        if (data) {
          const formData: CustomFieldFormValues = {
            name: data.name,
            description: data.description || undefined,
            type: data.type,
            showInContext: data.showInContext,
            clientId: data.clientId
          }
          form.reset(formData)
        }
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
                  <Input placeholder="Nombre del campo personalizado" {...field} />
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
                  <Textarea rows={3} placeholder="Descripción del campo personalizado" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo</FormLabel>
                <FormControl>
                  <Select onValueChange={(value) => field.onChange(value)} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un Tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.values(FieldType).map((type) => (
                        <SelectItem key={type} value={type}><Badge className="w-16 flex justify-center">{type}</Badge></SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="showInContext"
            render={({ field }) => (
              <FormItem className="flex flex-col rounded-lg border px-4 py-3">
                <div className="flex items-baseline justify-between">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      Mostrar en contexto?
                    </FormLabel>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </div>
                <FormDescription>
                  Si está marcado este campo, se adjuntará al contexto de cada conversación, la información de este campo, siempre y cuando el contacto tenga algún valor en este campo.
                </FormDescription>
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

export function DeleteCustomFieldForm({ id, closeDialog }: DeleteProps) {
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    if (!id) return
    setLoading(true)
    deleteCustomFieldAction(id)
    .then(() => {
      toast({title: "CustomField deleted" })
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
