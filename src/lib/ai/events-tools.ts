import { getClientIdByConversationId } from '@/services/clientService';
import { cancelarReserva, obtenerDisponibilidad, obtenerReservas, reservarParaEvento, reservarParaEventoDeUnicaVez } from '@/services/functions';
import { tool } from 'ai';
import { z } from 'zod';

//const obtenerDisponibilidad=
// {
//   "name": "obtenerDisponibilidad",
//   "description": "Devuelve la disponibilidad de un evento para una fecha específica.",
//     "parameters": {
//     "type": "object",
//     "properties": {
//       "eventId": {
//         "type": "string",
//         "description": "Id del evento que se quiere consultar."
//       },
//       "date": {
//         "type": "string",
//         "description": "Fecha en formato YYYY-MM-DD que se quiere consultar."
//       }
//     },
//     "required": ["eventId", "date"]
//   }
// }

export const obtenerDisponibilidadTool= {
    obtenerDisponibilidad: tool({
        description: 'Devuelve la disponibilidad de un evento para una fecha específica.',
        parameters: z.object({
            eventId: z.string().describe('Id del evento que se quiere consultar.'),
            date: z.string().describe('Fecha en formato YYYY-MM-DD que se quiere consultar.'),
        }),
        execute: async ({ eventId, date }) => {
            const availability= await obtenerDisponibilidad("deprecated", eventId, date)
            return availability
        },
    }),
}

// const reservarParaEvento=
// {
//   "name": "reservarParaEvento",
//   "description": "Reserva un evento en una fecha específica que indique el usuario. Debes preguntar al usuario cada campo de la metadata para crear el objeto y pasarlo como string en el campo metadata.",
//   "parameters": {
//     "type": "object",
//     "properties": {
//       "conversationId": {
//         "type": "string",
//         "description": "Id de la conversación que se proporciona en el prompt."
//       },
//       "eventId": {
//         "type": "string",
//         "description": "Id del evento que se quiere reservar."
//       },
//       "start": {
//         "type": "string",
//         "description": "Fecha y hora de inicio de la reserva en formato YYYY-MM-DD HH:mm."
//       },
//       "duration": {
//         "type": "integer",
//         "description": "Duración de la reserva en minutos."
//       },
//       "seats": {
//         "type": "integer",
//         "description": "Cantidad de cupos que se quiere reservar. Por defecto es 1."
//       },
//       "metadata": {
//         "type": "string",
//         "description": "Este campo es un objeto JSON serializado. Los campos de la metadata están junto a la información del evento."
//       }
//     },
//     "required": ["conversationId", "eventId", "start", "duration", "metadata"]
//   }
// }

export const reservarParaEventoTool= {
    reservarParaEvento: tool({
        description: 'Reserva un evento en una fecha específica que indique el usuario. Debes preguntar al usuario cada campo de la metadata para crear el objeto y pasarlo como string en el campo metadata.',
        parameters: z.object({
            conversationId: z.string().describe('Id de la conversación que se proporciona en el prompt.'),
            eventId: z.string().describe('Id del evento que se quiere reservar.'),
            start: z.string().describe('Fecha y hora de inicio de la reserva en formato YYYY-MM-DD HH:mm.'),
            duration: z.number().describe('Duración de la reserva en minutos.'),
            seats: z.number().optional().describe('Cantidad de cupos que se quiere reservar. Por defecto es 1.'),
            metadata: z.string().describe('Este campo es un objeto JSON serializado. Los campos de la metadata están junto a la información del evento.'),
        }),
        execute: async ({ conversationId, eventId, start, duration, seats, metadata }) => {
            try {
                const clientId= await getClientIdByConversationId(conversationId)
                if (!clientId) return "No se encontró un cliente para el conversationId: " + conversationId

                let seatsNumber= 1
                if (seats) {
                    seatsNumber= seats
                }

                const reservation= await reservarParaEvento(clientId, conversationId, eventId, start, String(duration), metadata, String(seatsNumber))
                console.log("reservation: ", reservation)
                return reservation
            } catch (error) {
                console.error("Error al reservar para evento:", error)
                return "Error al reservar para evento"
            }
            
        },
    }),
}

