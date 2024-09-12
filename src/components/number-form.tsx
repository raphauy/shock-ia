"use client"

import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"
import { Loader, Pencil } from "lucide-react"
import { useEffect, useState } from "react"

type Props= {
  id: string
  icon?: React.ReactNode
  label: string
  initialValue: number
  fieldName: string
  update: (id: string, fieldName: string, value: number) => Promise<boolean>
  disabled?: boolean
}

export function NumberForm({ id, icon, label, initialValue, fieldName, update, disabled }: Props) {

  const [isEditing, setIsEditing] = useState(false)
  const toggleEdit = () => setIsEditing(!isEditing)

  const [loading, setLoading] = useState(false)
  const [value, setValue] = useState(initialValue)

  useEffect(() => {
    setValue(initialValue)
  }, [initialValue])

  async function onSubmit() {
    toggleEdit()
    if (value === initialValue) return
    
    setLoading(true)
    try {
      const ok= await update(id, fieldName, value)
    
      if (ok) {
        toast({title: `${label} editado` })
      } else {
        setValue(initialValue)
        toast({title: "Error al editar", variant: "destructive"})
      }
    } catch (error: any) {
      setValue(initialValue)
      toast({title: "Error al editar", description: error.message, variant: "destructive"})
    } finally {
      setLoading(false)
    }
  }

  function handleEnterKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault()
      onSubmit()
    }
  }

  if (!initialValue) return <div>Valor inicial de {label} no encontrado</div>



  return (
    <div className="mt-6 border bg-slate-100 rounded-md p-4 dark:bg-black w-full">
      <div className="font-medium flex flex-col">
        <div className="flex items-center gap-2 border-b mb-2">
          {icon && icon}
          {label}
        </div>
          {
            isEditing ? (

              <div className="flex items-center justify-between gap-1 font-medium">
                <input
                  name="value"
                  type="number"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  autoFocus
                  disabled={!isEditing || disabled}
                  value={value}
                  onChange={(e) => setValue(parseInt(e.target.value))}
                  onKeyDown={handleEnterKey}
                  onBlur={onSubmit}
                />
              </div>

            ) : 
            loading ? (
              <div className="h-10 w-full flex items-center justify-center">
                <Loader className="animate-spin" />
              </div>
            ) : (
              <Button 
                onClick={toggleEdit} 
                disabled={disabled}
                variant="ghost" 
                type="button" 
                className="text-xl p-0 font-bold flex justify-between gap-4">
                <><p>{initialValue}</p> {!disabled && <Pencil className="w-5 h-5 mb-1" />}</>                      
              </Button>
            )
          }
    </div>
    </div>
  )
}