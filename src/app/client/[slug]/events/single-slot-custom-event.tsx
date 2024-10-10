import { format } from "date-fns";
import { BlockSlotDialog, BookingDialog, CancelBookingDialog } from "../bookings/booking-dialogs";
import { CalendarEvent } from "./big-calendar";
import { PersonStanding } from "lucide-react";
import { EventType } from "@prisma/client";

interface CustomEventProps {
  event: CalendarEvent,
}

export default function SingleSlotCustomEvent({ event }: CustomEventProps) {

  const timeFormated= format(event.start, "HH:mm")
  const isBlocked= event.title === "Bloqueado"
  const description= isBlocked ? `Seguro que desea quitar de bloqueado el slot de las ${timeFormated}?` : `Seguro que desea cancelar la reserva de ${event.title}?`

  if (event.type === "booking" || event.type === "free") 
    return (
      <div className="relative flex items-center h-full" > 
          
        <div className="text-sm font-bold text-gray-700 line-clamp-2 whitespace-pre-wrap flex items-center justify-between w-full">
          {event.title} 
          {
            event.type === "booking" && event.bookingId && (
              <CancelBookingDialog id={event.bookingId} description={description} size="sm"/>
            )
          }
          
          {
            event.type === "free" && (
              <div className="flex flex-col gap-1">
                <BookingDialog clientId={event.clientId} eventId={event.eventId} date={event.start} eventType={EventType.SINGLE_SLOT} />
                <BlockSlotDialog eventId={event.eventId} start={event.start} end={event.end} description={`Seguro que desea bloquear el slot de las ${timeFormated}?`} size="sm"/>
              </div>
            )
          }
        </div>
      </div>  
    );

    const seatsBooked= event.maxSeats - event.seatsLeft
    if (event.type === "fixed-date") 
      return (
        <div className="relative flex items-center h-full" > 
            
          <div className="font-bold text-gray-700 whitespace-pre-wrap w-full">
            <p>{event.title}</p>
            {
              event.type === "fixed-date" && (
                <div className="mt-4">
                  <div className="flex items-center gap-1">
                    <PersonStanding className="w-5 h-5 mb-1"/>
                    <p>{seatsBooked}/{event.maxSeats}</p>
                  </div>
                </div>
              )
            }
          </div>
        </div>  
      );
  };
