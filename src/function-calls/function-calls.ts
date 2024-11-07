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
  "description": "Reserva un evento en una fecha específica que indique el usuario. Debes preguntar al usuario cada campo de la metadata para crear el objeto y pasarlo como string en el campo metadata.",
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
        "type": "integer",
        "description": "Duración de la reserva en minutos."
      },
      "metadata": {
        "type": "string",
        "description": "Este campo es un objeto JSON serializado. Los campos de la metadata están junto a la información del evento."
      }
    },
    "required": ["conversationId", "eventId", "start", "duration", "metadata"]
  }
}

const reservarParaEventoDeUnicaVez=
{
  "name": "reservarParaEventoDeUnicaVez",
  "description": "Reserva un evento de unica vez para el usuario. Debes preguntar al usuario cada campo de la metadata para crear el objeto y pasarlo como string en el campo metadata.",
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
      "metadata": {
        "type": "string",
        "description": "Este campo es un objeto JSON serializado. Los campos de la metadata están junto a la información del evento."
      }
    },
    "required": ["conversationId", "eventId", "metadata"]
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
      }
    }
  },
  "required": ["conversationId"]
}

const obtenerLinkDePago=
{
  "name": "obtenerLinkDePago",
  "description": "Devuelve el link de pago para un producto o servicio.",
  "parameters": {
    "type": "object",
    "properties": {
      "conversationId": {
        "type": "string",
        "description": "Id de la conversación que se proporciona en el prompt."
      },
      "companyId": {
        "type": "string",
        "description": "Id de la empresa que se va a pagar. Esta información se proporciona en el prompt."
      },
      "unitPrice": {
        "type": "number",
        "description": "Precio unitario del producto o servicio. Este precio está expresado en UYU, pesos uruguayos."
      },
      "quantity": {
        "type": "number",
        "description": "Cantidad de productos o servicios. Por ejemplo, si el usuario quiere comprar 2 entradas, la cantidad es 2."
      },
      "concept": {
        "type": "string",
        "description": "Concepto de la compra. Menos de 20 caracteres."
      }
    },
    "required": ["conversationId", "companyId", "unitPrice", "quantity", "concept"]
  }
}

const cambiarEstadoDeContacto=
{
  "name": "cambiarEstadoDeContacto",
  "description": "Cambia el estado de un contacto. La instrucción del nuevo estado estará en el prompt.",
  "parameters": {
    "type": "object",
    "properties": {
      "contactId": {
        "type": "string",
        "description": "Id del contacto que se obtiene con la función obtenerContactos."
      },
      "nuevoEstado": {
        "type": "string",
        "description": "Nuevo estado del contacto."
      }
    },
    "required": ["contactId", "nuevoEstado"]
  }
}