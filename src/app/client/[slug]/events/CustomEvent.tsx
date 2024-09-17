import { format } from "date-fns";
import { BlockSlotDialog, BookingDialog, CancelBookingDialog } from "../bookings/booking-dialogs";
import { CalendarEvent } from "./big-calendar";

interface CustomEventProps {
  event: CalendarEvent,
}

const CustomEvent: React.FC<CustomEventProps> = ({ event }) => {

  const timeFormated= format(event.start, "HH:mm")
  const isBlocked= event.title === "Bloqueado"
  const description= isBlocked ? `Seguro que desea quitar de bloqueado el slot de las ${timeFormated}?` : `Seguro que desea cancelar la reserva de ${event.title}?`
  return (
    <>
      {
        event.title && (
          <div className="relative flex items-center h-full" > 
            {/* <div className={cn("absolute bottom-0 border border-white right-0 rounded-full w-5 h-5", statusColor)}/> */}
              
            <div className="text-sm font-bold text-gray-700 line-clamp-2 whitespace-pre-wrap flex items-center justify-between w-full">
              {event.title} 
              {
                event.bookingId && <CancelBookingDialog id={event.bookingId} description={description} size="sm"/>
              }
              
              {
                event.type === "free" && (
                  <div className="flex flex-col gap-1">
                    <BookingDialog clientId={event.clientId} eventId={event.eventId} date={event.start} availableSeats={event.availableSeats}/>
                    <BlockSlotDialog eventId={event.eventId} start={event.start} end={event.end} description={`Seguro que desea bloquear el slot de las ${timeFormated}?`} size="sm"/>
                  </div>
                )
              }
            </div>
          </div>  
        )
      }
    </>
  );
};

export default CustomEvent;
