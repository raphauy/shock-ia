import { toZonedTime } from "date-fns-tz"
import { getEventDAO } from "./event-services"
import { getSlots } from "./slots-service"
import { getFutureBookingsDAOByEventId } from "./booking-services"

async function main() {


    const cancha2Id= "cm0qsb4ec00039rm6uwxn8hdv" // Cancha 2
    const cancha3Id= "cm0jho69d0001bicps39c95zo" // Cancha 3

    const dateStr= "2024-09-08"

    const eventCancha2= await getEventDAO(cancha2Id)
    console.log("timezone:", eventCancha2.timezone)
    const bookings= await getFutureBookingsDAOByEventId(cancha2Id)
    const slots= getSlots(dateStr, bookings, eventCancha2.availability, eventCancha2.duration, eventCancha2.timezone)
    console.log("slots:")
    console.log(slots)

    const eventCancha3= await getEventDAO(cancha3Id)
    console.log("timezone:", eventCancha3.timezone)
    const bookings2= await getFutureBookingsDAOByEventId(cancha3Id)
    const slots2= getSlots(dateStr, bookings2, eventCancha3.availability, eventCancha3.duration, eventCancha3.timezone)

    console.log("slots2:")
    console.log(slots2)
}
  
main()
