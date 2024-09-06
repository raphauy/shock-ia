import { BookingDAO, getFullBookingsDAO, getFutureBookingsDAOByEventId } from "@/services/booking-services";
import { EventDAO, getEventDAO } from "@/services/event-services";
import { addMinutes, isBefore, parseISO, format, addDays } from "date-fns";
import { CalendarEvent } from "../big-calendar";
import AvailabilityDisplay from "./availability-display";
import EventHeader from "./event-header";
import TabsPage from "./tabs";
import { toZonedTime, } from "date-fns-tz";
import { getSlots } from "@/services/slots-service";

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
      const bookingsDAO= await getFutureBookingsDAOByEventId(eventId)
      availability1Month= get1MonthAvailability(event, bookingsDAO)
      availability1Month= availability1Month.map(a => ({
        ...a,
        clientId: event.clientId,
        eventId: event.id,
        availableSeats: event.seatsPerTimeSlot || 1
      }))
    }

    return ( 
        <div className="w-full space-y-4 flex flex-col items-center">
          hola

          <div className="flex gap-2 w-full">
            <EventHeader event={event} slug={slug} />

            <AvailabilityDisplay event={event} />
          </div>

          <div className="w-full">
            <TabsPage slug={slug} eventId={eventId} initialEvents={availability1Month} timezone={event.timezone} />
          </div>
        </div>
      );
}    


function get1MonthAvailability(event: EventDAO, bookings: BookingDAO[]): CalendarEvent[] {
  const availability= event.availability
  console.log("availability:", availability)
  const duration= event.duration
  const timezone= event.timezone
  const result: CalendarEvent[] = [];
  const now = new Date();
  const zonedNow = toZonedTime(now, timezone);

  const DAYS_AHEAD= 2
  for (let i = 0; i < DAYS_AHEAD; i++) {
    const dateStr= format(addDays(zonedNow, i), "yyyy-MM-dd")

    const slots= getSlots(dateStr, bookings, availability, duration, timezone)
    console.log("slots:", slots)

    slots.forEach(slot => {
      result.push({
        title: slot.available ? "Libre" : slot.name || "",
        start: slot.start,
        end: slot.end,
        color: slot.available ? "#fafffb" : event.color || "",
        status: "available" as const,
        clientId: event.clientId,
        eventId: event.id,
        availableSeats: event.seatsPerTimeSlot || 1,
        type: slot.available ? "free" : "booking"
      })
    })
  }
  return result;
}