"use client"

import { Button } from "@/components/ui/button"
import { toast } from "@/hooks/use-toast"
import { Loader } from "lucide-react"
import { useState } from "react"
import { deleteNotificationAction } from "./notification-actions"




type DeleteProps= {
  id: string
  closeDialog: () => void
}

export function DeleteNotificationForm({ id, closeDialog }: DeleteProps) {
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    if (!id) return
    setLoading(true)
    deleteNotificationAction(id)
    .then(() => {
      toast({title: "Notificación eliminada" })
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
