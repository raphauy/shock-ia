"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "@/components/ui/use-toast"
import { Loader, Pencil, Search, X } from "lucide-react"
import { useCallback, useMemo, useState } from 'react'
import { cn } from "@/lib/utils"
import { EventDAO } from "@/services/event-services"
import { setTagsOfEventAction } from "../../event-actions"


type Props = {
  event: EventDAO
}
export function EventTaggerComponent({ event }: Props) {
  const [newTag, setNewTag] = useState("")
  const [loading, setLoading] = useState(false)

  const handleAddTag = useCallback(() => {
    if (newTag.trim() && event) {
      setLoading(true)
      setTagsOfEventAction(event.id, [...event.tags, newTag.trim()])
      .then(() => {
        setNewTag("")        
        toast({title: "Etiqueta agregada", description: "Actualizando..." })
      })
      .catch(error => {
        toast({title: "Error", description: "Error al agregar la etiqueta", variant: "destructive" })
      })
      .finally(() => {
        setLoading(false)
      })
      
      setNewTag("")
    }
  }, [newTag, event])

  const handleRemoveTag = useCallback((tagToRemove: string) => {
    if (event) {
      setLoading(true)
      setTagsOfEventAction(event.id, event.tags.filter(tag => tag !== tagToRemove))
      .then(() => {
        toast({title: "Etiqueta eliminada", description: "Actualizando..." })
      })
      .catch(error => {
        toast({title: "Error", description: "Error al eliminar la etiqueta", variant: "destructive" })
      })
      .finally(() => {
        setLoading(false)
      })
    }
  }, [event])


  return (
    <div className="space-y-4 py-4">

      <div className="flex flex-wrap gap-2">
        {event.tags.length > 0 ? event.tags.map(tag => (
          <Badge key={tag} variant="secondary" className="text-sm py-1 px-2">
            {tag}
            <button onClick={() => handleRemoveTag(tag)} className="ml-2 text-xs">
              <X size={12} />
            </button>
          </Badge>
        )) : 'No hay etiquetas'}
      </div>
      <div className="flex items-center space-x-2">
        <Input
          placeholder="Nueva etiqueta"
          value={newTag}
          onChange={(e) => setNewTag(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              handleAddTag()
            }
          }}
        />
        <Button onClick={handleAddTag} className="gap-2 w-32">
          { loading && <Loader className="w-4 h-4 animate-spin" /> }
          <p>Agregar</p>

        </Button>
      </div>

      <p className="text-sm text-muted-foreground">La etiqueta &quot;agente&quot; deshabilita el bot automático de Shock IA al hacer la reserva</p>

    </div>
  )
}