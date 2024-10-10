"use client"

import { EventDialog } from "@/app/client/[slug]/events/event-dialogs"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { getEventTypeLabel } from "@/lib/utils"
import { CalendarClockIcon, CalendarDaysIcon, CalendarIcon, ChevronDown } from "lucide-react"
import { useState } from "react"

enum EventType {
  SINGLE_SLOT = "SINGLE_SLOT",
  MULTIPLE_SLOTS = "MULTIPLE_SLOTS",
  FIXED_DATE = "FIXED_DATE"
}

const eventTypeIcons = {
  [EventType.SINGLE_SLOT]: CalendarIcon,
  [EventType.MULTIPLE_SLOTS]: CalendarDaysIcon,
  [EventType.FIXED_DATE]: CalendarClockIcon
}

export function EventCreator() {
  const [open, setOpen] = useState(false)
  const [selectedEventType, setSelectedEventType] = useState<EventType | null>(null)

  const handleSelectEventType = (type: EventType) => {
    setSelectedEventType(type)
    setOpen(false)
  }

  return (
    <div className="w-full">
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button className="w-full">
            Crear Evento
            <ChevronDown className="ml-2 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="">
          {Object.values(EventType).map((type) => {
            const Icon = eventTypeIcons[type]
            return (
              <DropdownMenuItem key={type} onSelect={() => handleSelectEventType(type)} disabled={type === EventType.MULTIPLE_SLOTS}>
                <Button variant="ghost" className="w-full justify-start"> 
                  <Icon className="mr-2 h-4 w-4" />
                  {getEventTypeLabel(type)}
                </Button>
              </DropdownMenuItem>
            )
          })}
        </DropdownMenuContent>
      </DropdownMenu>
      {selectedEventType && (
        <EventDialog 
          eventType={selectedEventType} 
          open={true} 
          onOpenChange={(isOpen) => {
            if (!isOpen) setSelectedEventType(null)
          }}
        />
      )}
    </div>
  )
}