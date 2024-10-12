import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { BookingDAO } from "@/services/booking-services"
import { format, isSameDay } from "date-fns"
import { es } from "date-fns/locale"
import { Calendar, MessageCircle, PersonStanding, TicketCheck } from "lucide-react"
import { CancelBookingDialog, DeleteBookingDialog } from "../bookings/booking-dialogs"
import BookingDataCard from "./booking-data-card"
import Link from "next/link"

type Props = {
  bookings: BookingDAO[]
  clientSlug: string
}
export default function EventList({bookings, clientSlug}: Props) {

    if (bookings.length === 0) {
        return <p className="text-center text-muted-foreground mt-4">No hay reservas</p>
    }

    function renderReservationGroup(bookings: BookingDAO[], title: string) {
        if (bookings.length === 0) {
            return null
        }
        return (
            <div className="mb-8">
                <h3 className="text-sm font-semibold text-muted-foreground mb-2">{title}</h3>
                <Card>
                    {bookings.map((reservation: BookingDAO, index: number) => {
                        const time= `${format(reservation.start, 'HH:mm')} - ${format(reservation.end, 'HH:mm')}`
                        const statusColor= reservation.status === "CANCELADO" ? "bg-gray-200" : reservation.status === "CONFIRMADO" ? "bg-green-200" : reservation.status === "RESERVADO" ? "bg-sky-200" : reservation.status === "PAGADO" ? "bg-blue-200" : reservation.status === "BLOQUEADO" ? "bg-red-200" : "bg-yellow-200"

                        const parsedData = reservation.data ? JSON.parse(reservation.data as string) : {}
                        const jsonReplaced = Object.keys(parsedData).reduce((acc, key) => {
                          if (key !== "nombre") {
                            acc[key] = parsedData[key] === true ? "SI" : parsedData[key] === false ? "NO" : parsedData[key]
                          }
                          return acc;
                        }, {} as Record<string, any>)

                        const conversationId= reservation.conversationId
                  
                        return (
                        <div key={index} className={`p-4 ${index !== 0 ? 'border-t' : ''}`}>
                            <div className="grid grid-cols-3">
                                {
                                    conversationId ? (
                                        <div>
                                            <Link href={`/client/${clientSlug}/chats?id=${conversationId}`} className="flex items-center gap-4" target="_blank">
                                                <p className="font-bold">{reservation.name}</p>
                                                <MessageCircle className="w-5 h-5 mb-1" />
                                            </Link>
                                            <p className="mt-2">{reservation.contact}</p>
                                        </div>                                    
                                    )
                                    :
                                    (
                                        <p className="font-bold">{reservation.name}</p>
                                    )
                                }
                                <div className="">
                                    <BookingDataCard jsonData={jsonReplaced} />
                                </div>
                                <div className="flex flex-col items-end space-y-4">
                                    <div>
                                        <p className="font-semibold">{format(reservation.start, 'dd MMMM', {locale: es})}</p>
                                        <p className="text-sm text-muted-foreground">{time}</p>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        { reservation.status === "CANCELADO" ? 
                                            <DeleteBookingDialog id={reservation.id} description={`Seguro que desea eliminar la reserva de ${reservation.name}?`} />
                                            :
                                            <CancelBookingDialog id={reservation.id} description={`Seguro que desea cancelar la reserva de ${reservation.name}?`} />
                                        }

                                    </div>

                                </div>
                            </div>
                            <div className="mt-4 flex justify-between">
                                <Badge variant="secondary" className="border-gray-300 rounded font-bold">{reservation.eventName}</Badge>
                                
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-1 justify-end text-muted-foreground text-sm">
                                        <TicketCheck className="w-4 h-4 mb-0.5" />
                                        <span>{format(reservation.createdAt, "dd MMM")}</span>
                                    </div>
                                    <div className="flex items-center gap-1 justify-end text-muted-foreground">
                                        <PersonStanding className="w-4 h-4 mb-0.5" />
                                        <span>{reservation.seats}</span>
                                    </div>
                                    <Badge variant="outline" className={cn(statusColor, "border-gray-300")}>{reservation.status}</Badge>
                                </div>
                            </div>
                        </div>
                    )})}
                </Card>
            </div>
        )
    }

  const now= new Date()

  return (
    <div>
        {renderReservationGroup(bookings.filter(b => isSameDay(b.start, now)), "HOY")}
        {renderReservationGroup(bookings.filter(b => !isSameDay(b.start, now)), "")}
        <p className="text-center text-sm text-muted-foreground mt-4">No hay más resultados</p>
    </div>
  )
}
