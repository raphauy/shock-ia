import { BookingDAO, getFutureBookingsDAOByEventId } from "@/services/booking-services";
import { getClientHaveCRMBySlug } from "@/services/clientService";
import { EventDAO, getEventDAO } from "@/services/event-services";
import { getSlots } from "@/services/slots-service";
import { EventType } from "@/lib/generated/prisma";
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
    const clientHaveCRM= await getClientHaveCRMBySlug(slug)

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
              <SingleSlotTabsPage eventId={eventId} initialEvents={calendarEvents} timezone={event.timezone} clientHaveCRM={clientHaveCRM} />
            }

            {
              event.type === EventType.FIXED_DATE && 
              <FixedDateTabsPage eventId={eventId} clientHaveCRM={clientHaveCRM} />
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
  
  // Crear la fecha actual en la zona horaria correcta
  const now = new Date();
  const zonedNow = toZonedTime(now, timezone);

  const DAYS_AHEAD= 60
  for (let i = 0; i < DAYS_AHEAD; i++) {
    // Formato de fecha para getSlots
    const dateStr = format(addDays(zonedNow, i), "yyyy-MM-dd")

    const seatsPerTimeSlot = event.seatsPerTimeSlot || 1;
    
    // Obtener los slots para este día
    const slots = getSlots(dateStr, bookings, availability, duration, timezone, seatsPerTimeSlot);

    slots.forEach(slot => {
      let title;
      if (slot.available) {
        if (slot.seatsTotal === 1) {
          title = `Libre`;
        } else {
          title = `Libre (${slot.seatsAvailable}/${slot.seatsTotal})`;
        }
        
      } else if (slot.seatsAvailable && slot.seatsAvailable > 0) {
        title = `${slot.seatsAvailable}/${slot.seatsTotal} disponibles`;
      } else {
        // chequear si está bloqueado
        if (slot.seatsTotal === 1 && slot.bookings?.some(booking => booking.name === "Bloqueado")) {
          title = "Bloqueado";
        } else {
          title = "Completo";
        }
      }

      // Los slots ya vienen con las fechas en UTC desde getSlots
      result.push({
        bookingId: slot.bookingId,
        title: title,
        start: slot.start,
        end: slot.end,
        color: slot.available ? "#fafffb" : event.color || "",
        status: "available" as const,
        clientId: event.clientId,
        eventId: event.id,
        seatsLeft: slot.seatsAvailable || 0,
        maxSeats: slot.seatsTotal || seatsPerTimeSlot,
        type: slot.available ? "free" : (slot.seatsAvailable && slot.seatsAvailable > 0) ? "partially_booked" : "fully_booked",
        bookings: slot.bookings,
        bigDuration: duration >= 120 // Consideramos slots grandes a los de 180 minutos o más
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