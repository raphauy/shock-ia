import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Availability, Schedule } from "@/services/calcom-sdk-v2";
import { EventDAO } from "@/services/event-services";
import { Calendar, Eye } from "lucide-react";
import Link from "next/link";


const dayAbbreviations = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

const formatTime = (time: string) => {
  return time?.substring(0, 5) || ''; // Removes seconds from the time string, returns empty string if time is undefined
}

type Props= {
  event: EventDAO
  config: boolean
  slug: string
}
export default function AvailabilityDisplay({ event, config, slug }: Props) {
  const availability= event.availability

  return (
    <Card key={event.id} className="min-w-64">
      <CardHeader>
        <CardTitle className="text-center">
          Disponibilidad
        </CardTitle>
      </CardHeader>
      <CardContent className="text-center">
        {Array.isArray(availability) && availability.length > 0 ? (
          <ul>
            {availability.map((slot, index) => {
              if (!slot) return null
              return (              
              <li key={index} className="text-sm">
                <div>
                  {dayAbbreviations[index] + ": " + formatTime(slot.split("-")[0]) + " - " + formatTime(slot.split("-")[1])}
                </div>
              </li>
              )
            })}
          </ul>
        ) : (
          <p>No availability set for this event</p>
        )}
      </CardContent>
      <CardFooter className="pb-4">
      {
          config ?
          <Link href={`/client/${slug}/events/${event.id}?config=true`} className="w-full">
              <Button variant="outline" size="icon" className="w-full gap-2">
                  <Calendar className="h-4 w-4" /> Configurar
                  <span className="sr-only">Editar Schedule</span>
              </Button>
          </Link>
          :
          <Link href={`/client/${slug}/events/${event.id}`} className="w-full">
            <Button variant="outline" size="icon" className="w-full gap-2">
                  <Eye className="h-4 w-4" /> Previsualizar
                  <span className="sr-only">Ver Schedule</span>
              </Button>
          </Link>
        }

      </CardFooter>
    </Card>
)
}