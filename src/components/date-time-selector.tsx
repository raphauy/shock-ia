"use client"

import { useState } from "react"
import { CalendarIcon, Clock } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {  Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {  Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"

interface DateTimeSelectorProps {
  label: string
  dateTime: Date | undefined
  onDateTimeChange: (dateTime: Date | undefined) => void
}

export function DateTimeSelector({ label, dateTime, onDateTimeChange }: DateTimeSelectorProps) {
  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      const newDateTime = dateTime ? new Date(dateTime) : new Date()
      newDateTime.setFullYear(date.getFullYear(), date.getMonth(), date.getDate())
      onDateTimeChange(newDateTime)
    }
  }

  const handleTimeChange = (time: string | undefined) => {
    if (time) {
      const [hours, minutes] = time.split(':').map(Number)
      const newDateTime = dateTime ? new Date(dateTime) : new Date()
      newDateTime.setHours(hours, minutes)
      onDateTimeChange(newDateTime)
    }
  }

  return (
    <div className="space-y-2 text-muted-foreground">
      <p className="">{label}</p>

      <div className="flex space-x-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={cn(
                "min-w-[277px] justify-start text-left font-normal",
                !dateTime && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateTime ? format(dateTime, "PPP", { locale: es }) : <span>Seleccionar fecha</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={dateTime}
              onSelect={handleDateChange}
              initialFocus
              locale={es}
            />
          </PopoverContent>
        </Popover>
        <Select onValueChange={handleTimeChange} value={dateTime ? format(dateTime, "HH:mm") : undefined}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="hora">
              {dateTime ? (
                <div className="flex items-center">
                  <Clock className="mr-2 h-4 w-4" />
                  {format(dateTime, "HH:mm", { locale: es })}
                </div>
              ) : (
                "hora"
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <ScrollArea className="h-[200px]">
              {Array.from({ length: 48 }, (_, i) => i).map((halfHour) => {
                const hour = Math.floor(halfHour / 2);
                const minute = halfHour % 2 === 0 ? '00' : '30';
                const timeString = `${hour.toString().padStart(2, '0')}:${minute}`;
                return (
                  <SelectItem key={halfHour} value={timeString}>
                    {timeString}
                  </SelectItem>
                );
              })}
            </ScrollArea>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}