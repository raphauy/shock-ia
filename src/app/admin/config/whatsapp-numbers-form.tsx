"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { Loader } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"


const formSchema = z.object({  
  whatsappNumbers: z.string().optional(),
  clienteId: z.string().optional(),
})

export type WhatsappNumbersFormValues = z.infer<typeof formSchema>

const defaultValues: Partial<WhatsappNumbersFormValues> = {
  whatsappNumbers: "",
}

interface Props{
  id: string
  update: (json: WhatsappNumbersFormValues) => void
  whatsappNumbers: string
}

export function WhatsappNumbersForm({ id, update, whatsappNumbers }: Props) {
  const form = useForm<WhatsappNumbersFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
    mode: "onChange",
  })
  const router= useRouter()
  const [loading, setLoading] = useState(true)
  const [charCountSaved, setCharCountSaved] = useState(0)
  const [charCount, setCharCount] = useState(0)

  async function onSubmit(data: WhatsappNumbersFormValues) {

    setLoading(true)
    let message= null
    await update(data)
    message= "Números de WhatsApp guardados"
    toast({title: message })
    setCharCountSaved(charCount)
    setLoading(false)

  }

  useEffect(() => {
    form.setValue("whatsappNumbers", whatsappNumbers)
    form.setValue("clienteId", id)
    setCharCountSaved(prompt.length)
    setCharCount(prompt.length)
    setLoading(false)

  }, [id, whatsappNumbers, form])



  return (
    <div className="">
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="whatsappNumbers"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Números de WhatsApp separados por comas (formato: 59899123456):</FormLabel>
              <FormControl>                
                <Textarea
                  {...field}
                  placeholder="Números de WhatsApp para notificaciones del cliente"
                  onChange={(e) => {
                    // Aquí manejas el cambio de texto
                    const text = e.target.value;
                    setCharCount(text.length); // Actualizar el contador de caracteres
                    field.onChange(e); // Asegúrate de llamar también al onChange de field
                  }}
                  rows={5}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        /> 
      <div className="flex justify-end">
          <Button variant="outline" className={cn("w-32 ml-2", charCount !== charCountSaved && "text-white bg-red-500")} type="submit" disabled={charCount === charCountSaved} >
            {loading ? <Loader className="animate-spin" /> : <p>Guardar</p>}
          </Button>
        </div>
      </form>
    </Form>
   </div>
 )
}