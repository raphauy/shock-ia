import { toZonedTime } from "date-fns-tz"
import { getEventDAO } from "./event-services"
import { getSlots } from "./slots-service"
import { getFutureBookingsDAOByEventId } from "./booking-services"
import { functionHaveRepository } from "./function-services"
import { isInWorkHours } from "./functions"

async function main() {


    const cancha2Id= "cm0qsb4ec00039rm6uwxn8hdv" // Cancha 2
    const cancha3Id= "cm0jho69d0001bicps39c95zo" // Cancha 3

    const dateStr= "2024-09-07"

    // const eventCancha2= await getEventDAO(cancha2Id)
    // console.log("timezone:", eventCancha2.timezone)
    // const bookings= await getFutureBookingsDAOByEventId(cancha2Id)
    // const slots= getSlots(dateStr, bookings, eventCancha2.availability, eventCancha2.duration, eventCancha2.timezone)
    // console.log("slots:")
    // console.log(slots)


//    const dateTime= toZonedTime(new Date("2024-09-15T09:59:00"), "America/Montevideo")
    const dateTime= toZonedTime(new Date(), "America/Montevideo")
    console.log("isInWorkHours:", isInWorkHours(dateTime))
}
  
//main()
