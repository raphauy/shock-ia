import { BookingDAO, getFutureBookingsDAOByEventId } from "@/services/booking-services";
import { EventDAO, getEventDAO } from "@/services/event-services";
import { getSlots } from "@/services/slots-service";
import { EventType } from "@prisma/client";
import { addDays, format } from "date-fns";
import { toZonedTime, } from "date-fns-tz";
import { CalendarEvent } from "../big-calendar";
import AvailabilityDisplay from "./availability-display";
import EventHeader from "./event-header";
import FixedDateTabsPage from "./tabs-fixed-date";
import SingleSlotTabsPage from "./tabs-single-slot";

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
    let calendarEvents: CalendarEvent[] = []
    if (event) {
      const bookingsDAO= await getFutureBookingsDAOByEventId(eventId, event.timezone)
      calendarEvents= getCalendarEvents(event, bookingsDAO)
      calendarEvents= calendarEvents.map(a => ({
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
            {
              event.type === EventType.SINGLE_SLOT && 
              <SingleSlotTabsPage eventId={eventId} initialEvents={calendarEvents} timezone={event.timezone} />
            }

            {
              event.type === EventType.FIXED_DATE && 
              <FixedDateTabsPage eventId={eventId} />
            }
          </div>
        </div>
      );
}    

function getCalendarEvents(event: EventDAO, bookings: BookingDAO[]): CalendarEvent[] {
  if (event.type === EventType.SINGLE_SLOT) {
    return getSingleSlotCalendarEvents(event, bookings)
  } else if (event.type === EventType.FIXED_DATE) {
    return getFixedDateCalendarEvents(event, bookings)
  } else {
    throw new Error("Event type is not supported")
  }
}


function getSingleSlotCalendarEvents(event: EventDAO, bookings: BookingDAO[]): CalendarEvent[] {
  if (event.type !== EventType.SINGLE_SLOT) {
    throw new Error("Event type is not SINGLE_SLOT")
  }

  const availability= event.availability
  console.log("availability:", availability)
  const duration= event.minDuration || 30
  const timezone= event.timezone
  const result: CalendarEvent[] = [];
  const now = new Date();
  const zonedNow = toZonedTime(now, timezone);

  const DAYS_AHEAD= 60
  for (let i = 0; i < DAYS_AHEAD; i++) {
    const dateStr= format(addDays(zonedNow, i), "yyyy-MM-dd")

    const slots= getSlots(dateStr, bookings, availability, duration, timezone)
    const seatsBooked= bookings.reduce((acc, booking) => acc + booking.seats, 0)
    const seatsPerTimeSlot= event.seatsPerTimeSlot || 1

    slots.forEach(slot => {
      result.push({
        bookingId: slot.bookingId,
        title: slot.available ? "Libre" : slot.name || "",
        start: slot.start,
        end: slot.end,
        color: slot.available ? "#fafffb" : event.color || "",
        status: "available" as const,
        clientId: event.clientId,
        eventId: event.id,
        seatsLeft: seatsPerTimeSlot - seatsBooked,
        maxSeats: seatsPerTimeSlot,
        type: slot.available ? "free" : "booking"
      })
    })
  }
  return result;
}

function getFixedDateCalendarEvents(event: EventDAO, bookings: BookingDAO[]): CalendarEvent[] {
  if (event.type !== EventType.FIXED_DATE) {
    throw new Error("Event type is not FIXED_DATE")
  }

  const singleEvent= {
    title: event.name,
    start: event.startDateTime!,
    end: event.endDateTime!,
    color: event.color || "",
    status: "available" as const,
    clientId: event.clientId,
    eventId: event.id,
    maxSeats: event.seatsPerTimeSlot || 1,
    seatsLeft: event.seatsAvailable || 1,
    type: "fixed-date" as const
  }
  return [singleEvent]
}