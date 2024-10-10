"use client"

import React, { useState, useEffect } from 'react'
import { Calendar, momentLocalizer, Views, View } from 'react-big-calendar'
import moment from 'moment-timezone'
import 'moment/locale/es'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import SingleSlotCustomEvent from './single-slot-custom-event'

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
  bookingId?: string
  title: string
  start: Date
  end: Date
  color: string
  status: string
  clientId: string
  eventId: string
  seatsLeft: number
  maxSeats: number
  type: "booking" | "free" | "fixed-date"
}

type Props = {
  initialEvents: CalendarEvent[]
  timezone: string
}

export default function BigCalendar({ initialEvents, timezone }: Props) { 

  console.log("timezone: ", timezone)
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [view, setView] = useState<View>(Views.WEEK)
  
  useEffect(() => {
    let adjustedEvents = initialEvents.map(event => ({
      ...event,
      start: moment.utc(event.start).tz(timezone).toDate(),
      end: moment.utc(event.end).tz(timezone).toDate(),
    }))

    if (view === 'month') {
      adjustedEvents = adjustedEvents.filter(event => event.title !== "Libre")
    }

    setEvents(adjustedEvents)
  }, [initialEvents, view, timezone])

  const eventStyleGetter = (event: CalendarEvent) => {
    const backgroundColor = event.title === "Bloqueado" ? "#ffcccb" : event.color
    return {
      style: {
        backgroundColor,
        border: event.title ? '1px solid black' : 'none',
      }
    }
  }

  const minTime = new Date(2000, 0, 1, 7, 0, 0)
  const maxTime = new Date(2000, 0, 1, 23, 0, 0)

  return (
    <div className="h-full">
      <Calendar
        className='h-fit min-h-[calc(100vh-300px)]'
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
          dayRangeHeaderFormat: ({ start, end }) => `${moment(start).format('D MMM')} - ${moment(end).format('D MMM')}`,
          timeGutterFormat: (date, culture, localizer) => moment(date).format('HH:mm'),
        }}
        messages={messages}
        min={minTime}
        //max={maxTime}
        components={{
          event: (props) => <SingleSlotCustomEvent {...props} />,
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