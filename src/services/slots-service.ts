import { addHours, addMinutes, endOfDay, isAfter, isBefore, isPast, parse, startOfDay } from "date-fns"
import { toZonedTime } from "date-fns-tz"
import { BookingDAO } from "./booking-services"
import moment from 'moment-timezone'

export type Slot = {
  start: Date
  end: Date
  available: boolean
  name?: string
}

// devuelve todos los slots del día, estén ocupados o no
export function getSlots(dateStr: string, bookings: BookingDAO[], availability: string[], duration: number, timezone: string) {
    const formatIsCorrect= checkDateFormat(dateStr)
    if (!formatIsCorrect) {
        throw new Error("Formato de fecha incorrecto")
    }

    console.log("dateStr:", dateStr)
    const date= parse(dateStr, "yyyy-MM-dd", new Date())

    const slots: Slot[] = []

    const zonedDate = toZonedTime(date, timezone);
    let dayOfWeek = zonedDate.getDay()
    if (dayOfWeek < 0) {
        dayOfWeek = 6
    }
    console.log("dayOfWeek: ", dayOfWeek);
    

    const dayAvailability = availability[dayOfWeek];
    if (!dayAvailability) {
        console.log("No hay disponibilidad para el día")
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

    console.log("range: ", rangeStartDate, " - ", rangeEndDate)
    
    const timeStart = toZonedTime(startOfDay(date), timezone)
    let timeEnd = addHours(timeStart, 24)
    const offsetInMinutes = moment.tz(date, timezone).utcOffset()
    timeEnd = moment(timeEnd).subtract(offsetInMinutes, 'minutes').toDate()

    console.log("timeStart: ", timeStart)
    console.log("timeEnd: ", timeEnd)

    const nowZoned = toZonedTime(new Date(), timezone)

    let timeCursor = timeStart

    while (isBefore(timeCursor, timeEnd)) {
        const slotStart= timeCursor
        const slotEnd= addMinutes(timeCursor, duration)

        console.log("slot: ", slotStart, " - ", slotEnd)

        const booking = bookings.find(b => 
            b.start.getTime() === slotStart.getTime() && 
            b.end.getTime() === slotEnd.getTime()
        );

        if (booking) {
            slots.push({
                start: transformTimezoneToUTC(slotStart, timezone),
                end: transformTimezoneToUTC(slotEnd, timezone),
                available: false,
                name: booking.name
            });
        } else {
            // chequear si el slot está dentro del rango de disponibilidad y si aún no pasó
            if (isBefore(slotStart, rangeEndDate) && isAfter(slotEnd, rangeStartDate) && isAfter(slotEnd, nowZoned)) {
                slots.push({
                    start: transformTimezoneToUTC(slotStart, timezone),
                    end: transformTimezoneToUTC(slotEnd, timezone),
                    available: true
                });
            } else {
                console.log("slot is out of range")
            }
        }

        timeCursor= slotEnd
    }

    return slots
}

// chequear el formato YYYY-MM-DD
function checkDateFormat(dateStr: string) {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    return regex.test(dateStr);
}


function transformTimezoneToUTC(date: Date, timezone: string): Date {
    // Obtener el offset en minutos para la fecha y el huso horario proporcionado
    const offsetInMinutes = moment.tz(date, timezone).utcOffset()
    
    // Restar el offset para convertir a UTC
    const utcDate = moment(date).subtract(offsetInMinutes, 'minutes').toDate()
    
    return utcDate
}
