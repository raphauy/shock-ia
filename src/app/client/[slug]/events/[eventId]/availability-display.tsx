import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { EventType } from "@/lib/generated/prisma";
import { EventDAO } from "@/services/event-services";
import { Globe } from "lucide-react";


const dayAbbreviations = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

const formatTime = (time: string) => {
  return time?.substring(0, 5) || ''; // Removes seconds from the time string, returns empty string if time is undefined
}

type Props= {
  event: EventDAO
}
export default function AvailabilityDisplay({ event }: Props) {
  if (event.type === EventType.FIXED_DATE) {
    return null
  }
  
  const availability= event.availability

  return (
    <Card key={event.id} className="min-w-64 text-muted-foreground" style={{borderColor: event.color}}>
      <CardHeader>
        <h2 className="text-2xl font-bold text-center">Disponibilidad</h2>            
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
          <p>No hay disponibilidad configurada para este evento</p>
        )}
      </CardContent>
      <CardFooter className="flex items-center justify-center gap-2">
        <Globe className="w-5 h-5" />
        <span>{event.timezone}</span>
      </CardFooter>
    </Card>
)
}