import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getBookingsDAO } from "@/services/booking-services"
import { getClient } from "@/services/clientService"
import { getEventDAO } from "@/services/event-services"
import FixedDateEventList from "../fixed-date-event-list"


type Props = {
    eventId: string
    clientHaveCRM: boolean
}
export default async function FixedDateTabsPage({eventId, clientHaveCRM}: Props) {

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
                <FixedDateEventList event={event} bookings={activeBookings} clientSlug={client.slug} clientHaveCRM={clientHaveCRM} />
            </TabsContent>
            <TabsContent value="canceladas">
                <FixedDateEventList event={event} bookings={canceledBookings} clientSlug={client.slug} clientHaveCRM={clientHaveCRM}    />
            </TabsContent>
        </Tabs>    
    )
}