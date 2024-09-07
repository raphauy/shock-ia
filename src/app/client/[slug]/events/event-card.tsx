import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { getEventTypeLabel } from "@/lib/utils"
import { EventDAO } from "@/services/event-services"
import { EventType } from "@prisma/client"
import { Clock, DollarSign, MapPin, PersonStanding } from "lucide-react"

type EventCardProps= {
    event: EventDAO
}

export function EventCard({event}: EventCardProps) {
    const color= event.color
  return (
    <Card className="max-w-md overflow-hidden rounded-lg shadow-md min-w-[300px] mx-auto">
        <div style={{backgroundColor: color}} className="h-4" />
        <CardContent className="p-4">
            <h2 className="text-xl font-bold">{event.name}</h2>
            <p className="text-sm text-muted-foreground mb-2">/{event.slug}</p>
            <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground mb-2">
                <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{event.duration} minutos</span>
                </div>
                <div className="flex items-center gap-1 justify-end">
                    <PersonStanding className="w-4 h-4" />
                    <span>{event.seatsPerTimeSlot}</span>
                </div>
                {typeof event.price === 'number' && event.price > 0 && (
                <div className="flex items-center gap-1">
                    <DollarSign className="w-4 h-4" />
                    <span>{event.price.toFixed(0)} UYU</span>
                </div>
                )}
            </div>
        </CardContent>
        <CardFooter className="px-4 py-3 bg-muted flex justify-between items-center w-full">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4" />
                <span className="line-clamp-1">{event.address}</span>
            </div>
            <Badge variant="secondary" className="border-gray-300">{event.isArchived ? "Archivado" : "Activo"}</Badge>
        </CardFooter>    
    </Card>
  )
}