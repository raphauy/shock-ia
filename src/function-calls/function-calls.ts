const obtenerDisponibilidad=
{
    "name": "obtenerDisponibilidad",
    "description": "Devuelve la disponibilidad de un evento para una fecha específica.",
      "parameters": {
      "type": "object",
      "properties": {
        "eventId": {
          "type": "string",
          "description": "Id del evento que se quiere consultar."
        },
        "date": {
          "type": "string",
          "description": "Fecha en formato YYYY-MM-DD que se quiere consultar."
        }
      },
      "required": ["eventId", "date"]
    }
  }

const reservarParaEvento=
{
  "name": "reservarParaEvento",
  "description": "Reserva un un evento en una fecha específica.",
  "parameters": {
    "type": "object",
    "properties": {
      "conversationId": {
        "type": "string",
        "description": "Id de la conversación que se proporciona en el prompt."
      },
      "eventId": {
        "type": "string",
        "description": "Id del evento que se quiere reservar."
      },
      "start": {
        "type": "string",
        "description": "Fecha y hora de inicio de la reserva en formato YYYY-MM-DD HH:mm."
      },
      "duration": {
        "type": "string",
        "description": "Duración de la reserva en minutos."
      },
      "name": {
        "type": "string",
        "description": "Nombre del usuario. Hay que preguntarle al usuario por su nombre."
      }
    },
    "required": ["eventId", "start", "duration", "name"]
  }
}