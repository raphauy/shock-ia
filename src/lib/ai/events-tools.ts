import { obtenerDisponibilidad } from '@/services/functions';
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