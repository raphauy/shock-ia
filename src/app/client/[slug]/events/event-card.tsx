import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { getEventTypeLabel } from "@/lib/utils"
import { EventDAO } from "@/services/event-services"
import { EventType } from "@prisma/client"
import { format } from "date-fns"
import { toZonedTime } from "date-fns-tz"
import { Calendar, Clock, DollarSign, MapPin, PersonStanding } from "lucide-react"

type EventCardProps= {
    event: EventDAO
}

export function EventCard({event}: EventCardProps) {
    const color= event.color
    const duration= event.minDuration === event.maxDuration ? event.minDuration : `${event.minDuration}-${event.maxDuration}`
    const bookedSeats= event.seatsPerTimeSlot && event.seatsAvailable ? event.seatsPerTimeSlot - event.seatsAvailable : 0
    const seatsLabel= event.type === EventType.FIXED_DATE ? `${bookedSeats} / ${event.seatsPerTimeSlot}` : `${event.seatsPerTimeSlot}`
    const statusLabel= event.type === EventType.FIXED_DATE && (!event.startDateTime || !event.endDateTime) ? "Configurar fechas" : event.isArchived ? "Archivado" : "Activo"

    return (
        <Card className="max-w-md overflow-hidden rounded-lg shadow-md min-w-[300px] mx-auto">
            <div style={{backgroundColor: color}} className="h-4" />
            <CardContent className="p-4">
                <h2 className="text-xl font-bold">{event.name}</h2>
                <p className="text-sm text-muted-foreground mb-2">/{event.slug}</p>
                <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground mb-2">
                    {
                        event.type === EventType.SINGLE_SLOT && (
                            <div className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                <span>{duration} minutos</span>
                            </div>
                        )
                    }
                    {
                        event.type === EventType.FIXED_DATE  && (
                            <div className="flex items-center gap-1 text-sm w-36">
                                <Calendar className="w-4 h-4" />
                                {
                                    event.startDateTime && event.endDateTime ? (
                                        <span>{format(toZonedTime(event.startDateTime, event.timezone), 'dd/MM/yyyy HH:mm')} h</span>
                                    ) : (
                                        <p>Configurar fechas</p>
                                    )
                                }
                            </div>
                        )
                    }

                    <div className="flex items-center gap-1 justify-end">
                        <PersonStanding className="w-4 h-4" />
                        <span>{seatsLabel}</span>
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
                <Badge>{getEventTypeLabel(event.type)}</Badge>
                {
                    event.type === EventType.FIXED_DATE && event.seatsAvailable === 0 && (
                        <Badge variant="open">Agotado</Badge>
                    )
                }
                <Badge variant={statusLabel === "Configurar fechas" ? "destructive" : "secondary"} className="border-gray-300">{statusLabel}</Badge>
            </CardFooter>    
        </Card>
    )
}