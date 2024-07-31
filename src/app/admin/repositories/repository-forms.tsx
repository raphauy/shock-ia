"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { toast } from "@/components/ui/use-toast"
import { useEffect, useState } from "react"
import { createRepositoryAction, deleteRepositoryAction, getRepositoryDAOAction } from "./repository-actions"
import { repositorySchema, RepositoryFormValues } from '@/services/repository-services'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Loader } from "lucide-react"
import { useRouter } from "next/navigation"

type Props= {
  closeDialog: () => void
}

export function RepositoryForm({ closeDialog }: Props) {
  const form = useForm<RepositoryFormValues>({
    resolver: zodResolver(repositorySchema),
    defaultValues: {
      name: "",
    },
    mode: "onChange",
  })
  const [loading, setLoading] = useState(false)
  const router= useRouter()

  const onSubmit = async (data: RepositoryFormValues) => {
    setLoading(true)
    try {
      const created=await createRepositoryAction(data.name)
      if (!created) {
        toast({ title: "Error", description: "Error al crear el repositorio", variant: "destructive" })
        return
      }
      toast({ title: "Repositorio creado" })
      closeDialog()
      router.push(`/admin/repositories/${created.id}`)
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 bg-white rounded-md">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre</FormLabel>
                <FormControl>
                  <Input placeholder="Registrar Lead" {...field} />
                </FormControl>
                <FormDescription>
                  El nombre del repositorio, lo podrás cambiar después
                </FormDescription>
                <FormMessage />
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
  redirect: boolean
}
export function DeleteRepositoryForm({ id, closeDialog, redirect }: DeleteProps) {
  const [loading, setLoading] = useState(false)
  const router= useRouter()

  async function handleDelete() {
    if (!id) return
    setLoading(true)
    deleteRepositoryAction(id)
    .then(() => {
      toast({title: "Repositorio eliminado" })
      if (redirect) {
        router.push(`/admin/repositories`)
      } else{
        window.location.reload()
      }
      
    })
    .catch((error) => {
      toast({title: "Error", description: error.message, variant: "destructive"})
    })
    .finally(() => {
      setLoading(false)
      closeDialog()
    })
  }
  
  return (
    <div>
      <Button onClick={() => closeDialog()} type="button" variant={"secondary"} className="w-32">Cancelar</Button>
      <Button onClick={handleDelete} variant="destructive" className="w-32 ml-2 gap-1">
        { loading && <Loader className="h-4 w-4 animate-spin" /> }
        Eliminar
      </Button>
    </div>
  )
}

