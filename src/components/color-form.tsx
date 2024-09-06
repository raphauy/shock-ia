"use client"

import { toast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"
import { Loader } from "lucide-react"
import { useEffect, useState } from "react"
import { RadioGroup, RadioGroupItem } from "./ui/radio-group"

type Props= {
  id: string
  icon?: React.ReactNode
  label: string
  initialValue: string
  fieldName: string
  colors: string[]
  update: (id: string, fieldName: string, value: string) => Promise<boolean>
}

export function ColorForm({ id, icon, label, initialValue, fieldName, colors, update }: Props) {

  const [loading, setLoading] = useState(false)
  const [value, setValue] = useState(initialValue)

  useEffect(() => {
    setValue(initialValue)
  }, [initialValue])

  async function onSelect(value: string) {
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
    <div className="mt-6 border rounded-md p-4 w-full">
      <div className="">
        <div className="flex items-center gap-2 mb-2 font-bold border-b">
          {icon && icon}
          {label}:
          { loading && <Loader className="animate-spin" /> }
        </div>
        <div className="">
          <RadioGroup
            onValueChange={onSelect}
            defaultValue={value}
            className="flex gap-2 pt-2"
          >
            {colors.map((color) => (
              
              <div key={color} onClick={() => onSelect(color)} className="flex items-center justify-between w-full">
                <RadioGroupItem value={color} className="sr-only" />
                <div className={cn("mx-auto rounded-md border-2 border-muted p-1 hover:border-accent cursor-pointer", value === color && "border-primary")}>
                  <div className={`w-6 h-6 rounded-full bg-[${color}]`} />
                </div>
              </div>
            ))}
          </RadioGroup>
        </div>
      </div>
    </div>
  )
}


{/* <FormField
control={form.control}
name="color"
render={({ field }) => (
  <FormItem className="space-y-1">
    <FormLabel>Color</FormLabel>
    <FormMessage />
    <RadioGroup
      onValueChange={field.onChange}
      defaultValue={field.value}
      className="flex gap-2 pt-2"
    >
      <FormItem>
        <FormLabel>
          <FormControl>
            <RadioGroupItem value="#bfe1ff" className="sr-only" />
          </FormControl>
          <div className={cn("flex gap-1 items-center rounded-md border-2 border-muted p-1 hover:border-accent cursor-pointer", field.value === "#bfe1ff" && "border-primary")}>
            <div className="w-6 h-6 rounded-full bg-[#bfe1ff]" /> Azul
          </div>
        </FormLabel>
      </FormItem>
      <FormItem>
        <FormLabel className="[&:has([data-state=checked])>div]:border-primary">
          <FormControl>
            <RadioGroupItem value="#d0f0c0" className="sr-only" />
          </FormControl>
          <div className={cn("flex gap-1 items-center rounded-md border-2 border-muted p-1 hover:border-accent cursor-pointer", field.value === "#d0f0c0" && "border-primary")}>
            <div className="w-6 h-6 rounded-full bg-[#d0f0c0]" /> Verde
          </div>
        </FormLabel>
      </FormItem>

      <FormItem>
        <FormLabel className="[&:has([data-state=checked])>div]:border-primary">
          <FormControl>
            <RadioGroupItem value="#ffd0d0" className="sr-only" />
          </FormControl>
          <div className={cn("flex gap-1 items-center rounded-md border-2 border-muted p-1 hover:border-accent cursor-pointer", field.value === "#ffd0d0" && "border-primary")}>
            <div className="w-6 h-6 rounded-full bg-[#ffd0d0]" /> Rojo
          </div>
        </FormLabel>
      </FormItem>

      <FormItem>
        <FormLabel className="[&:has([data-state=checked])>div]:border-primary">
          <FormControl>
            <RadioGroupItem value="#ffcc99" className="sr-only" />
          </FormControl>
          <div className={cn("flex gap-1 items-center rounded-md border-2 border-muted p-1 hover:border-accent cursor-pointer", field.value === "#ffcc99" && "border-primary")}>
            <div className="w-6 h-6 rounded-full bg-[#ffcc99]" /> Naranja
          </div>
        </FormLabel>
      </FormItem>

      <FormItem>
        <FormLabel className="[&:has([data-state=checked])>div]:border-primary">
          <FormControl>
            <RadioGroupItem value="#e8d0ff" className="sr-only" />
          </FormControl>
          <div className={cn("flex gap-1 items-center rounded-md border-2 border-muted p-1 hover:border-accent cursor-pointer", field.value === "#e8d0ff" && "border-primary")}>
            <div className="w-6 h-6 rounded-full bg-[#e8d0ff]" /> Púrpura
          </div>
        </FormLabel>
      </FormItem>

    </RadioGroup>
  </FormItem>
)}
/>  
 */}
