"use client"

import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"
import { generateSlug } from "@/lib/utils"
import { Loader, Pencil } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"

type Props= {
  id: string
  initialValue: string
  fieldName: string
  update: (id: string, fieldName: string, value: string) => Promise<boolean>
}

export function SlugForm({ id, initialValue, fieldName, update }: Props) {

  const [isEditing, setIsEditing] = useState(false)
  const toggleEdit = () => setIsEditing(!isEditing)

  const [loading, setLoading] = useState(false)  
  const [slug, setSlug] = useState(initialValue)

  async function onSubmit() {
    if (slug === initialValue) {
      toggleEdit()
      return
    }
    setLoading(true)
    toggleEdit()
    const message= await update(id, fieldName, slug)
    
    if (message) {
      toast({title: "Slug editado" })
    } else {      
      toast({title: "Error al editar el slug", variant: "destructive"})
      setSlug(initialValue)
    }

    setLoading(false)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault()
      onSubmit()
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const slugged= generateSlug(e.target.value)
    setSlug(slugged)
  }


  return (
    <div className="mt-6 border bg-slate-100 rounded-md p-4 dark:bg-black">
      <div className="font-medium flex flex-col">
        <p className="border-b mb-2">
        Slug:
        </p>
        {
          isEditing ? (

            <div className="gap-1 font-medium">
              <input
                name="title"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                autoFocus
                disabled={!isEditing}
                value={slug}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                onBlur={onSubmit}
              />
            </div>

          ) : 
          loading ? (
            <div className="h-10">
              <Loader className="animate-spin" />
            </div>
          ) : (
            <Button 
              onClick={toggleEdit} 
              variant="ghost" 
              type="button" 
              className="text-xl p-0 flex justify-between gap-4">
              <><p>{initialValue}</p> <Pencil className="w-5 h-5 mb-1" /></>                      
            </Button>
          )
        }
    </div>
    </div>
  )
}