import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getFutureBookingsDAOByEventId, getBookingsByState } from "@/services/booking-services"
import BigCalendar, { CalendarEvent } from "../big-calendar"
import EventList from "../event-list"
import { getEventDAO } from "@/services/event-services"
import { getClient } from "@/services/clientService"


type Props = {
    eventId: string
    initialEvents: CalendarEvent[]
    timezone: string
}
export default async function SingleSlotTabsPage({eventId, initialEvents, timezone}: Props) {

    const event= await getEventDAO(eventId)
    const client= await getClient(event.clientId)
    if (!client) {
        return <p>No se encontró el cliente</p>
    }


    const bookings= await getFutureBookingsDAOByEventId(eventId, timezone)
    const noBlockedBookings= bookings.filter(booking => booking.status !== "BLOQUEADO")
    const canceledBookings= await getBookingsByState(eventId, "CANCELADO")

    return (
        <Tabs defaultValue="calendario" className="min-w-[700px]">
            <TabsList className="flex justify-between w-full h-12 mb-8">
                <div>
                    <TabsTrigger value="calendario">Calendario</TabsTrigger>
                    <TabsTrigger value="listado">Próximas Reservas</TabsTrigger>
                    <TabsTrigger value="canceladas">Reservas Canceladas</TabsTrigger>
                </div>
            </TabsList>
            <TabsContent value="calendario">
                <BigCalendar initialEvents={initialEvents} timezone={timezone} />
            </TabsContent>
            <TabsContent value="listado">
                <EventList bookings={noBlockedBookings} clientSlug={client.slug} />
            </TabsContent>
            <TabsContent value="canceladas">
                <EventList bookings={canceledBookings} clientSlug={client.slug} />
            </TabsContent>
        </Tabs>    
    )
}