import { getFullBookingsDAO } from "@/services/booking-services";
import { getEventDAO } from "@/services/event-services";
import { addMinutes, isBefore } from "date-fns";
import { CalendarEvent } from "../big-calendar";
import AvailabilityDisplay from "./availability-display";
import EventHeader from "./event-header";
import TabsPage from "./tabs";

type Props= {
    params: {
      slug: string;
      eventId?: string;
    },
}
export default async function EventPage({ params }: Props) {
    const eventId = params.eventId
    const slug = params.slug
    if (!eventId) return <div>No se encontró el event ID</div>

    const event= await getEventDAO(eventId)
    let availability1Month: CalendarEvent[] = []
    if (event) {
      const bookingsDAO= await getFullBookingsDAO(event.id)
      const bookings= bookingsDAO.map(b => ({
        title: b.name,
        start: b.start,
        end: b.end,
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
  
    return ( 
        <div className="w-full space-y-4 flex flex-col items-center">

          <div className="flex gap-2 w-full">
            <EventHeader event={event} slug={slug} />

            <AvailabilityDisplay event={event} />
          </div>

          <div className="w-full">
            <TabsPage slug={slug} eventId={eventId} initialEvents={availability1Month} />
          </div>
        </div>
      );
}    


function get1MonthAvailability(availability: string[], duration: number, bookings: CalendarEvent[]): CalendarEvent[] {
  const result: CalendarEvent[] = []
  const now = new Date()
  for (let i = 0; i < 8; i++) {
    const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i)
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
          if (isBefore(start, now)) continue
          
          result.push({
            title: "Libre",
            start,
            end,
            color: "#fafffb",
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