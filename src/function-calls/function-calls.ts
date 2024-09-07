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

  const reservarEventoDuracionFija=
  {
    "name": "reservarEventoDuracionFija",
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
        "end": {
          "type": "string",
          "description": "Fecha y hora de fin de la reserva en formato YYYY-MM-DD HH:mm."
        },
        "name": {
          "type": "string",
          "description": "Nombre del cliente."
        }
      },
      "required": ["eventId", "start", "end", "name"]
    }
  }