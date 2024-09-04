"use client"

import React, { useState, useEffect } from 'react'
import { Calendar, momentLocalizer, Views, View } from 'react-big-calendar'
import moment from 'moment-timezone'
import 'moment/locale/es'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import CustomEvent from './CustomEvent'

moment.locale('es')
moment.tz.setDefault("America/Montevideo")

moment.updateLocale('es', {
  week: {
    dow: 1,
    doy: 4 
  }
})

// Crea el localizer
const localizer = momentLocalizer(moment)

export type CalendarEvent = {
  title: string
  start: Date
  end: Date
  color: string
  status: string
  clientId: string
  eventId: string
  availableSeats: number
  type: "booking" | "free"
}

type Props = {
  initialEvents: CalendarEvent[]
}

export default function BigCalendar({ initialEvents }: Props) { 
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [view, setView] = useState<View>(Views.WEEK) // Estado para la vista actual

  useEffect(() => {
    // Ajusta las fechas de los eventos a la zona horaria local
    let adjustedEvents= initialEvents
    if (view === 'month') {
      adjustedEvents= initialEvents.filter(event => event.title !== "Libre")
    }
    adjustedEvents = adjustedEvents.map(event => {      
      return ({
      ...event,
      start: moment(event.start).toDate(),
      end: moment(event.end).toDate(),
    })})
    setEvents(adjustedEvents)
  }, [initialEvents, view])

  const eventStyleGetter = (event: CalendarEvent) => {
    return {
      style: {
        backgroundColor: event.color,
        border: event.title ? '1px solid black' : 'none',
      }
    }
  }

  return (
    <div className="h-full" style={{ height: "calc(100vh - 310px)" }}>
      <Calendar
        className='h-fit'
        localizer={localizer}
        culture='es'
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: '100%' }}
        eventPropGetter={eventStyleGetter}
        defaultView={Views.WEEK}
        views={['month', 'week', 'day']}
        onView={(newView) => setView(newView)}
        formats={{
          eventTimeRangeFormat: () => '',
          dayRangeHeaderFormat: ({ start, end }) => 
            `${moment(start).format('D MMM')} - ${moment(end).format('D MMM')}`,
        }}
        messages={messages}
        min={new Date(0, 0, 0, 7, 0, 0)}        
        max={new Date(0, 0, 0, 20, 0, 0)}
        components={{
          event: (props) => <CustomEvent {...props} />,
        }}
        slotPropGetter={(date) => ({
          style: {
            minHeight: '22px',
          },
        })}
      />
    </div>
  )
}

const messages = {
  today: 'Hoy',
  month: 'Mes',
  week: 'Semana',
  day: 'Día',
  allDay: 'Todo el día',
  event: 'Evento',
  date: 'Fecha',
  time: 'Hora',
  next: 'Siguiente',
  previous: 'Anterior',
  noEventsInRange: 'No hay eventos en este rango',
  showMore: (totalEvents: number) => `Mostrar más (${totalEvents})`,
  tomorrow: 'Mañana',
  yesterday: 'Ayer',
  work_week: 'Semana laboral',          
}