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
  seatsTotal?: number
  seatsAvailable?: number
  bookings?: {
    bookingId: string
    name: string
    seats: number
  }[]
}

// devuelve todos los slots del día, estén ocupados o no
export function getSlots(dateStr: string, bookings: BookingDAO[], availability: string[], duration: number, timezone: string, seatsPerTimeSlot: number = 1) {
    const formatIsCorrect= checkDateFormatForSlot(dateStr)
    if (!formatIsCorrect) {
        throw new Error("Formato de fecha incorrecto")
    }

    // Crear la fecha en la zona horaria correcta
    const date = moment.tz(dateStr, "YYYY-MM-DD", timezone).toDate();
    const slots: Slot[] = []

    // Obtener el día de la semana en la zona horaria correcta (0 = domingo, 1 = lunes, ..., 6 = sábado)
    const zonedDate = toZonedTime(date, timezone);
    let dayOfWeek = zonedDate.getDay();
    // Convertir a formato donde 0 = lunes, ..., 6 = domingo
    dayOfWeek = dayOfWeek === 0 ? 6 : dayOfWeek - 1
    
    // Verificar si hay disponibilidad para este día
    const dayAvailability = availability[dayOfWeek];
    if (!dayAvailability) {
        return slots;
    }

    // Parsear el rango de horas de disponibilidad
    const hourRange = dayAvailability.split("-")
    const hourRangeStart = parseInt(hourRange[0].split(":")[0])
    const hourRangeEnd = parseInt(hourRange[1].split(":")[0])
    const minuteRangeStart = parseInt(hourRange[0].split(":")[1])
    const minuteRangeEnd = parseInt(hourRange[1].split(":")[1])
    
    // Crear las fechas de inicio y fin del rango en la zona horaria correcta
    const rangeStartDate = moment.tz(dateStr, "YYYY-MM-DD", timezone)
        .hour(hourRangeStart)
        .minute(minuteRangeStart)
        .second(0)
        .millisecond(0)
        .toDate();
    
    const rangeEndDate = moment.tz(dateStr, "YYYY-MM-DD", timezone)
        .hour(hourRangeEnd)
        .minute(minuteRangeEnd)
        .second(0)
        .millisecond(0)
        .toDate();

    // Usar directamente el rango de disponibilidad como límites
    const timeStart = rangeStartDate;
    const timeEnd = rangeEndDate;

    const now= new Date()
    
    // Añadir un margen de tiempo para no mostrar slots que están a punto de comenzar
    // Por ejemplo, 15 minutos de margen
    const marginMinutes = 0;
    const nowPlusMargin = addMinutes(now, marginMinutes);

    let timeCursor = timeStart;

    while (isBefore(timeCursor, timeEnd)) {
        const slotStart = timeCursor;
        const slotEnd = addMinutes(timeCursor, duration);

        // Solo crear slots que comiencen dentro del rango, no excedan el final del rango
        // y que no hayan comenzado ya (considerando el margen de tiempo)
        if (
            isBefore(slotStart, timeEnd) && 
            !isAfter(slotEnd, addMinutes(timeEnd, 1)) && 
            isAfter(slotStart, nowPlusMargin)
        ) {
            const zonedSlotStart = toZonedTime(slotStart, timezone)
            const zonedSlotEnd = toZonedTime(slotEnd, timezone)
            // Filtrar todas las reservas que coinciden con este slot
            const slotBookings = bookings.filter(b => 
                b.start.getTime() === zonedSlotStart.getTime() && 
                b.end.getTime() === zonedSlotEnd.getTime()
            );

            // Calcular cuántos asientos están ocupados
            const occupiedSeats = slotBookings.reduce((total, booking) => total + booking.seats, 0);
            
            // Calcular cuántos asientos quedan disponibles
            const availableSeats = seatsPerTimeSlot - occupiedSeats;

            // Preparar la información de las reservas para este slot
            const bookingsInfo = slotBookings.map(booking => ({
                bookingId: booking.id,
                name: booking.name,
                seats: booking.seats
            }));

            slots.push({
                start: transformTimezoneToUTC(slotStart, timezone),
                end: transformTimezoneToUTC(slotEnd, timezone),
                available: availableSeats > 0,
                seatsTotal: seatsPerTimeSlot,
                seatsAvailable: availableSeats,
                bookings: bookingsInfo.length > 0 ? bookingsInfo : undefined
            });
        }

        timeCursor = addMinutes(timeCursor, duration);
    }

    return slots
}

