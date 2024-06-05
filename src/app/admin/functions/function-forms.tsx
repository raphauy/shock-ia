"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { toast } from "@/components/ui/use-toast"
import { useEffect, useState } from "react"
import { deleteFunctionAction, createOrUpdateFunctionAction, getFunctionDAOAction } from "./function-actions"
import { functionSchema, FunctionFormValues } from '@/services/function-services'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Loader } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import Link from "next/link"

type Props= {
  id?: string
  closeDialog: () => void
  isAdmin?: boolean
}

export function FunctionForm({ id, closeDialog, isAdmin }: Props) {
  const form = useForm<FunctionFormValues>({
    resolver: zodResolver(functionSchema),
    defaultValues: {
      name: "",
      description: "",
      definition: `
{
  "name": "getDateOfNow",
  "description": "Función que devuelve la fecha y hora actuales.",
  "parameters": {
    "type": "object",
    "properties": {},
    "required": []
  }
}
`,
    },
    mode: "onChange",
  })
  const [loading, setLoading] = useState(false)

  const onSubmit = async (data: FunctionFormValues) => {
    setLoading(true)
    try {
      await createOrUpdateFunctionAction(id ? id : null, data)
      toast({ title: id ? "Function updated" : "Function created" })
      closeDialog()
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (id) {
      getFunctionDAOAction(id)
      .then((data) => {
        if (data) {
          form.setValue("name", data.name)
          data.definition && form.setValue("definition", data.definition)
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
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input placeholder="Function's name" {...field} disabled={!isAdmin} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
      
          <FormField
            control={form.control}
            name="definition"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Definition</FormLabel>
                <FormControl>
                  <Textarea rows={20} placeholder="Function's definition" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Link href="https://jsonlint.com" target="_blank">
            <Button type="button" variant="link">Validador JSON online</Button>
          </Link>
          
      

        <div className="flex justify-end">
            <Button onClick={() => closeDialog()} type="button" variant={"secondary"} className="w-32">Cancel</Button>
            <Button type="submit" variant="outline" className="w-32 ml-2">
              {loading ? <Loader className="w-4 h-4 animate-spin" /> : <p>Save</p>}
            </Button>
          </div>
        </form>
      </Form>
    </div>     
  )
}

export function DeleteFunctionForm({ id, closeDialog }: Props) {
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    if (!id) return
    setLoading(true)
    deleteFunctionAction(id)
    .then(() => {
      toast({title: "Function deleted" })
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

