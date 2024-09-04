import { getEventDAO } from "@/services/event-services";
import EventHeader from "./event-header";
import AvailabilityDisplay from "./availability-display";
import AvailabilitySelector from "./availability-selector";
import BigCalendar, { CalendarEvent } from "../big-calendar";
import { addMinutes } from "date-fns";
import { log } from "node:console";
import { toZonedTime } from "date-fns-tz";
import { getFullBookingsDAO } from "@/services/booking-services";

type Props= {
    params: {
      slug: string;
      eventId?: string;
    },
    searchParams: {
      config?: string
    }
}
export default async function EventPage({ params, searchParams }: Props) {
    const eventId = params.eventId
    const slug = params.slug
    if (!eventId) return <div>No se encontró el event ID</div>

    const event= await getEventDAO(eventId)
    let availability1Month: CalendarEvent[] = []
    if (event) {
      const bookingsDAO= await getFullBookingsDAO(event.id)
      const bookings= bookingsDAO.map(b => ({
        title: b.name,
        start: b.date,
        end: addMinutes(b.date, event.duration),
        color: event.color,
        status: b.status,
        clientId: b.clientId,
        eventId: b.eventId,
        availableSeats: b.seats,
        type: "booking" as const
      }))
      availability1Month= get1MonthAvailability(event.availability, event.duration, bookings)
      availability1Month= availability1Month.map(a => ({
        ...a,
        clientId: event.clientId,
        eventId: event.id,
        availableSeats: event.seatsPerTimeSlot || 1
      }))
    }
  
    const config= searchParams.config

    return ( 
        <div className="w-full space-y-4 flex flex-col items-center">

          <div className="flex gap-2 w-full">
            <EventHeader event={event} slug={slug} />

            <AvailabilityDisplay event={event} config={config ? false : true} slug={slug} />
          </div>

          { config === "true" ?
            <AvailabilitySelector eventId={eventId} initialAvailability={event.availability} />
            :
            <div className="w-full">
              <BigCalendar initialEvents={availability1Month} />
            </div>
          } 
        </div>
      );
}    


function get1MonthAvailability(availability: string[], duration: number, bookings: CalendarEvent[]): CalendarEvent[] {
  const result: CalendarEvent[] = []
  const today = new Date()
  for (let i = 0; i < 8; i++) {
    const day = new Date(today.getFullYear(), today.getMonth(), today.getDate() + i)
    let dayOfWeek = day.getDay() - 1
    if (dayOfWeek === -1) dayOfWeek = 6
    
    const dayAvailability = availability[dayOfWeek]
    if (dayAvailability) {
      const [startDayRange, endDayRange] = dayAvailability.split("-")
      const [startHour, startMinute] = startDayRange.split(":").map(Number)
      const [endHour, endMinute] = endDayRange.split(":").map(Number)
      let startDayTime = new Date(day.getFullYear(), day.getMonth(), day.getDate(), startHour, startMinute)
      const finishDayTime = new Date(day.getFullYear(), day.getMonth(), day.getDate(), endHour, endMinute)

      while (true) {
        const start = startDayTime
        const end = addMinutes(start, duration)
        if (end > finishDayTime) break

        const booking = bookings.find(b => 
          b.start.getTime() === start.getTime() && 
          b.end.getTime() === end.getTime()
        )

        if (booking) {
          result.push({
            title: booking.title,
            start,
            end,
            color: booking.color,
            status: booking.status,
            clientId: booking.clientId,
            eventId: booking.eventId,
            availableSeats: booking.availableSeats,
            type: "booking"
          })
        } else {
          result.push({
            title: "Libre",
            start,
            end,
            color: "#e6ffe6",
            status: "",
            clientId: "",
            eventId: "",
            availableSeats: 0,
            type: "free"
          })
        }
        startDayTime = end
      }
    }
  }
  return result
}