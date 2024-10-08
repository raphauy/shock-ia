"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "@/components/ui/use-toast"
import { Loader, Pencil, Search, X } from "lucide-react"
import { useCallback, useMemo, useState } from 'react'
import { FunctionData } from './page'
import { cn } from "@/lib/utils"
import { setTagsOfFunctionAction } from "../functions/function-actions"


type FunctionTaggerProps = {
  functions?: FunctionData[]
}

const exampleFunctions: FunctionData[] = [
  { id: "1", label: "Función 1", tags: ["tag1", "tag2"], haveChatwoot: true },
  { id: "2", label: "Función 2", tags: ["tag3"], haveChatwoot: false },
  { id: "3", label: "Función 3", tags: [], haveChatwoot: true },
]

export function FunctionTaggerComponent({ functions = exampleFunctions }: FunctionTaggerProps) {
  //const [functions, setFunctions] = useState<FunctionData[]>(initialFunctions)
  const [editingFunction, setEditingFunction] = useState<FunctionData | null>(null)
  const [newTag, setNewTag] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(false)

  const filteredFunctions = useMemo(() => {
    return functions.filter(func => 
      func.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      func.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    )
  }, [functions, searchTerm])

  const handleEditFunction = useCallback((func: FunctionData) => {
    setEditingFunction({ ...func })
    setIsDialogOpen(true)
  }, [])

  const handleAddTag = useCallback(() => {
    if (newTag.trim() && editingFunction) {
      setEditingFunction(prev => ({
        ...prev!,
        tags: [...prev!.tags, newTag.trim()]
      }))
      setNewTag("")
    }
  }, [newTag, editingFunction])

  const handleRemoveTag = useCallback((tagToRemove: string) => {
    if (editingFunction) {
      setEditingFunction(prev => ({
        ...prev!,
        tags: prev!.tags.filter(tag => tag !== tagToRemove)
      }))
    }
  }, [editingFunction])

  const handleSaveFunction = useCallback(() => {
    if (editingFunction) {
      setLoading(true)
      setTagsOfFunctionAction(editingFunction.id, editingFunction.tags)
      .then(() => {
        //setFunctions(prev => prev.map(f => f.id === editingFunction.id ? editingFunction : f))     

        setEditingFunction(null)
        setIsDialogOpen(false)
        toast({
          title: "Éxito",
          description: "Los cambios se han guardado correctamente.",
        })
      })
      .catch(error => {
        toast({
          title: "Error",
          description: "Hubo un error al guardar los cambios.",
        })
      })
      .finally(() => {
        setLoading(false)
      })
    }
  }, [editingFunction])

  const handleCloseDialog = useCallback(() => {
    setEditingFunction(null)
    setIsDialogOpen(false)
  }, [])

  return (
    <div className="space-y-4">
      <div className="relative">
        <Input
          placeholder="Buscar funciones o etiquetas..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 pr-4 w-full"
        />
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
        {searchTerm && (
          <Button
            variant="outline"
            onClick={() => setSearchTerm("")}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-sm h-8 px-2"
          >
            <X className="h-4 w-4 mr-1" />
            Limpiar
          </Button>
        )}
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Función (de tipo Lead)</TableHead>
            <TableHead>Etiquetas</TableHead>
            <TableHead>Editar</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredFunctions.map(func => (
            <TableRow key={func.id}>
              <TableCell className={cn(func.haveChatwoot && "font-bold")}>{func.label}</TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-2">
                  {func.tags.map(tag => (
                    <Badge key={tag} >{tag}</Badge>
                  ))}
                </div>
              </TableCell>
              <TableCell>
                <Button variant="ghost" size="icon" onClick={() => handleEditFunction(func)} disabled={!func.haveChatwoot}>
                  <Pencil className="h-5 w-5" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={isDialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingFunction?.label || 'la función'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
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
              <Button onClick={handleAddTag}>Agregar</Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {editingFunction?.tags.map(tag => (
                <Badge key={tag} variant="secondary" className="text-sm py-1 px-2">
                  {tag}
                  <button onClick={() => handleRemoveTag(tag)} className="ml-2 text-xs">
                    <X size={12} />
                  </button>
                </Badge>
              )) || 'No hay etiquetas'}
            </div>
          </div>
          <Button onClick={handleSaveFunction}>
            { loading && <Loader className="h-5 w-5 animate-spin" /> }
            Guardar etiqueta(s)
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  )
}