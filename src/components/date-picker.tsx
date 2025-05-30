"use client"

import * as React from "react"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { es } from "date-fns/locale"

type Props = {
  label: string
  date: Date | undefined
  setDate: (date: Date | undefined) => void
  disabled?: boolean
}

export function DatePicker({ label, date, setDate, disabled = false }: Props) {
  const [open, setOpen] = React.useState(false)

  function handleDateChange(date: Date | undefined) {
    setDate(date)
    setOpen(false)
  }

  return (
    <Popover open={disabled ? false : open} onOpenChange={disabled ? undefined : setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={date ? "outline" : "ghost"}
          className={cn(
            "w-full h-10 justify-start text-left font-normal border border-input", 
            !date && "text-muted-foreground",
            disabled && "opacity-50 cursor-not-allowed"
          )}
          disabled={disabled}
        >
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4" />
            <p className="text-sm whitespace-nowrap">{date instanceof Date && !isNaN(date.getTime()) ? format(date, "PP", { locale: es }) : <span>{label}</span>}</p>
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleDateChange}
          initialFocus
          locale={es}
        />
      </PopoverContent>
    </Popover>
  )
}
