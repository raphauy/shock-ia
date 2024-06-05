"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { toast } from "@/components/ui/use-toast"
import { useEffect, useState } from "react"
import { deleteSectionAction, createOrUpdateSectionAction, getSectionDAOAction } from "./section-actions"
import { sectionSchema, SectionFormValues } from '@/services/section-services'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Loader } from "lucide-react"

type Props= {
  id?: string
  closeDialog: () => void
}

export function SectionForm({ id, closeDialog }: Props) {
  const form = useForm<SectionFormValues>({
    resolver: zodResolver(sectionSchema),
    defaultValues: {},
    mode: "onChange",
  })
  const [loading, setLoading] = useState(false)

  const onSubmit = async (data: SectionFormValues) => {
    setLoading(true)
    try {
      await createOrUpdateSectionAction(id ? id : null, data)
      toast({ title: id ? "Section updated" : "Section created" })
      closeDialog()
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (id) {
      getSectionDAOAction(id).then((data) => {
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
            name="secuence"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Secuence</FormLabel>
                <FormControl>
                  <Input placeholder="Section's secuence" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
      
          <FormField
            control={form.control}
            name="tokenCount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>TokenCount</FormLabel>
                <FormControl>
                  <Input placeholder="Section's tokenCount" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
      
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <FormControl>
                  <Input placeholder="Section's status" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
      
          <FormField
            control={form.control}
            name="documentId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>DocumentId</FormLabel>
                <FormControl>
                  <Input placeholder="Section's documentId" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
      
          <FormField
            control={form.control}
            name="text"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Text</FormLabel>
                <FormControl>
                  <Input placeholder="Section's text" {...field} />
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

export function DeleteSectionForm({ id, closeDialog }: Props) {
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    if (!id) return
    setLoading(true)
    deleteSectionAction(id)
    .then(() => {
      toast({title: "Section deleted" })
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

