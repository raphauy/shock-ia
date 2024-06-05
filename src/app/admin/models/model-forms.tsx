"use client"

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/use-toast"
import { ModelFormValues, modelSchema } from '@/services/model-services'
import { ProviderDAO } from "@/services/provider-services"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader } from "lucide-react"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { getProvidersDAOAction } from "../providers/provider-actions"
import { createOrUpdateModelAction, deleteModelAction, getModelDAOAction } from "./model-actions"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"

type Props= {
  id?: string
  closeDialog: () => void
}

export function ModelForm({ id, closeDialog }: Props) {
  const form = useForm<ModelFormValues>({
    resolver: zodResolver(modelSchema),
    defaultValues: {
      name: "",
      inputPrice: "0",
      outputPrice: "0",
      streaming: false,
      contextSize: "0",
    },
    mode: "onChange",
  })
  const [providers, setProviders] = useState<ProviderDAO[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    getProvidersDAOAction()
    .then((data) => {
      setProviders(data)
    })
    .finally(() => {
      setLoading(false)
    })

  }, [])

  const onSubmit = async (data: ModelFormValues) => {
    setLoading(true)
    try {
      await createOrUpdateModelAction(id ? id : null, data)
      toast({ title: id ? "Model updated" : "Model created" })
      closeDialog()
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (id) {
      getModelDAOAction(id).then((data) => {
        if (data) {
          form.setValue("name", data.name)
          form.setValue("inputPrice", data.inputPrice.toString())
          form.setValue("outputPrice", data.outputPrice.toString())
          form.setValue("providerId", data.providerId)
          form.setValue("streaming", data.streaming)
          form.setValue("contextSize", data.contextSize.toString())
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
            name="providerId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Proveedor:</FormLabel>
                <Select onValueChange={(value) => field.onChange(value)} value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un Proveedor" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {providers.map((provider => (
                      <SelectItem key={provider.id} value={provider.id}>{provider.name}</SelectItem>  
                    )))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre del modelo:</FormLabel>
                <FormControl>
                  <Input placeholder="gpt-4-1106-preview" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
      
          <FormField
            control={form.control}
            name="inputPrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Precio por 1 Millón de Prompt Tokens en USD:</FormLabel>
                <FormControl>
                  <Input placeholder="ej: 30" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="outputPrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Precio por 1 Millón de Completion Tokens en USD:</FormLabel>
                <FormControl>
                  <Input placeholder="ej: 60" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="contextSize"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ventana de contexto en tokens:</FormLabel>
                <FormControl>
                  <Input placeholder="ej: 32000" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="streaming"
            render={({ field }) => (
              <FormItem className="flex items-baseline justify-between rounded-lg border h-14 px-4 pt-1.5">
              <div className="space-y-0.5">
                  <FormLabel className="text-base">
                  El modelo soporta streaming?
                  </FormLabel>
              </div>
              <FormControl>
                  <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  />
              </FormControl>
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

export function DeleteModelForm({ id, closeDialog }: Props) {
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    if (!id) return
    setLoading(true)
    deleteModelAction(id)
    .then(() => {
      toast({title: "Model deleted" })
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

