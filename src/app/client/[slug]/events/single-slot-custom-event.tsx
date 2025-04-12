import { format } from "date-fns";
import { BlockSlotDialog, BookingDialog, CancelBookingDialog } from "../bookings/booking-dialogs";
import { CalendarEvent } from "./big-calendar";
import { PersonStanding } from "lucide-react";
import { EventType } from "@/lib/generated/prisma";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";

interface CustomEventProps {
  event: CalendarEvent,
}

export default function SingleSlotCustomEvent({ event }: CustomEventProps) {
  const timeFormated = format(event.start, "HH:mm");
  const isBlocked = event.title === "Bloqueado";
  const description = isBlocked 
    ? `Seguro que desea quitar de bloqueado el slot de las ${timeFormated}?` 
    : `Seguro que desea cancelar la reserva de ${event.title}?`;

  // Calcular el porcentaje de ocupación para el Progress bar
  const occupiedSeats = event.maxSeats - event.seatsLeft;
  const occupancyPercentage = Math.round((occupiedSeats / event.maxSeats) * 100);
  
  // Determinar el color del Progress bar según la ocupación
  const getProgressColor = () => {
    if (occupancyPercentage === 0) return "bg-green-500"; // Completamente libre
    if (occupancyPercentage < 50) return "bg-green-400"; // Mayormente libre
    if (occupancyPercentage < 75) return "bg-yellow-400"; // Parcialmente ocupado
    if (occupancyPercentage < 100) return "bg-orange-500"; // Mayormente ocupado
    return "bg-red-500"; // Completamente ocupado
  };

  if (event.type === "free" || event.type === "partially_booked" || event.type === "fully_booked" || event.type === "booking") {
    // Si el evento tiene solo 1 cupo, mantenemos la visualización actual
    if (event.maxSeats === 1) {
      return (
        <div className="relative flex items-center h-full"> 
          <div className="text-sm font-bold text-gray-700 line-clamp-2 whitespace-pre-wrap flex items-center justify-between w-full">
            <div>
              {event.title}
            </div>
            
            {
              (event.type === "booking" || event.type === "fully_booked") && event.bookingId && (
                <CancelBookingDialog id={event.bookingId} description={description} size="sm"/>
              )
            }
            
            {
              (event.type === "free" || event.type === "partially_booked") && (
                <div className="flex flex-col gap-1">
                  <BookingDialog 
                    clientId={event.clientId} 
                    eventId={event.eventId} 
                    date={event.start} 
                    eventType={EventType.SINGLE_SLOT} 
                    maxSeats={event.seatsLeft} 
                  />
                  <BlockSlotDialog 
                    eventId={event.eventId} 
                    start={event.start} 
                    end={event.end} 
                    description={`Seguro que desea bloquear ${event.seatsLeft} cupo(s) del slot de las ${timeFormated}?`} 
                    size="sm"
                    seats={event.seatsLeft}
                  />
                </div>
              )
            }
          </div>
        </div>  
      );
    }
    
    // Para eventos con múltiples cupos, mostramos el Progress bar
    return (
      <div className="relative flex flex-col h-full p-1"> 
        <div className="flex flex-col w-full gap-1">
          {/* Primera línea: información de ocupación y botones de acción */}
          <div className="flex justify-between items-center">
            <span className="text-xs font-medium text-gray-700">
              {event.seatsLeft}/{event.maxSeats}
              {event.type === "fully_booked" && (
                <span className="ml-2 text-red-600">Completo</span>
              )}
            </span>
            
            <div className="flex gap-1">
              {
                (event.type === "booking" || event.type === "fully_booked") && event.bookingId && (
                  <CancelBookingDialog id={event.bookingId} description={description} size="sm"/>
                )
              }
              
              {
                (event.type === "free" || event.type === "partially_booked") && (
                  <>
                    <BookingDialog 
                      clientId={event.clientId} 
                      eventId={event.eventId} 
                      date={event.start} 
                      eventType={EventType.SINGLE_SLOT} 
                      maxSeats={event.seatsLeft} 
                    />
                    <BlockSlotDialog 
                      eventId={event.eventId} 
                      start={event.start} 
                      end={event.end} 
                      description={`Seguro que desea bloquear ${event.seatsLeft} cupo(s) del slot de las ${timeFormated}?`} 
                      size="sm"
                      seats={event.seatsLeft}
                    />
                  </>
                )
              }
            </div>
          </div>
          
          {/* Segunda línea: Progress bar */}
          <Progress 
            value={occupancyPercentage} 
            indicatorColor={getProgressColor()} 
            className="h-2.5 w-full"
          />
        </div>
        
        {/* Mostrar ScrollArea con detalles de reservas solo para slots grandes */}
        {event.bigDuration && event.bookings && event.bookings.length > 0 && (
          <ScrollArea className="h-[calc(100%-36px)] w-full mt-1">
            <div className="text-xs font-normal text-gray-700">
              {event.bookings.map((booking) => (
                <div key={booking.bookingId} className="flex items-center py-0.5">
                  <span>
                    {booking.name}
                    {booking.seats > 1 && ` (${booking.seats} cupos)`}
                  </span>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </div>  
    );
  }

  const seatsBooked = event.maxSeats - event.seatsLeft;
  if (event.type === "fixed-date") 
    return (
      <div className="relative flex items-center h-full"> 
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
