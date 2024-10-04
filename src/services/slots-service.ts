import { addHours, addMinutes, areIntervalsOverlapping, endOfDay, isAfter, isBefore, isPast, parse, startOfDay } from "date-fns"
import { toZonedTime } from "date-fns-tz"
import { BookingDAO, getFutureBookingsDAOByEventId } from "./booking-services"
import moment from 'moment-timezone'
import { checkDateFormatForSlot } from "@/lib/utils"
import { EventDAO, getEventDAO } from "./event-services"

export type Slot = {
  start: Date
  end: Date
  available: boolean
  name?: string
  bookingId?: string
}

// devuelve todos los slots del día, estén ocupados o no
export function getSlots(dateStr: string, bookings: BookingDAO[], availability: string[], duration: number, timezone: string) {
    const formatIsCorrect= checkDateFormatForSlot(dateStr)
    if (!formatIsCorrect) {
        throw new Error("Formato de fecha incorrecto")
    }

    const date= parse(dateStr, "yyyy-MM-dd", new Date())

    const slots: Slot[] = []

    const zonedDate = toZonedTime(date, timezone);
    let dayOfWeek = zonedDate.getDay()
    if (dayOfWeek < 0) {
        dayOfWeek = 6
    }
    

    const dayAvailability = availability[dayOfWeek];
    if (!dayAvailability) {
        //console.log("No hay disponibilidad para el día")
        return slots
    }

    const hourRange= dayAvailability.split("-")
    const hourRangeStart: number= parseInt(hourRange[0].split(":")[0])
    const hourRangeEnd: number= parseInt(hourRange[1].split(":")[0])
    const minuteRangeStart: number= parseInt(hourRange[0].split(":")[1])
    const minuteRangeEnd: number= parseInt(hourRange[1].split(":")[1])
    let rangeStart= date.setHours(hourRangeStart, minuteRangeStart, 0, 0)
    const rangeStartDate= new Date(rangeStart)
    let rangeEnd= date.setHours(hourRangeEnd, minuteRangeEnd, 0, 0)
    const rangeEndDate= new Date(rangeEnd)

    const timeStart = toZonedTime(startOfDay(date), timezone)
    let timeEnd = addHours(timeStart, 24)
    const offsetInMinutes = moment.tz(date, timezone).utcOffset()
    timeEnd = moment(timeEnd).subtract(offsetInMinutes, 'minutes').toDate()

    const nowZoned = toZonedTime(new Date(), timezone)

    let timeCursor = timeStart

    while (isBefore(timeCursor, timeEnd)) {
        const slotStart= timeCursor
        const slotEnd= addMinutes(timeCursor, duration)

        //console.log("slot: ", slotStart, " - ", slotEnd)

        const booking = bookings.find(b => 
            b.start.getTime() === slotStart.getTime() && 
            b.end.getTime() === slotEnd.getTime()
        );

        if (booking) {
            slots.push({
                start: transformTimezoneToUTC(slotStart, timezone),
                end: transformTimezoneToUTC(slotEnd, timezone),
                available: false,
                name: booking.name,
                bookingId: booking.id
            });
        } else {
            // chequear si el slot está dentro del rango de disponibilidad y si aún no pasó
            if (isBefore(slotStart, rangeEndDate) && isAfter(slotEnd, rangeStartDate) && isAfter(slotStart, nowZoned)) {
                slots.push({
                    start: transformTimezoneToUTC(slotStart, timezone),
                    end: transformTimezoneToUTC(slotEnd, timezone),
                    available: true
                });
            } else {
                //console.log("slot is out of range")
            }
        }

        timeCursor= slotEnd
    }

    return slots
}

export async function checkBookingAvailability(start: Date, end: Date, event: EventDAO){

    const bookings= await getFutureBookingsDAOByEventId(event.id, event.timezone)

    const zonedStart= toZonedTime(start, event.timezone)
    const zonedEnd= toZonedTime(end, event.timezone)

    console.log("Checking booking availability for: ", zonedStart, " - ", zonedEnd)    

    // iterar sobre los bookings y chequear si el nuevo booking se solapa con alguno de los existentes
    for (const booking of bookings) {
        if (areIntervalsOverlapping({start: zonedStart, end: zonedEnd}, {start: booking.start, end: booking.end})) {
            return false
        }
    }

    // chequear si el slot está dentro del rango de disponibilidad y si aún no pasó
    let dayOfWeek= zonedStart.getDay() - 1
    if (dayOfWeek < 0) dayOfWeek = 6

    console.log("dayOfWeek: ", dayOfWeek)
    const availability= event.availability[dayOfWeek]
    // availability exampe: ["","","","","14:00-20:00","09:00-18:00",""]
    if (!availability) return false

    const rangeStart= availability.split("-")[0]
    const rangeEnd= availability.split("-")[1]

    const rangeStartDate= parse(rangeStart, "HH:mm", zonedStart)
    const rangeEndDate= parse(rangeEnd, "HH:mm", zonedStart)
    console.log("range: ", rangeStartDate, " - ", rangeEndDate)

    const nowZoned= toZonedTime(new Date(), event.timezone)
    if (
        zonedStart.getTime() >= rangeStartDate.getTime() &&
        zonedEnd.getTime() >= rangeStartDate.getTime() &&
        zonedStart.getTime() <= rangeEndDate.getTime() &&
        zonedEnd.getTime() <= rangeEndDate.getTime() &&
        zonedStart.getTime() >= nowZoned.getTime()
    ) {
        return true
    }

    return false
}



export function transformTimezoneToUTC(date: Date, timezone: string): Date {
    // Obtener el offset en minutos para la fecha y el huso horario proporcionado
    const offsetInMinutes = moment.tz(date, timezone).utcOffset()
    
    // Restar el offset para convertir a UTC
    const utcDate = moment(date).subtract(offsetInMinutes, 'minutes').toDate()
    
    return utcDate
}
