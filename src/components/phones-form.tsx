"use client"

import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"
import { Loader, Pencil } from "lucide-react"
import { useEffect, useState } from "react"

type Props= {
  eventId: string
  label?: string
  initialValue: string
  update: (eventId: string, newText: string) => Promise<boolean>
}

export function PhonesForm({ eventId, label, initialValue, update }: Props) {

  const [isEditing, setIsEditing] = useState(false)
  const toggleEdit = () => setIsEditing(!isEditing)

  const [loading, setLoading] = useState(false)
  const [text, setText] = useState(initialValue)

  useEffect(() => {
    setText(initialValue)
  }, [initialValue])

  async function onSubmit() {
    toggleEdit()
    if (text === initialValue) return
    
    setLoading(true)
    try {
      const ok= await update(eventId, text)
    
      if (ok) {
        toast({title: `${label} editado` })
      } else {
        setText(initialValue)
        toast({title: "Error al editar el texto", variant: "destructive"})
      }
    } catch (error: any) {
      setText(initialValue)
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

  return (
    <div className="mt-6 border bg-slate-100 rounded-md p-4 dark:bg-black">
      <div className="font-medium flex flex-col">
        {label ? <p className="border-b mb-2">{label}:</p> : "Texto:"}
            {
              isEditing ? (

                <div className="flex items-center justify-between gap-1 font-medium">
                  <input
                    name="title"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    autoFocus
                    disabled={!isEditing}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
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
                  variant="ghost" 
                  type="button" 
                  className="text-xl p-0 font-bold flex justify-between gap-4">
                  <><p>{initialValue}</p> <Pencil className="w-5 h-5 mb-1" /></>                      
                </Button>
              )
            }
    </div>
    </div>
  )
}