export async function checkBookingAvailability(start: Date, end: Date, event: EventDAO, requestedSeats: number = 1){
    const bookings = await getFutureBookingsDAOByEventId(event.id, event.timezone)

    // Asegurarnos de que las fechas estén en la zona horaria correcta
    const zonedStart = toZonedTime(start, event.timezone)
    const zonedEnd = toZonedTime(end, event.timezone)

    console.log("Checking booking availability for: ", zonedStart, " - ", zonedEnd)    

    // Verificar si hay suficientes asientos disponibles para este slot
    const seatsPerTimeSlot = event.seatsPerTimeSlot || 1;
    
    // Filtrar las reservas que coinciden con este slot
    const slotBookings = bookings.filter(booking => 
        booking.start.getTime() === zonedStart.getTime() && 
        booking.end.getTime() === zonedEnd.getTime()
    );
    
    // Calcular cuántos asientos están ocupados
    const occupiedSeats = slotBookings.reduce((total, booking) => total + booking.seats, 0);
    
    // Verificar si hay suficientes asientos disponibles
    if (occupiedSeats + requestedSeats > seatsPerTimeSlot) {
        console.log(`No hay suficientes asientos disponibles. Ocupados: ${occupiedSeats}, Solicitados: ${requestedSeats}, Total: ${seatsPerTimeSlot}`);
        return false;
    }

    // Obtener el día de la semana en la zona horaria correcta (0 = domingo, 1 = lunes, ..., 6 = sábado)
    let dayOfWeek = zonedStart.getDay();
    dayOfWeek = dayOfWeek === 0 ? 6 : dayOfWeek - 1
    console.log(`Día de la semana: ${dayOfWeek} (0=domingo, 1=lunes, ..., 6=sábado)`);
    
    // Verificar si hay disponibilidad para este día
    const availability = event.availability[dayOfWeek];
    console.log(`Verificando disponibilidad para el día ${dayOfWeek}, disponibilidad: ${availability}`);
    
    if (!availability) {
        console.log(`No hay disponibilidad para el día ${dayOfWeek}`);
        return false;
    }

    // Parsear el rango de horas de disponibilidad
    const hourRange = availability.split("-")
    const hourRangeStart = parseInt(hourRange[0].split(":")[0])
    const hourRangeEnd = parseInt(hourRange[1].split(":")[0])
    const minuteRangeStart = parseInt(hourRange[0].split(":")[1])
    const minuteRangeEnd = parseInt(hourRange[1].split(":")[1])
    
    // Crear las fechas de inicio y fin del rango en la zona horaria correcta
    const dateStr = moment(zonedStart).format("YYYY-MM-DD")
    const rangeStartDate = moment.tz(dateStr, "YYYY-MM-DD", "UTC")
        .hour(hourRangeStart)
        .minute(minuteRangeStart)
        .second(0)
        .millisecond(0)
        .toDate();
    
    const rangeEndDate = moment.tz(dateStr, "YYYY-MM-DD", "UTC")
        .hour(hourRangeEnd)
        .minute(minuteRangeEnd)
        .second(0)
        .millisecond(0)
        .toDate();
    
    console.log("Rango de disponibilidad: ", rangeStartDate, " - ", rangeEndDate);

    const zonedNow = toZonedTime(new Date(), event.timezone)
    console.log("Hora actual: ", zonedNow);
    
    // Añadir un margen de tiempo para no permitir reservas en slots que están a punto de comenzar
    const marginMinutes = 0;
    const zonedNowPlusMargin = addMinutes(zonedNow, marginMinutes);
    console.log("Hora actual + margen: ", zonedNowPlusMargin);
    
    // Verificar que el slot comience y termine dentro del rango de disponibilidad
    // y que no haya comenzado ya (considerando el margen de tiempo)
    if (
        zonedStart.getTime() >= rangeStartDate.getTime() &&
        zonedEnd.getTime() <= rangeEndDate.getTime() &&
        zonedStart.getTime() >= zonedNowPlusMargin.getTime()
    ) {
        console.log("Slot disponible");
        return true;
    }

    console.log("Slot no disponible");
    return false;
}

export function transformTimezoneToUTC(date: Date, timezone: string): Date {
    // En lugar de manipular manualmente los offsets, usamos directamente moment-timezone
    // para convertir la fecha del timezone local a UTC
    return moment.tz(date, timezone).utc().toDate();
}