// const reservarParaEventoDeUnicaVez=
// {
//   "name": "reservarParaEventoDeUnicaVez",
//   "description": "Reserva un evento de unica vez para el usuario. Debes preguntar al usuario cada campo de la metadata para crear el objeto y pasarlo como string en el campo metadata.",
//   "parameters": {
//     "type": "object",
//     "properties": {
//       "conversationId": {
//         "type": "string",
//         "description": "Id de la conversación que se proporciona en el prompt."
//       },
//       "eventId": {
//         "type": "string",
//         "description": "Id del evento que se quiere reservar."
//       },
//       "metadata": {
//         "type": "string",
//         "description": "Este campo es un objeto JSON serializado. Los campos de la metadata están junto a la información del evento."
//       }
//     },
//     "required": ["conversationId", "eventId", "metadata"]
//   }
// }

export const reservarParaEventoDeUnicaVezTool= {
    reservarParaEventoDeUnicaVez: tool({
        description: 'Reserva un evento de unica vez para el usuario. Debes preguntar al usuario cada campo de la metadata para crear el objeto y pasarlo como string en el campo metadata.',
        parameters: z.object({
            conversationId: z.string().describe('Id de la conversación que se proporciona en el prompt.'),
            eventId: z.string().describe('Id del evento que se quiere reservar.'),
            metadata: z.string().describe('Este campo es un objeto JSON serializado. Los campos de la metadata están junto a la información del evento.'),
        }),
        execute: async ({ conversationId, eventId, metadata }) => {
            try {
                const clientId= await getClientIdByConversationId(conversationId)
                if (!clientId) return "No se encontró un cliente para el conversationId: " + conversationId
                const reservation= await reservarParaEventoDeUnicaVez(clientId, conversationId, eventId, metadata)
                return reservation
            } catch (error) {
                console.error("Error al reservar para evento de unica vez:", error)
                return "Error al reservar para evento de unica vez"
            }
        },
    }),
}

// const obtenerReservas=
// {
//   "name": "obtenerReservas",
//   "description": "Devuelve las reservas de del usuario de la conversación actual.",
//   "parameters": {
//     "type": "object",
//     "properties": {
//       "conversationId": {
//         "type": "string",
//         "description": "Id de la conversación que se proporciona en el prompt."
//       }
//     }
//   },
//   "required": ["conversationId"]
// }

export const obtenerReservasTool= {
    obtenerReservas: tool({
        description: 'Devuelve las reservas de del usuario de la conversación actual.',
        parameters: z.object({
            conversationId: z.string().describe('Id de la conversación que se proporciona en el prompt.'),
        }),
        execute: async ({ conversationId }) => {
            try {
                const clientId= await getClientIdByConversationId(conversationId)
                if (!clientId) return "No se encontró un cliente para el conversationId: " + conversationId
                const reservations= await obtenerReservas(clientId, conversationId)
                return reservations
            } catch (error) {
                console.error("Error al obtener reservas:", error)
                return "Error al obtener reservas"
            }
        },
    }),
}

// const cancelarReserva=
// {
//   "name": "cancelarReserva",
//   "description": "Cancela una reserva de un evento. Para obtener el id de la reserva, se debe usar la función obtenerReservas.",
//   "parameters": {
//     "type": "object",
//     "properties": {
//       "conversationId": {
//         "type": "string",
//         "description": "Id de la conversación que se proporciona en el prompt."
//       },
//       "bookingId": {
//         "type": "string",
//         "description": "Id de la reserva (bookingId) que se obtiene con la función obtenerReservas. Ej de bookingId: cm12jj0xr001d23y2bvgbpiem"
//       }
//     }
//   },
//   "required": ["conversationId", "bookingId"]
// }


export const cancelarReservaTool= {
    cancelarReserva: tool({
        description: 'Cancela una reserva de un evento. Para obtener el id de la reserva, se debe usar la función obtenerReservas.',
        parameters: z.object({
            conversationId: z.string().describe('Id de la conversación que se proporciona en el prompt.'),
            bookingId: z.string().describe('Id de la reserva (bookingId) que se obtiene con la función obtenerReservas. Ej de bookingId: cm12jj0xr001d23y2bvgbpiem'),
        }),
        execute: async ({ conversationId, bookingId }) => {
            try {
                const clientId= await getClientIdByConversationId(conversationId)
                if (!clientId) return "No se encontró un cliente para el conversationId: " + conversationId
                const reservation= await cancelarReserva(clientId, conversationId, bookingId)
                return reservation
            } catch (error) {
                console.error("Error al cancelar reserva:", error)
                return "Error al cancelar reserva"
            }
        },
    }),
}