"use client"

import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"
import { Loader } from "lucide-react"
import { useState } from "react"
import { closeConversationAction, deleteConversationAction } from "./actions"
import { useRouter } from "next/navigation"
import { getLastDataConversationAction } from "../actions"


type DeleteProps= {
  id?: string
  redirectUri: string
  closeDialog: () => void
}

export function DeleteConversationForm({ id, redirectUri, closeDialog }: DeleteProps) {
  const [loading, setLoading] = useState(false)
  const router= useRouter()

  async function handleDelete() {
    if (!id) return
    setLoading(true)
    deleteConversationAction(id)
    .then(() => {
      toast({title: "Conversación eliminada"})
      if (redirectUri.includes("/")){
        router.push(redirectUri)
      } else {
        // conversation page, redirectUri is the slug
        getLastDataConversationAction(redirectUri)
        .then(conversation => {
          if (conversation) {
            router.push(`/client/${redirectUri}/chats?id=${conversation.id}`)
          }
        })
        .catch(error => {
          toast({title: "Error", description: error.message, variant: "destructive"})
        })
      }
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
      <Button onClick={handleDelete} variant="destructive" className="w-32 gap-1 ml-2">
        { loading && <Loader className="w-4 h-4 animate-spin" /> }
        Eliminar  
      </Button>
    </div>
  )
}


type CloseProps= {
  id: string
  redirectUri: string
  closeDialog: () => void
}

export function CloseConversationForm({ id, redirectUri, closeDialog }: CloseProps) {
  const [loading, setLoading] = useState(false)
  const router= useRouter()

  async function handleClose() {
    setLoading(true)
    closeConversationAction(id)
    .then(() => {
      toast({title: "Conversación cerrada"})
      if (redirectUri.includes("/")){
        router.push(redirectUri)
      } else {
        // conversation page, redirectUri is the slug
        getLastDataConversationAction(redirectUri)
        .then(conversation => {
          if (conversation) {
            router.push(`/client/${redirectUri}/chats?id=${conversation.id}`)
          }
        })
        .catch(error => {
          toast({title: "Error", description: error.message, variant: "destructive"})
        })
      }
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
      <Button onClick={() => closeDialog && closeDialog()} type="button" variant={"secondary"} className="w-48">Cancelar</Button>
      <Button onClick={handleClose} className="w-48 gap-1 ml-2">
        { loading && <Loader className="w-4 h-4 animate-spin" /> }
        Cerrar conversación
      </Button>
    </div>
  )
}