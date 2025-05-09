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
        <Reorder.Group values={fields} onReorder={(newOrder) => handleNewOrder(newOrder)}>
        {
            fields.map((field, index) => {
                return (
                    <div key={field.id} className="bg-white rounded-lg dark:bg-slate-800 border mt-2 flex items-center justify-between w-full text-muted-foreground border-b hover:bg-slate-50 min-h-12 px-2">
                        <Reorder.Item value={field}>
                            <div className="flex cursor-pointer w-full">
                                <Grip className="w-6 h-6 text-gray-500" />
                                <div className="flex flex-col justify-between w-full h-full">
                                    <div>
                                        <p className="whitespace-pre-line ml-2 font-bold">{field.name}</p>
                                        <p className="whitespace-pre-line ml-2 text-sm text-muted-foreground">{field.description}</p>
                                    </div>
                                    {field.showInContext && <Badge variant="secondaryWithBorder" className="w-fit">Contexto</Badge>}
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
                    </div>
                )
            })
        }
        </Reorder.Group>
    )
}
