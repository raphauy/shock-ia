import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BookingDAO } from "@/services/booking-services"
import { addMinutes, format, isSameDay } from "date-fns"
import { es } from "date-fns/locale"
import { XIcon, Edit2Icon, FilterIcon, PersonStanding } from "lucide-react"
import { CancelBookingDialog, DeleteBookingDialog } from "../bookings/booking-dialogs"
import { cn } from "@/lib/utils"

type Props = {
  bookings: BookingDAO[]
  timezone: string
}
export default function EventList({bookings, timezone}: Props) {

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
                        const statusColor= reservation.status === "CANCELADO" ? "bg-gray-200" : reservation.status === "CONFIRMADO" ? "bg-green-200" : reservation.status === "RESERVADO" ? "bg-sky-200" : reservation.status === "PAGADO" ? "bg-blue-200" : "bg-yellow-200"
                        return (
                        <div key={index} className={`p-4 ${index !== 0 ? 'border-t' : ''}`}>
                            <div className="flex justify-between items-start">
                            <div>
                                <p className="font-semibold">{format(reservation.start, 'dd MMMM', {locale: es})}</p>
                                <p className="text-sm text-muted-foreground">{time}</p>
                                <p className="mt-2">{reservation.name}</p>
                                <p className="mt-2">{reservation.contact}</p>
                            </div>
                            <div className="flex space-x-2">
                                { reservation.status === "CANCELADO" ? 
                                    <DeleteBookingDialog id={reservation.id} description={`Seguro que desea eliminar la reserva de ${reservation.name}?`} />
                                    :
                                    <CancelBookingDialog id={reservation.id} description={`Seguro que desea cancelar la reserva de ${reservation.name}?`} />
                                }
                            </div>
                            </div>
                            <div className="mt-2 flex justify-between">
                                <span className="inline-block bg-secondary text-secondary-foreground rounded px-2 py-1 text-xs font-bold border">
                                    {reservation.eventName}
                                </span>
                                <div className="flex items-center gap-2">
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