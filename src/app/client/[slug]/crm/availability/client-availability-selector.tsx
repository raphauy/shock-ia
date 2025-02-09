//AvailabilitySelector.tsx
'use client'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { toast } from "@/components/ui/use-toast"
import { Loader, Plus, Save, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { setAvailabilityAction } from "./actions"

const daysOfWeek = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'] as const

const interval = 30

type TimeRange = {
  start: string
  end: string
}

type DayAvailability = TimeRange[]

type Props = {
  clientId: string
  initialAvailability: string[]
}

export default function ClientAvailabilitySelector({ clientId, initialAvailability }: Props) {
  const [loading, setLoading] = useState(false)
  const [availability, setAvailability] = useState<{ [key: string]: DayAvailability }>(getInitialValues(initialAvailability))
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
        newAvailability[day] = [{ start: '09:00', end: '17:00' }]
      }
      return newAvailability
    })
    setNeedSave(true)
  }

  const handleTimeChange = (day: string, rangeIndex: number, type: 'start' | 'end', value: string) => {
    setAvailability(prev => {
      const newAvailability = { ...prev }
      if (newAvailability[day]) {
        newAvailability[day] = [...newAvailability[day]]
        newAvailability[day][rangeIndex] = {
          ...newAvailability[day][rangeIndex],
          [type]: value
        }
      }
      return newAvailability
    })
    setNeedSave(true)
  }

  const handleAddRange = (day: string) => {
    setAvailability(prev => {
      const newAvailability = { ...prev }
      if (!newAvailability[day]) {
        newAvailability[day] = []
      }
      newAvailability[day] = [...newAvailability[day], { start: '09:00', end: '17:00' }]
      return newAvailability
    })
    setNeedSave(true)
  }

  const handleRemoveRange = (day: string, rangeIndex: number) => {
    setAvailability(prev => {
      const newAvailability = { ...prev }
      if (newAvailability[day]) {
        newAvailability[day] = newAvailability[day].filter((_, index) => index !== rangeIndex)
        if (newAvailability[day].length === 0) {
          delete newAvailability[day]
        }
      }
      return newAvailability
    })
    setNeedSave(true)
  }

  const handleSave = () => {
    const mappedAvailability = daysOfWeek.map(day => {
      if (!availability[day] || availability[day].length === 0) return ""
      return availability[day]
        .map(range => `${range.start}-${range.end}`)
        .join(',')
    })

    setLoading(true)
    setAvailabilityAction(clientId, mappedAvailability)
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
        <div className="space-y-6">
          {daysOfWeek.map(day => (
            <div key={day} className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Switch
                    id={day}
                    checked={!!availability[day]}
                    onCheckedChange={() => handleDayToggle(day)}
                  />
                  <Label htmlFor={day} className="w-24">{day}</Label>
                </div>
                {availability[day] && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddRange(day)}
                    className="gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Agregar rango
                  </Button>
                )}
              </div>
              {availability[day] && availability[day].map((range, rangeIndex) => (
                <div key={rangeIndex} className="flex items-center space-x-2 ml-14">
                  <Select
                    value={range.start}
                    onValueChange={(value) => handleTimeChange(day, rangeIndex, 'start', value)}
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
                    value={range.end}
                    onValueChange={(value) => handleTimeChange(day, rangeIndex, 'end', value)}
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
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveRange(day, rangeIndex)}
                    className="text-destructive"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleSave} className='w-full gap-2' disabled={!needSave}>
          {loading ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Guardar disponibilidad
        </Button>
      </CardFooter>
    </Card>
  )
}

function getInitialAvailability(day: string, availability: string[] = []): DayAvailability {
  let dayIndex = daysOfWeek.findIndex(d => d === day)
  const existingRanges = availability[dayIndex]

  if (!existingRanges) return []

  return existingRanges.split(',').map(range => {
    const [start, end] = range.split('-')
    return { start, end }
  })
}

function getInitialValues(initialAvailability: string[]) {
  const initialValues: { [key: string]: DayAvailability } = {}
  daysOfWeek.forEach(day => {
    const dayAvailability = getInitialAvailability(day, initialAvailability)
    if (dayAvailability.length > 0) {
      initialValues[day] = dayAvailability
    }
  })
  return initialValues
}

