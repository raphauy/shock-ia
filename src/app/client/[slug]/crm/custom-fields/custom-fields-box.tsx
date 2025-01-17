"use client"

import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"
import { CustomFieldDAO } from "@/services/customfield-services"
import { Reorder } from "framer-motion"
import { Grip, Loader } from "lucide-react"
import { useEffect, useState } from "react"
import { deleteCustomFieldAction, updateCustomFieldsOrderAction } from "./customfield-actions"
import { CustomFieldDialog, DeleteCustomFieldDialog } from "./customfield-dialogs"

type Props= {
    initialFields: CustomFieldDAO[]
    clientId: string
}
export default function CustomFieldsBox({ initialFields, clientId }: Props) {

    const [fields, setFields] = useState(initialFields)
    const [loading, setLoading] = useState(false)
    const [deletingId, setDeletingId] = useState<string | null>(null)

    useEffect(() => {
        setFields(initialFields)
    }, [initialFields])    

    function handleNewOrder(newOrder: CustomFieldDAO[]) {
        updateCustomFieldsOrderAction(newOrder)
        .then(() => {
            setFields(newOrder)
        })
        .catch((error) => {
            toast({title: "Error", description: "Error al actualizar el orden de los campos", variant: "destructive"})
        })
    }

    function handleDelete(id: string) {
        setLoading(true)
        setDeletingId(id)
        deleteCustomFieldAction(id)
        .then(() => {
          toast({ title: "Campo eliminado" })
          setFields(fields.filter((note) => note.id !== id))
        })
        .catch((error) => {
          toast({title: "Error", description: error.message, variant: "destructive"})
        })
        .finally(() => {
          setLoading(false)
          setDeletingId(null)
        })
    }
    return (
        <Reorder.Group values={fields} onReorder={(newOrder) => handleNewOrder(newOrder)} className="">
        {
            fields.map((field, index) => {
                return (
                    <Reorder.Item key={field.id} value={field} className="rounded-lg border mt-2 flex w-full border-b hover:bg-muted p-3 min-h-[100px]">
                        <div className="flex cursor-pointer w-full py-2">
                            <Grip className="w-6 h-6 text-gray-500" />
                            <div className="flex flex-col w-full">
                                <p className="whitespace-pre-line ml-2 font-bold">{field.name}</p>
                                <p className="whitespace-pre-line ml-2 text-sm text-muted-foreground">{field.description}</p>
                            </div>                            
                        </div>
                        <div className="flex flex-col justify-between self-stretch items-center gap-2">
                            <Badge className="w-16 flex items-center justify-center">{field.type}</Badge>
                            <div className="flex items-center">                            
                                <CustomFieldDialog clientId={clientId} id={field.id} />
                                {
                                    loading && deletingId === field.id ? <Loader className="h-5 w-5 animate-spin" />
                                    : 
                                    <DeleteCustomFieldDialog id={field.id} description={`Seguro que quieres eliminar el campo ${field.name}?\nSe eliminarán todos los valores asociados a este campo para los contactos que los tengan.`} />
                                }
                            </div>
                        </div>
                        </Reorder.Item>
                        )
            })
        }
        </Reorder.Group>
    )
}
