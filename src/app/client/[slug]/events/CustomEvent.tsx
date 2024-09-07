import { BookingDialog, CancelBookingDialog } from "../bookings/booking-dialogs";
import { CalendarEvent } from "./big-calendar";

interface CustomEventProps {
  event: CalendarEvent,
}

const CustomEvent: React.FC<CustomEventProps> = ({ event }) => {


  const statusColor= event.status === "APROBADO" ? "bg-green-500" : event.status === "REVISADO" ? "bg-orange-500" : event.status === "PROGRAMADO" ? "bg-sky-500" : event.status === "PUBLICADO" ? "bg-yellow-500" : "bg-gray-500"

  return (
    <>
      {
        event.title && (
          <div className="relative flex items-center h-full" > 
            {/* <div className={cn("absolute bottom-0 border border-white right-0 rounded-full w-5 h-5", statusColor)}/> */}
              
            <div className="text-sm font-bold text-gray-700 line-clamp-2 whitespace-pre-wrap flex items-center justify-between w-full">
              {event.title} 
              {
                event.bookingId && <CancelBookingDialog id={event.bookingId} description={`Seguro que desea cancelar la reserva de ${event.title}?`} size="sm"/>
              }
              
              {
                event.type === "free" && (
                  <BookingDialog clientId={event.clientId} eventId={event.eventId} date={event.start} availableSeats={event.availableSeats}/>
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
