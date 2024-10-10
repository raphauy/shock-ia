import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getFutureBookingsDAOByEventId, getBookingsByState, getBookingsDAO } from "@/services/booking-services"
import BigCalendar, { CalendarEvent } from "../big-calendar"
import EventList from "../event-list"
import FixedDateEventList from "../fixed-date-event-list"
import { BookingDialog } from "../../bookings/booking-dialogs"
import { getEventDAO } from "@/services/event-services"
import { EventType } from "@prisma/client"
import { getClient } from "@/services/clientService"


type Props = {
    eventId: string
}
export default async function FixedDateTabsPage({eventId}: Props) {

    const event= await getEventDAO(eventId)
    const client= await getClient(event.clientId)
    if (!client) {
        return <p>No se encontró el cliente</p>
    }
    const allBookings= await getBookingsDAO(eventId)
    const activeBookings= allBookings.filter(booking => booking.status === "RESERVADO" || booking.status === "CONFIRMADO" || booking.status === "PAGADO")
    const canceledBookings= allBookings.filter(booking => booking.status === "CANCELADO")


    return (
        <Tabs defaultValue="activas" className="min-w-[700px]">
            <TabsList className="flex justify-between w-full h-12 mb-8">
                <div>
                    <TabsTrigger value="activas">Reservas Activas</TabsTrigger>
                    <TabsTrigger value="canceladas">Reservas Canceladas</TabsTrigger>
                </div>
            </TabsList>
            <TabsContent value="activas">
                <FixedDateEventList event={event} bookings={activeBookings} clientSlug={client.slug} />
            </TabsContent>
            <TabsContent value="canceladas">
                <FixedDateEventList event={event} bookings={canceledBookings} clientSlug={client.slug} />
            </TabsContent>
        </Tabs>    
    )
}