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