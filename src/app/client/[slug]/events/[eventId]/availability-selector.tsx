//AvailabilitySelector.tsx
'use client'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { toast } from "@/components/ui/use-toast"
import { Loader, Save } from 'lucide-react'
import { useMemo, useState } from 'react'
import { setAvailabilityAction } from "../event-actions"

const daysOfWeek = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'] as const
const dayIndices = { 'Lunes': 1, 'Martes': 2, 'Miércoles': 3, 'Jueves': 4, 'Viernes': 5, 'Sábado': 6, 'Domingo': 0 }

const interval= 30

type Props = {
  eventId: string
  initialAvailability: string[]
}

export default function AvailabilitySelector({ eventId, initialAvailability }: Props) {

  const [loading, setLoading] = useState(false)
  const [availability, setAvailability] = useState<{ [key: string]: { start: string, end: string } }>(getInitialValues(initialAvailability))
  const [needSave, setNeedSave] = useState(false)

  const timeSlots = useMemo(() => {
    const slots = [];
    const totalMinutesInDay = 24 * 60;
    for (let minutes = 0; minutes < totalMinutesInDay; minutes += interval) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      slots.push(`${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`);
    }
    return slots;
  }, []);

  const handleDayToggle = (day: string) => {
    setAvailability(prev => {
      const newAvailability = { ...prev }
      if (newAvailability[day]) {
        delete newAvailability[day]
      } else {
        newAvailability[day] = { start: '09:00', end: '17:00' }
      }
      return newAvailability
    })
    setNeedSave(true)
  }

  const handleTimeChange = (day: string, type: 'start' | 'end', value: string) => {
    setAvailability(prev => ({
      ...prev,
      [day]: { ...prev[day], [type]: value }
    }))
    setNeedSave(true)
  }

  const handleSave = () => {

    const mappedAvailability= [
      availability.Lunes ? availability.Lunes.start + "-" + availability.Lunes.end : "",
      availability.Martes ? availability.Martes.start + "-" + availability.Martes.end : "",
      availability.Miércoles ? availability.Miércoles.start + "-" + availability.Miércoles.end : "",
      availability.Jueves ? availability.Jueves.start + "-" + availability.Jueves.end : "",
      availability.Viernes ? availability.Viernes.start + "-" + availability.Viernes.end : "",
      availability.Sábado ? availability.Sábado.start + "-" + availability.Sábado.end : "",
      availability.Domingo ? availability.Domingo.start + "-" + availability.Domingo.end : "",
    ]

    setLoading(true)
    setAvailabilityAction(eventId, mappedAvailability)
    .then(() => {
      toast({ title: "Disponibilidad actualizada" })
      setNeedSave(false)
    })
    .catch((error) => {
      toast({ title: "Error", description: error.message })
      setNeedSave(true)
    })
    .finally(() => {
      setLoading(false)
    })
  }

  return (
    <Card className="w-full xl:max-w-2xl mt-6">
      <CardContent className="mt-6">
        <div className="space-y-4">
          {daysOfWeek.map(day => (
            <div key={day} className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Switch
                  id={day}
                  checked={!!availability[day]}
                  onCheckedChange={() => handleDayToggle(day)}
                />
                <Label htmlFor={day} className="w-24">{day}</Label>
              </div>
              {availability[day] && availability[day].start && (
                <div className="flex items-center space-x-2">
                  <Select
                    value={availability[day].start}
                    onValueChange={(value) => handleTimeChange(day, 'start', value)}
                  >
                    <SelectTrigger className="w-[100px]">
                      <SelectValue placeholder="Inicio" />
                    </SelectTrigger>
                    <SelectContent>
                      {timeSlots.map(slot => (
                        <SelectItem key={slot} value={slot}>{slot}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span>-</span>
                  <Select
                    value={availability[day].end}
                    onValueChange={(value) => handleTimeChange(day, 'end', value)}
                  >
                    <SelectTrigger className="w-[100px]">
                      <SelectValue placeholder="Fin" />
                    </SelectTrigger>
                    <SelectContent>
                      {timeSlots.map(slot => (
                        <SelectItem key={slot} value={slot}>{slot}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleSave} className='w-full gap-2' disabled={!needSave}>
          { loading ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" /> }
          Guardar disponibilidad
        </Button>
      </CardFooter>
    </Card>
  )
}

function getInitialAvailability(day: string, availability: string[] = []): { start: string, end: string } | null {
  let dayIndex = daysOfWeek.findIndex(d => d === day)

  const existingRange = availability[dayIndex]

  if (existingRange) {
    console.log("existingSlot", existingRange)
    const start= existingRange.split("-")[0]
    const end= existingRange.split("-")[1]
    
    return { start: start, end: end }
  } else {
    return null
  }
}

function getInitialValues(initialAvailability: string[]) {
  
  const initialValues: { [key: string]: { start: string, end: string } } = {}
  daysOfWeek.forEach(day => {
    const availability= getInitialAvailability(day, initialAvailability)
    
    if (availability)
      initialValues[day]= availability
  })
  return initialValues  
}

