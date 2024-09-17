import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getFutureBookingsDAOByEventId, getBookingsByState } from "@/services/booking-services"
import BigCalendar, { CalendarEvent } from "../big-calendar"
import EventList from "../event-list"


type Props = {
    eventId: string
    initialEvents: CalendarEvent[]
    timezone: string
}
export default async function TabsPage({eventId, initialEvents, timezone}: Props) {

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
                <EventList bookings={noBlockedBookings} timezone={timezone} />
            </TabsContent>
            <TabsContent value="canceladas">
                <EventList bookings={canceledBookings} timezone={timezone} />
            </TabsContent>
        </Tabs>    
    )
}