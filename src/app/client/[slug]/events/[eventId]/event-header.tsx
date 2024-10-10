import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { cn, getEventTypeLabel } from "@/lib/utils"
import { EventDAO } from "@/services/event-services"
import { Calendar, Clock, Edit, MapPin, PersonStanding } from "lucide-react"
import Link from "next/link"
import { DeleteEventDialog } from "../event-dialogs"
import { EventType } from "@prisma/client"
import { format, isSameDay } from "date-fns"
import { toZonedTime } from "date-fns-tz"

type Props= {
  event: EventDAO
  slug: string
}
  
  export default function EventHeader({ event, slug }: Props) {

    const duration= event.minDuration === event.maxDuration ? event.minDuration : `${event.minDuration}-${event.maxDuration}`

    const bookedSeats= event.seatsPerTimeSlot! - event.seatsAvailable!
    const seatsLabel= event.type === EventType.FIXED_DATE ? `${bookedSeats} / ${event.seatsPerTimeSlot}` : `${event.seatsPerTimeSlot}`

    return (
    <Card className={cn("w-full overflow-hidden pb-4")} style={{borderColor: event.color}}>
        <div style={{backgroundColor: event.color}} className="h-4" />
        <CardContent className="flex flex-col p-4 gap-4 flex-grow h-full">
        
        <div className="flex flex-col lg:flex-row gap-4 w-full">
          <div className="text-center md:text-left text-muted-foreground min-w-72 flex flex-col flex-1">
            <h2 className="text-2xl font-bold mb-2">
              <Link href={`/client/${slug}/events/${event.id}/edit`} className="flex items-center gap-2">
                {event.name}               
                <Badge variant="secondary" className="whitespace-nowrap text-center border-gray-300">{getEventTypeLabel(event.type)}</Badge>
              </Link>
            </h2>
            <p className="text-sm text-muted-foreground">
              {event.description}
            </p>
          </div>

          <div className="flex flex-col gap-4 text-sm text-muted-foreground min-w-48">
            <div className="flex text-sm gap-4">
              {
                event.type === EventType.SINGLE_SLOT && (
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{duration}</span>
                  </div>
                )
              }
              {
                event.type === EventType.FIXED_DATE && (
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4 mb-0.5" />
                    <span className={cn("font-bold", (!event.startDateTime || !event.endDateTime) && "text-red-500")}>{getDatesLabel(event)}</span>
                  </div>
                )
              }
            </div>
          </div>

        </div>

        
        <div className="flex gap-2 flex-grow justify-between">
          <div className="flex flex-col justify-end w-full">
            <div className="flex gap-2 w-full justify-between items-baseline">
              <div className="flex h-fit">
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  <span>{event.address}</span>
                </div>
              </div>
              <div className="flex items-center gap-1 font-bold">
                <PersonStanding className="w-5 h-5 mb-0.5" />
                <span>{seatsLabel}</span>
                {
                    event.type === EventType.FIXED_DATE && event.seatsAvailable === 0 && (
                        <Badge variant="open">Agotado</Badge>
                    )
                }
              </div>

              <div className="flex gap-2 mt-2">
                <Link href={`/client/${slug}/events/${event.id}/edit`}>
                    <Button variant="outline" size="icon">
                        <Edit className="h-4 w-4" /><span className="sr-only">Editar</span>
                    </Button>
                </Link>
                <DeleteEventDialog id={event.id} description={`Seguro que deseas eliminar el evento ${event.name}`} />
              </div>

            </div>

          </div>
        </div>
      </CardContent>
   </Card>
  )
}

function getDatesLabel(event: EventDAO) {
  if (!event.startDateTime || !event.endDateTime) return "Configurar fechas"

  const sameDay= isSameDay(event.startDateTime, event.endDateTime)
  const startDateTime= toZonedTime(event.startDateTime, event.timezone)
  const endDateTime= toZonedTime(event.endDateTime, event.timezone)
  if (sameDay) {
    return `${format(startDateTime, 'dd/MM/yyyy HH:mm')} - ${format(endDateTime, 'HH:mm')}`
  }
  return `${format(startDateTime, 'dd/MM/yyyy HH:mm')} - ${format(endDateTime, 'dd/MM/yyyy HH:mm')}`
}