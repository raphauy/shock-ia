"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { DateTimeSelector } from "@/components/date-time-selector"
import { EventDAO } from "@/services/event-services"
import { Button } from "@/components/ui/button"
import { Loader } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { setEventDateTimeAction } from "../../event-actions"

type Props = {  
  event: EventDAO
}

export default function EventDateTimeSelector({ event }: Props) {
  const [startDateTime, setStartDateTime] = useState<Date | undefined>(event.startDateTime)
  const [endDateTime, setEndDateTime] = useState<Date | undefined>(event.endDateTime)
  const [loading, setLoading] = useState(false)
  const [needSave, setNeedSave] = useState(false)

  useEffect(() => {
    setNeedSave(startDateTime !== event.startDateTime || endDateTime !== event.endDateTime)
  }, [startDateTime, endDateTime, event])

  function handleSave() {
    if (!startDateTime || !endDateTime) {
        toast({ 
            title: "Debes seleccionar una fecha de inicio y una fecha de fin",
            variant: "destructive"
         })
         return
    }
    setLoading(true)
    setEventDateTimeAction(event.id, startDateTime, endDateTime)
    .then(ok => {
        if (ok) {
            toast({ title: "Fechas actualizadas" })
        } else {
            toast({ title: "Error al actualizar las fechas", variant: "destructive" })
        }
    })
    .catch(error => {
        toast({ title: "Error al actualizar las fechas", variant: "destructive" })
    })
    .finally(() => {
        setLoading(false)
    })
  }

  return (
    <Card className="w-full">
      <CardContent className="space-y-6 mt-4">
        <DateTimeSelector
          label="Inicio"
          dateTime={startDateTime}
          onDateTimeChange={setStartDateTime}
        />
        <DateTimeSelector
          label="Fin"
          dateTime={endDateTime}
          onDateTimeChange={setEndDateTime}
        />
      </CardContent>
      <CardFooter>
        <Button onClick={handleSave} className='w-full gap-2' disabled={!needSave}>
          { loading && <Loader className="w-4 h-4 animate-spin" /> }
          Guardar fechas
        </Button>
      </CardFooter>

    </Card>
  )
}