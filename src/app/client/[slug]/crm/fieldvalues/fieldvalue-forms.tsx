"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { toast } from "@/components/ui/use-toast"
import { useEffect, useState } from "react"
import { deleteFieldValueAction, createOrUpdateFieldValueAction, getFieldValueDAOAction } from "./fieldvalue-actions"
import { FieldValueSchema, FieldValueFormValues } from '@/services/fieldvalue-services'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Loader } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"




type Props = {
  id?: string
  contactId: string
  customFieldId: string
  customFieldName: string
  customFieldType: string
  update: () => void
  closeDialog: () => void
}

export function FieldValueForm({ id, contactId, customFieldId, customFieldName, customFieldType, update, closeDialog }: Props) {
  const form = useForm<FieldValueFormValues>({
    resolver: zodResolver(FieldValueSchema),
    defaultValues: {
      value: customFieldType === 'boolean' ? "false" : "",
      contactId,
      customFieldId
    },
    mode: "onChange",
  })
  const [loading, setLoading] = useState(false)

  const onSubmit = async (data: FieldValueFormValues) => {
    setLoading(true)
    try {
      await createOrUpdateFieldValueAction(id ? id : null, data)
      toast({ title: id ? "Valor actualizado" : "Valor creado" })
      update()
      closeDialog()
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (id) {
      getFieldValueDAOAction(id).then((data) => {
        if (data) {
          form.reset(data)
        }
        Object.keys(form.getValues()).forEach((key: any) => {
          if (form.getValues(key) === null) {
            form.setValue(key, customFieldType === 'boolean' ? "false" : "")
          }
        })
      })
    }
  }, [form, id, customFieldType])

  return (
    <div className="rounded-md">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="value"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{customFieldName}</FormLabel>
                <FormControl>
                  <div>
                    {(customFieldType === 'string' || customFieldType === 'list') && (
                      <Input placeholder="Valor del campo" {...field} />
                    )}
                    {customFieldType === 'number' && (
                      <Input 
                        type="number" 
                        placeholder="Valor numérico" 
                        {...field}
                        value={field.value || ""}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === "" || !isNaN(Number(value))) {
                            field.onChange(value);
                          }
                        }}
                        onKeyDown={(e) => {
                          const invalidChars = ['+', '-', 'e', 'E'];
                          if (invalidChars.includes(e.key)) {
                            e.preventDefault();
                          }
                        }}
                      />
                    )}
                    {customFieldType === 'boolean' && (
                      <div className="flex items-center space-x-2">
                        <span className={cn(`text-sm`, field.value === "false" ? "font-bold" : "")}>NO</span>
                        <Switch
                          checked={field.value === "true"}
                          onCheckedChange={(checked) => field.onChange(checked.toString())}
                        />
                        <span className={cn(`text-sm`, field.value === "true" ? "font-bold" : "")}>SI</span>
                      </div>
                    )}
                  </div>
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

export function DeleteFieldValueForm({ id, closeDialog }: DeleteProps) {
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    if (!id) return
    setLoading(true)
    deleteFieldValueAction(id)
    .then(() => {
      toast({title: "Valor del campo eliminado" })
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
