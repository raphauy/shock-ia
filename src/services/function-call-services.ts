import { Client, EventType } from "@prisma/client";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { es } from "date-fns/locale";
import OpenAI from "openai";
import { ChatCompletionCreateParams, ChatCompletionMessageParam } from "openai/resources/index.mjs";
import { getClientHaveCRM, getFunctionsOfClient } from "./clientService";
import { getContactByPhone } from "./contact-services";
import { getActiveConversation, saveFunction } from "./conversationService";
import { getClientCustomFields } from "./customfield-services";
import { getDocumentsDAOByClient } from "./document-services";
import { getActiveEventsDAOByClientId } from "./event-services";
import { getFieldValuesByContactId } from "./fieldvalue-services";
import { CompletionInitResponse, getAgentes, processFunctionCall } from "./functions";
import { getFullModelDAO } from "./model-services";
import { getFutureBookingsDAOByPhone } from "./booking-services";


export async function completionInit(phone: string, client: Client, functions: ChatCompletionCreateParams.Function[], messages: ChatCompletionMessageParam[], modelName?: string): Promise<CompletionInitResponse | null> {

  if (!client.modelId) throw new Error("Client modelId not found")

  const model= await getFullModelDAO(client.modelId)
  const provider= model.provider

  modelName= modelName || model.name
  
  const openai = new OpenAI({
    apiKey: provider.apiKey,
    baseURL: provider.baseUrl,
  })

  let completionResponse= null
  let agentes= false

  let baseArgs = {
    model: modelName,
    temperature: 0.1,
    messages
  }  

  const args = functions.length > 0 ? { ...baseArgs, functions: functions, function_call: "auto" } : baseArgs  

  const initialResponse = await openai.chat.completions.create(args as any);

  const usage= initialResponse.usage
  console.log("\tusage:")
  let promptTokens= usage ? usage.prompt_tokens : 0
  let completionTokens= usage ? usage.completion_tokens : 0
  console.log("\t\tpromptTokens: ", promptTokens)
  console.log("\t\tcompletionTokens: ", completionTokens)  

  let wantsToUseFunction = initialResponse.choices[0].finish_reason == "function_call"

  let assistantResponse: string | null = ""

  if (wantsToUseFunction) {
    console.log("\twantsToUseFunction!")

    const functionCall= initialResponse.choices[0].message.function_call
    if (!functionCall) throw new Error("No function_call message")

    const name= functionCall.name
    let args = JSON.parse(functionCall.arguments || "{}")      

    const content= await processFunctionCall(client.id, name, args)

    messages.push(initialResponse.choices[0].message)
    messages.push({
      role: "function",
      name, 
      content,
    })
    agentes= await getAgentes(name)

    const completion= { function_call: { name, arguments: JSON.stringify(args) } }
    await saveFunction(phone, JSON.stringify(completion), client.id)

    const stepResponse = await completionInit(phone, client, functions, messages, modelName)
    if (!stepResponse) return null

    return {
      assistantResponse: stepResponse.assistantResponse,
      promptTokens: stepResponse.promptTokens + promptTokens,
      completionTokens: stepResponse.completionTokens + completionTokens,
      agentes: stepResponse.agentes || agentes
    }

  } else {
    console.log("\tsimple response!")      
    assistantResponse = initialResponse.choices[0].message.content
    completionResponse= { assistantResponse, promptTokens, completionTokens, agentes }
    return completionResponse
  }
}


