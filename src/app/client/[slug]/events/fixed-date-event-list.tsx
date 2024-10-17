"use client"

import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { BookingDAO } from "@/services/booking-services"
import { format, isSameDay } from "date-fns"
import { Calendar, MessageCircle, PersonStanding, Search, TicketCheck, X } from "lucide-react"
import { BookingDialog, CancelBookingDialog, DeleteBookingDialog } from "../bookings/booking-dialogs"
import { EventDAO } from "@/services/event-services"
import { EventType } from "@prisma/client"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useMemo, useState } from "react"
import Link from "next/link"
import BookingDataCard from "./booking-data-card"

type Props = {
  event: EventDAO
  bookings: BookingDAO[]
  clientSlug: string
}
export default function FixedDateEventList({event, bookings, clientSlug}: Props) {
    const [searchTerm, setSearchTerm] = useState("")

    const filteredBookings = useMemo(() => {
        return bookings.filter(booking => 
          booking.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          booking.contact.toLowerCase().includes(searchTerm.toLowerCase())
        )
    }, [bookings, searchTerm])



    return (
        <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
                <div className="relative bg-green-50 w-full max-w-md">
                    <Input
                        placeholder="Buscar nombre o contacto..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 w-full"
                    />
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                    {searchTerm && (
                        <Button
                            variant="outline"
                            onClick={() => setSearchTerm("")}
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-sm h-8 px-2"
                        >
                            <X className="h-4 w-4 mr-1" />
                            Limpiar
                        </Button>
                    )}
                </div>

                <BookingDialog eventId={event.id} clientId={event.clientId} date={event.startDateTime!} eventType={EventType.FIXED_DATE}/>
            </div>

            {
                filteredBookings.length === 0 ? (
                    <p className="mt-10 text-center text-muted-foreground py-10 border-dashed border">No hay resultados</p>
                )
                :
                (
                    

                    <Card>
                        {filteredBookings.map((reservation: BookingDAO, index: number) => {
                            const conversationId= reservation.conversationId
                            const statusColor= reservation.status === "CANCELADO" ? "bg-gray-200" : reservation.status === "CONFIRMADO" ? "bg-green-200" : reservation.status === "RESERVADO" ? "bg-sky-200" : reservation.status === "PAGADO" ? "bg-blue-200" : reservation.status === "BLOQUEADO" ? "bg-red-200" : "bg-yellow-200"

                            const parsedData = reservation.data ? JSON.parse(reservation.data as string) : {}
                            const jsonReplaced = Object.keys(parsedData).reduce((acc, key) => {
                              if (key !== "nombre") {
                                acc[key] = parsedData[key] === true ? "SI" : parsedData[key] === false ? "NO" : parsedData[key]
                              }
                              return acc;
                            }, {} as Record<string, any>)
    
                            return (
                            <div key={index} className={`p-4 ${index !== 0 ? 'border-t' : ''}`}>
                                <div className="flex">
                                {
                                    conversationId ? (
                                        <div className="w-48">
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
                                <div className="flex-1">
                                    <BookingDataCard jsonData={jsonReplaced} />
                                </div>

                                <div className="flex flex-col items-end space-y-4 justify-self-end">
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
                )
            }
        </div>
    )

}