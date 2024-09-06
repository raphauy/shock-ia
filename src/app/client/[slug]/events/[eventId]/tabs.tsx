import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getFutureBookingsDAOByEventId } from "@/services/booking-services"
import BigCalendar, { CalendarEvent } from "../big-calendar"
import EventList from "../event-list"


type Props = {
    slug: string
    eventId: string
    initialEvents: CalendarEvent[]
}
export default async function TabsPage({slug, eventId, initialEvents}: Props) {

    const bookings= await getFutureBookingsDAOByEventId(eventId)

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
                <BigCalendar initialEvents={initialEvents} />
            </TabsContent>
            <TabsContent value="listado">
                <EventList bookings={bookings.filter(booking => booking.status !== "CANCELADO")} />
            </TabsContent>
            <TabsContent value="canceladas">
                <EventList bookings={bookings.filter(booking => booking.status === "CANCELADO")} />
            </TabsContent>
        </Tabs>    
    )
}