export async function getContext(clientId: string, phone: string, userInput: string) {

  const functioins= await getFunctionsOfClient(clientId)
  const functionsNames= functioins.map((f) => f.name)

  const timezone = "America/Montevideo";
  const now = new Date();
  const zonedDate = toZonedTime(now, timezone);
  const hoy = format(zonedDate, "EEEE, dd/MM/yyyy HH:mm:ss", {
    locale: es,
  });

  let contextString= "\n"
  contextString+= "<Contexto técnico>\n"
  contextString+= "Hablas correctamente el español, incluyendo el uso adecuado de tildes y eñes.\nPor favor, utiliza solo caracteres compatibles con UTF-8\n"
  contextString+= `Hoy es ${hoy} en Montevideo\n`


  const conversation= await getActiveConversation(phone, clientId)
  let contact= conversation?.contact
  let clientHaveCRM= false
  if (conversation) {
    clientHaveCRM= conversation.client.haveCRM
    contextString+= "conversationId para invocar funciones: " + conversation.id + "\n"
  } else {
    console.log("No hay conversación activa");
    contact= await getContactByPhone(phone, clientId)
    clientHaveCRM= await getClientHaveCRM(clientId)
  }
  contextString+= "</Contexto técnico>\n"



  if (contact && clientHaveCRM) {
    contextString+= "\n"
    contextString+= "En la siguiente sección se encuentra información del Contacto asociado al usuario de esta conversación.\n"
    contextString+= "<Información del Contacto>\n"
    contextString+= `contactId: ${contact.id}\n`
    contextString+= `Nombre: ${contact.name}\n`
    contextString+= `Teléfono: ${contact.phone}\n`
    //contextString+= `Etiquetas: ${contact.tags}\n`
    //contextString+= `Estado CRM: ${contact.stage?.name}\n`

    const customFields= await getClientCustomFields(clientId)
    const customFieldsValues= await getFieldValuesByContactId(contact.id)
    const customFieldsToShow= customFields.filter(field => field.showInContext)
    customFieldsToShow.map((field) => {
      const value= customFieldsValues.find(fieldValue => fieldValue.customFieldId === field.id)?.value
      if (value) {
        contextString+= `${field.name}: ${value}\n`
      }
    })
    contextString+= "</Información del Contacto>\n"
  } else {
    console.log("no hay contacto o cliente tiene CRM")    
  }


  if (functionsNames.includes("getDocument")) {
    const documents= await getDocumentsDAOByClient(clientId)
    contextString+= "En la siguiente sección se encuentran documentos que pueden ser relevantes para elaborar una respuesta.\n"
    contextString+= "Los documentos se deben obtener con la función getDocument.\n"
    contextString+= "Si te preguntan algo que puede estar en alguno de los documentos debes obtener la información para elaborar la respuesta.\n"
    contextString+= "<Documentos>\n"
    documents.map((doc) => {
      contextString += `{
  docId: "${doc.id}",
  docName: "${doc.name}",
  docDescription: "${doc.description}"
},
`
    })
    contextString+= "</Documentos>\n"

  }

  // info de eventos y disponibilidad si tiene la función obtenerDisponibilidad

  if (functionsNames.includes("obtenerDisponibilidad")) {
    const askInSequenceText= `Para este evento, los campos de la metadata se deben preguntar en secuencia. Esperar la respuesta de cada campo antes de preguntar el siguiente campo.\n`
    const repetitiveEvents= await getActiveEventsDAOByClientId(clientId, EventType.SINGLE_SLOT)
    const availableRepetitiveEvents= repetitiveEvents.filter(event => event.availability.length > 0)
    console.log("availableRepetitiveEvents: ", availableRepetitiveEvents.map((event) => event.name))

    contextString+= "<Eventos>\n"

    if (availableRepetitiveEvents.length > 0) {

      contextString+= "En la siguiente sección se encuentran eventos repetitivos disponibles para reservar.\n" 
      contextString+= "Estos tienen disponibilidad para reservar en diferentes slots de tiempo.\n" 
      contextString+= "Se debe utilizar la función obtenerDisponibilidad para obtener la disponibilidad de un evento en una determinada fecha.\n"
      contextString+= "<Eventos Repetitivos>\n"
      availableRepetitiveEvents.map((event) => {
      contextString += `{
      eventId: "${event.id}",
      eventName: "${event.name}",
      eventDescription: "${event.description}",
      eventAddress: "${event.address}",
      timezone: "${event.timezone}",
      duration: ${event.minDuration},
      metadata: ${event.metadata}\n`

      // eventSeatsPerTimeSlot: ${event.seatsPerTimeSlot}

      if (event.askInSequence) {
        contextString+= askInSequenceText
      }

      const hoy = format(toZonedTime(new Date(), event.timezone), "EEEE, PPP HH:mm:ss", {
        locale: es,
      })
      contextString+= `Ahora es ${hoy} en el timezone del evento (${event.timezone})\n`
      contextString+= `}\n`  
      })
      contextString+= "</Eventos Repetitivos>\n"
    } else {
      contextString+= "No hay eventos repetitivos disponibles para reservar.\n"
    }

    const allFixedDateEvents= await getActiveEventsDAOByClientId(clientId, EventType.FIXED_DATE)
    const fixedDateEvents= allFixedDateEvents.filter(event => event.startDateTime && event.endDateTime)

    if (fixedDateEvents.length > 0) {
      contextString+= "En la siguiente sección se encuentran eventos de tipo única vez (fecha fija) que pueden ser relevantes para elaborar una respuesta.\n"
      contextString+= "Estos eventos tienen la disponibilidad (cupos) entre los datos del evento. No se debe utilizar la función obtenerDisponibilidad ya que la fecha del evento es fija.\n"
      contextString+= "<Eventos de tipo Única vez>\n"
      fixedDateEvents.map((event) => {
      contextString += `{
eventId: "${event.id}",
eventName: "${event.name}",
eventDescription: "${event.description}",
eventAddress: "${event.address}",
timezone: "${event.timezone}",
seatsAvailable: ${event.seatsAvailable},
seatsTotal: ${event.seatsPerTimeSlot},
startDateTime: "${format(toZonedTime(event.startDateTime!, event.timezone), "dd/MM/yyyy HH:mm")}",
endDateTime: "${format(toZonedTime(event.endDateTime!, event.timezone), "dd/MM/yyyy HH:mm")}",
metadata: ${event.metadata}\n`

      if (event.askInSequence) {
        contextString+= askInSequenceText
      }
      const hoy = format(toZonedTime(new Date(), event.timezone), "EEEE, dd/MM/yyyy HH:mm:ss", {
        locale: es,
      })
  
      contextString+= `Ahora es ${hoy} en el timezone del evento (${event.timezone})\n`
      contextString+= `}\n`  
      })        
      contextString+= "</Eventos de tipo Única vez>\n"
    } else {
      contextString+= "No hay eventos de tipo Única vez disponibles para reservar.\n"
    }
    
    contextString+= "</Eventos>\n"

    // info de las reservas
    contextString+= "En la siguiente sección se encuentran las reservas activas del contacto.\n"
    contextString+= "<Reservas>\n"
    const bookings= await getFutureBookingsDAOByPhone(phone, clientId)
    if (bookings.length > 0) {
      bookings.map((booking) => {
        contextString+= `{
          event: "${booking.eventName}",
          bookingId: "${booking.id}",
          bookingName: "${booking.name}",
          bookingSeats: ${booking.seats},
          bookingStatus: "${booking.status}",
          bookingDate: "${format(booking.start, "dd/MM/yyyy HH:mm")}"
        }\n`
      })
    } else {
      contextString+= "Este contacto no tiene reservas activas.\n"
    }

    contextString+= "</Reservas>\n"

  }

  const res= {
    contextString,
    sectionsIds: []
  }

  return res
}