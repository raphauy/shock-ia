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

const obtenerReservas=
{
  "name": "obtenerReservas",
  "description": "Devuelve las reservas de del usuario de la conversación actual.",
  "parameters": {
    "type": "object",
    "properties": {
      "conversationId": {
        "type": "string",
        "description": "Id de la conversación que se proporciona en el prompt."
      }
    }
  },
  "required": ["conversationId"]
}

const cancelarReserva=
{
  "name": "cancelarReserva",
  "description": "Cancela una reserva de un evento. Para obtener el id de la reserva, se debe usar la función obtenerReservas.",
  "parameters": {
    "type": "object",
    "properties": {
      "conversationId": {
        "type": "string",
        "description": "Id de la conversación que se proporciona en el prompt."
      },
      "bookingId": {
        "type": "string",
        "description": "Id de la reserva (bookingId) que se obtiene con la función obtenerReservas. Ej de bookingId: cm12jj0xr001d23y2bvgbpiem"
      }
    }
  },
  "required": ["conversationId", "bookingId"]
}


const notificarAsesor=
{
  "name": "notificarAsesor",
  "description": "Notifica a un asesor que es una persona que asistirá al usuario. Esta función se debe llamar cuando el usuario quiere hablar con una persona, con un humano o con un asesor.",
  "parameters": {
    "type": "object",
    "properties": {
      "conversationId": {
        "type": "string",
        "description": "Id de la conversación que se proporciona en el prompt."
      },
      "sucursal": {
        "type": "string",
        "description": "Sucursal de la que se quiere notificar al asesor. Las sucursales son: Casa Central o Costa Urbana."
      }
    }
  },
  "required": ["conversationId", "sucursal"]
}