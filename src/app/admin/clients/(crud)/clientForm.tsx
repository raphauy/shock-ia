"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"

import { LoadingSpinnerChico } from "@/components/loadingSpinner"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { Client } from "@/lib/generated/prisma"
import { useEffect, useState } from "react"
import { getDataClient } from "./actions"
import { ModelDAO } from "@/services/model-services"
import { getModelsDAOAction } from "../../models/model-actions"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const formSchema = z.object({
  name: z.string()
    .min(2, { message: "Title must be at least 2 characters." })
    .max(60,{ message: "Title must not be longer than 60 characters." }),
  description: z.string().optional(),
  url: z.string().optional(),
  modelId: z.string(),
})

export type ClientFormValues = z.infer<typeof formSchema>

// This can come from your database or API.
const defaultValues: Partial<ClientFormValues> = {
  modelId: "",
  name: "",
  description: "",
  url: "",
}

interface Props{
  id?: string
  create: (data: ClientFormValues) => Promise<Client | null>
  update: (userId: string, json: ClientFormValues) => Promise<Client | null>
  closeDialog: () => void
}

export function ClientForm({ id, create, update, closeDialog }: Props) {
  const form = useForm<ClientFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
    mode: "onChange",
  })
  const [models, setModels] = useState<ModelDAO[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    getModelsDAOAction()
    .then((data) => {
      setModels(data)
    })
    .finally(() => {
      setLoading(false)
    })

  }, [])

  async function onSubmit(data: ClientFormValues) {

    setLoading(true)
    let message= null
    if (id) {
      await update(id, data)
      message= "Cliente editado"
    } else {
      await create(data)
      message= "Cliente creado"
    }
    setLoading(false)
      
    toast({title: message })

    closeDialog && closeDialog()
  }

  useEffect(() => {
    if (id) {
      getDataClient(id).then((data) => {
        if (!data) return
        form.setValue("name", data.nombre)
        form.setValue("description", data.descripcion)
        data.modelId && form.setValue("modelId", data.modelId)
        data.url && form.setValue("url", data.url)
      })
    }  
  }, [form, id])



  return (
    <div className="p-4 bg-white rounded-md">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre</FormLabel>
                <FormControl>
                  <Input placeholder="Nombre del cliente" {...field} />
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
                  <Textarea
                    placeholder="Descripción del cliente"                  
                    {...field}
                    rows={5}
                  />
                </FormControl>
                <FormDescription className="mx-1">
                  Este campo se usa para mostrar una descripción del cliente en el Dashboard del cliente, la
                  primera pantalla que el cliente ve cuando se loguea
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          /> 
          <FormField
            control={form.control}
            name="url"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sitio Web</FormLabel>
                <FormControl>
                  <Input placeholder="Sitio web del cliente" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="modelId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Modelo (LLM):</FormLabel>
                <Select onValueChange={(value) => field.onChange(value)} value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un Modelo" /> 
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {models.map((model => ( 
                      <SelectItem key={model.id} value={model.id}>{model.name}</SelectItem>  
                    )))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          
          <div className="flex justify-end">
            <Button onClick={() => closeDialog()} type="button" variant="secondary" className="w-32">Cancelar</Button>
            <Button type="submit" variant="outline" className="w-32 ml-2" >{loading ? <LoadingSpinnerChico /> : <p>Guardar</p>}</Button>
          </div>
        </form>
      </Form>     
    </div>
 )
}