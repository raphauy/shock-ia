"use client"

import { toast } from "@/components/ui/use-toast"
import { getEventTypeLabel } from "@/lib/utils"
import { EventType } from "@/lib/generated/prisma"
import { Loader } from "lucide-react"
import { useEffect, useState } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"

type Props= {
  id: string
  icon?: React.ReactNode
  label: string
  description?: string
  initialValue: number
  fieldName: string
  options: number[]
  update: (id: string, fieldName: string, value: number) => Promise<boolean>
  disabled?: boolean
}

export function SelectNumberForm({ id, icon, label, description, initialValue, fieldName, options, update, disabled }: Props) {

  const [loading, setLoading] = useState(false)
  const [value, setValue] = useState(initialValue)

  useEffect(() => {
    setValue(initialValue)
  }, [initialValue])

  async function onChange(value: number) {
    setValue(value)
    setLoading(true)
    const ok= await update(id, fieldName, value)
    setLoading(false)
    if (ok) {
      toast({title: `${label} actualizado`})
    } else {
      toast({title: `Error al actualizar ${label}`, variant: "destructive"})
    }
  }

  return (
    <div className="mt-6 border rounded-md p-4 w-full bg-muted">
      <div className="">
        <div className="flex items-center gap-2 mb-2 font-bold border-b">
          {icon && icon}
          {label}:
          { loading && <Loader className="animate-spin" /> }
        </div>
        <div className="">
          <Select
            value={value.toString()}
            onValueChange={(value) => {
              onChange(parseInt(value))
            }}
          >
            <SelectTrigger disabled={disabled}>
              <SelectValue placeholder={value} />
            </SelectTrigger>
            <SelectContent side="top">
              {options.map((option) => (
                <SelectItem key={option} value={option.toString()}>
                  {option} minutos
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        { description && <p className="text-sm mt-2 whitespace-pre-wrap">{description}</p> }
      </div>
    </div>
  )
}

