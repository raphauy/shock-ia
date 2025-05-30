import { ContactEventType, EventType, ReminderType } from "@/lib/generated/prisma";
import { checkDateTimeFormatForSlot, decodeAndCorrectText } from "@/lib/utils";
import { JsonValue } from "@prisma/client/runtime/library";
import { addMinutes, format, parse } from "date-fns";
import { fromZonedTime, toZonedTime } from "date-fns-tz";
import moment from 'moment-timezone';
import { BookingFormValues, cancelBooking, createBooking, getBookingDAO, getFutureBookingsDAOByContact, getFutureBookingsDAOByEventId } from "./booking-services";
import { CarServiceFormValues, createCarService } from "./carservice-services";
import { sendTextToConversation } from "./chatwoot";
import { createExternalPayment } from "./cobros-wap";
import { getNextComercialIdToAssign } from "./comercial-services";
import { getValue, setValue } from "./config-services";
import { createContactEvent } from "./contact-event-services";
import { addTagsToContact, assignContactToComercial, getContactDAO, getTagsOfContact, setNewStage } from "./contact-services";
import { getConversation, messageArrived } from "./conversationService";
import { getDocumentDAO } from "./document-services";
import { EventDAO, getEventDAO } from "./event-services";
import { getOrderData } from "./fenicio-services";
import { getDataTags, getEventDataTags, getFieldsDAOByEventId, getFieldsDAOByRepositoryId } from "./field-services";
import { createOrUpdateFieldValue } from "./fieldvalue-services";
import { functionHaveRepository, getFunctionClientDAO, getTagsOfClientFunction } from "./function-services";
import { NarvaezFormValues, createOrUpdateNarvaez } from "./narvaez-services";
import { RepoDataWithClientNameAndBooking, sendEventNotifications, sendFCNotifications, sendWebhookNotification } from "./notifications-service";
import { searchProductsWithEmbeddings } from "./product-services";
import { getReminderDefinitionsDAOByEventId } from "./reminder-definition-services";
import { ReminderFormValues, createReminder } from "./reminder-services";
import { createRepoData, repoDataFormValues } from "./repodata-services";
import { getRepositoryDAOByFunctionName } from "./repository-services";
import { getSectionOfDocument } from "./section-services";
import { checkBookingAvailability, getSlots } from "./slots-service";
import { getStageByName, getStagesDAO } from "./stage-services";
import { SummitFormValues, createSummit } from "./summit-services";

export type CompletionInitResponse = {
  assistantResponse: string | null
  promptTokens: number
  completionTokens: number
  agentes: boolean  
}


export async function notifyHuman(clientId: string){
  console.log("notifyHuman")
  return "dile al usuario que un agente se va a comunicar con él, saluda y finaliza la conversación. No ofrezcas más ayuda, saluda y listo."
}

export type SectionResult = {
  docId: string;
  docName: string;
  secuence: string;
  content: string | null;
};

export async function getSection(docId: string, secuence: string): Promise<SectionResult | string> {
  const section= await getSectionOfDocument(docId, parseInt(secuence))
  if (!section) return "Section not found"
  console.log(`\tgetSection: doc: ${section.document.name}, secuence: ${secuence}`)

  return {
    docId: section.documentId,
    docName: section.document.name,
    secuence: secuence,
    content: section.text ?? null,
  }
}

export type DocumentResult = {
  docId: string;
  docName: string;
  docURL: string | null;
  description: string | null;
  content: string | null;
};

export async function getDocument(id: string): Promise<DocumentResult | string> {
  const document= await getDocumentDAO(id)
  if (!document) return "Document not found"
  console.log(`\tgetDocument: doc: ${document.name}`)

  return {
    docId: document.id,
    docName: document.name,
    docURL: document.url ?? null,
    description: document.description ?? null,
    content: document.textContent ?? null,
  }
}

export async function getDateOfNow(){
  // return the current date and time in Montevideo time zone
  const res= new Date().toLocaleString("es-UY", {timeZone: "America/Montevideo"})
  console.log("getDateOfNow: " + res)
  return res
}

export async function registrarPedido(clientId: string, 
  conversationId: string, 
  clasificacion: string, 
  consulta: string, 
  nombre: string, 
  email: string | undefined, 
  horarioContacto: string | undefined, 
  idTrackeo: string | undefined, 
  urlPropiedad: string | undefined, 
  consultaAdicional: string | undefined, 
  resumenConversacion: string
  )
{

  console.log("registrarPedido")
  console.log(`\tclasificacion: ${clasificacion}`)
  console.log(`\tconsulta: ${consulta}`)
  console.log(`\tnombre: ${nombre}`)
  console.log(`\temail: ${email}`)
  console.log(`\thorarioContacto: ${horarioContacto}`)
  console.log(`\tidTrackeo: ${idTrackeo}`)
  console.log(`\turlPropiedad: ${urlPropiedad}`)
  console.log(`\tconsultaAdicional: ${consultaAdicional}`)
  console.log(`\tresumenConversacion: ${resumenConversacion}`)  

  const data: NarvaezFormValues = {
    conversationId,
    clasificacion,
    consulta,
    nombre,
    email,
    horarioContacto,
    idTrackeo,
    urlPropiedad,
    consultaAdicional,
    resumenPedido: resumenConversacion,
  }

  let created= null

  try {
    created= await createOrUpdateNarvaez(data)    
  } catch (error) {
    return "Error al registrar el pedido, pregunta al usuario si quiere que tu reintentes"
  }
  if (!created) return "Error al registrar el pedido, pregunta al usuario si quiere que tu reintentes"

  const conversation= await getConversation(conversationId)
  if (!conversation) return "Error al obtener la conversación"

  const text= `Función registrarPedido invocada.`
  const messageStored= await messageArrived(conversation?.phone, text, clientId, "function", "", 0, 0)
  if (messageStored) console.log("function message stored")

  const slug= conversation.client.slug
  const key= `${slug.toUpperCase()}_Registro_Respuesta`
  let Registro_Respuesta= await getValue(key)
  if (!Registro_Respuesta) {
    console.log(`${key} not found`)    
    Registro_Respuesta= "Pedido registrado, dile esto al usuario hablándole por su nombre lo siguiente: 'con la información que me pasaste un asesor te contactará a la brevedad'"
    await setValue(key, Registro_Respuesta)
  }
  console.log("Registro_Respuesta: ", Registro_Respuesta)      

  return Registro_Respuesta
}

// nombreReserva: string | undefined
// nombreCumpleanero: string | undefined
// fechaReserva: Date | undefined
// email: string | undefined
// resumenConversacion: string | undefined

export async function reservarSummit(clientId: string, conversationId: string, nombreReserva: string | undefined, nombreCumpleanero: string | undefined, cantidadInvitados: number | undefined, fechaReserva: string | undefined, email: string | undefined, resumenConversacion: string | undefined){
  console.log("reservarSummit")
  console.log(`\tconversationId: ${conversationId}`)
  console.log(`\tnombreReserva: ${nombreReserva}`)
  console.log(`\tnombreCumpleanero: ${nombreCumpleanero}`)
  console.log(`\tcantidadInvitados: ${cantidadInvitados}`)
  console.log(`\tfechaReserva: ${fechaReserva}`)
  console.log(`\temail: ${email}`)
  console.log(`\tresumenConversacion: ${resumenConversacion}`)

  const data: SummitFormValues = {
    conversationId,
    nombreReserva,
    nombreCumpleanero,
    cantidadInvitados,
    fechaReserva,
    email,
    resumenConversacion,
  }

  let created= null

  try {
    created= await createSummit(data)    
  } catch (error) {
    return "Error al reservar, pregunta al usuario si quiere que tu reintentes"
  }

  if (!created) return "Error al reservar, pregunta al usuario si quiere que tu reintentes"

  let SUMMIT_Respuesta= await getValue("SUMMIT_Respuesta")
  if (!SUMMIT_Respuesta) {
    console.log("SUMMIT_Respuesta not found")    
    SUMMIT_Respuesta= "Reserva realizada, dile esto al usuario lo siguiente: 'con la información que me pasaste un asesor te contactará a la brevedad'"
  }
  console.log("SUMMIT_Respuesta: ", SUMMIT_Respuesta)      

  const SUMMIT_Conversation_Ids= await getValue("SUMMIT_Conversation_Ids")
  const SUMMIT_Chatwoot_Account_Id= await getValue("SUMMIT_Chatwoot_Account_Id")
  if (!SUMMIT_Chatwoot_Account_Id) {
    console.log("SUMMIT_Chatwoot_Account_Id not found")    
  }
  if (!SUMMIT_Conversation_Ids) {
    console.log("SUMMIT_Conversation_Ids not found")    
  } 
  
  if (SUMMIT_Conversation_Ids && SUMMIT_Chatwoot_Account_Id) {
    console.log("SUMMIT_Conversation_Ids: ", SUMMIT_Conversation_Ids)      
    const ids= SUMMIT_Conversation_Ids.split(",")
    for (const id of ids) {
      if (resumenConversacion) {
        const textoMensaje= getTextoMensajeSummit(data)
        console.log("textoMensaje:")
        console.log(textoMensaje)
        
        //await sendWapMessage(phone, textoMensaje, false, clientId)
        console.log("Sending text vía CHATWOOT")
        const chatwootAccountId= parseInt(SUMMIT_Chatwoot_Account_Id)
        const chatwootConversationId= parseInt(id)
        console.log("sending text to conversation id: ", chatwootConversationId, "with account id: ", chatwootAccountId)
        
        await sendTextToConversation(chatwootAccountId, chatwootConversationId, textoMensaje)
    
      } else console.log("resumenConversacion not found")
    }
  }

  if (SUMMIT_Chatwoot_Account_Id) {
    const conversation= await getConversation(conversationId)
    if (!conversation)
      console.log(`No se encontró la conversación con id ${conversationId}`)
    const contactId= conversation?.contactId
    if (contactId) {
      const moveToStageId= "cm5mqav930001cte8dk8prdq7"
      console.log("setting new stage to contact, by: FC-ReservarSummit")
      await setNewStage(contactId, moveToStageId, "FC-ReservarSummit")
    }

  }


  return SUMMIT_Respuesta
}

function getTextoMensajeSummit(data: SummitFormValues): string {
  const textoMensaje= `Nombre: ${data.nombreReserva}
Cumpleañero: ${data.nombreCumpleanero}
Cantidad de invitados: ${data.cantidadInvitados}
Fecha de la reserva: ${data.fechaReserva}
Email: ${data.email}
Resumen: ${data.resumenConversacion}
`
  return textoMensaje
}

export async function echoRegister(clientId: string, conversationId: string, text: string | undefined){
  console.log("echoRegister")
  console.log(`\tconversationId: ${conversationId}`)
  console.log(`\ttexto: ${text}`)

  if (text) {
    const data: SummitFormValues = {
      conversationId,
      resumenConversacion: text,
    }
    let created= null

    try {
      created= await createSummit(data)    
      return "Echo registrado. Dile al usuario que su texto ya está registrado en el sistema"
    } catch (error) {
      return "Error al registrar, pregunta al usuario si quiere que tu reintentes"
    }
  
  } else console.log("text not found")

  return "Mensaje enviado"

}

export async function completarFrase(clientId: string, conversationId: string, texto: string | undefined){
  console.log("completarFrase")
  console.log(`\tconversationId: ${conversationId}`)
  console.log(`\ttexto: ${texto}`)

  if (texto) {
    const data: SummitFormValues = {
      conversationId,
      resumenConversacion: texto,
    }
    let created= null

    try {
      created= await createSummit(data)    
      return "Frase completada"
    } catch (error) {
      return "Error al completar la frase, pregunta al usuario si quiere que tu reintentes"
    }
  
  } else console.log("texto not found")

  return "Mensaje enviado"

}

export async function reservarServicio(clientId: string, conversationId: string, nombreReserva: string | undefined, telefonoContacto: string | undefined, fechaReserva: string | undefined, localReserva: string | undefined, marcaAuto: string | undefined, modeloAuto: string | undefined, matriculaAuto: string | undefined, kilometraje: string | undefined){
  console.log("reservarServicio")
  console.log(`\tconversationId: ${conversationId}`)
  console.log(`\tnombreReserva: ${nombreReserva}`)
  console.log(`\ttelefonoContacto: ${telefonoContacto}`)
  console.log(`\tfechaReserva: ${fechaReserva}`)
  console.log(`\tlocalReserva: ${localReserva}`)
  console.log(`\tmarcaAuto: ${marcaAuto}`)
  console.log(`\tmodeloAuto: ${modeloAuto}`)
  console.log(`\tmatriculaAuto: ${matriculaAuto}`)
  console.log(`\tkilometraje: ${kilometraje}`)

  if (!nombreReserva) return "nombreReserva not found"
  if (!telefonoContacto) return "telefonoContacto not found"
  if (!fechaReserva) return "fechaReserva not found"
  if (!localReserva) return "localReserva not found"
  if (!marcaAuto) return "marcaAuto not found"
  if (!modeloAuto) return "modeloAuto not found"
  if (!matriculaAuto) return "matriculaAuto not found"
  if (!kilometraje) return "kilometraje not found"

  const data: CarServiceFormValues = {
    conversationId,
    nombreReserva,
    telefonoContacto,
    fechaReserva,
    localReserva,
    marcaAuto,
    modeloAuto,
    matriculaAuto,
    kilometraje,
  }

  const created= await createCarService(data)
  if (!created) return "Error al reservar, pregunta al usuario si quiere que tu reintentes"

  return "Reserva registrada. Dile exactamente esto al usuario: Gracias por agendar tu service, a la brevedad un asesor te confirmará la fecha del service."
}

type SlotsResult = {
  eventId: string
  start: string
  end: string
  available: boolean
  seatsTotal?: number
  seatsAvailable?: number
}

export async function obtenerDisponibilidad(clientId: string, eventId: string, date: string){
  console.log("obtenerDisponibilidad")
  console.log(`\teventId: ${eventId}`)
  console.log(`\tdate: ${date}`)

  if (!eventId) return "eventId es obligatorio"
  if (!date) return "date es obligatorio"

  const event= await getEventDAO(eventId)
  if (!event) return "Evento no encontrado"

  if (event.type === EventType.FIXED_DATE) {
    return "Este evento no tiene disponibilidad, su fecha fija es: " + format(event.startDateTime!, 'dd/MM/yyyy HH:mm')
  }

  const dateStr= format(date, "yyyy-MM-dd")

  const bookings= await getFutureBookingsDAOByEventId(eventId, event.timezone)
//  console.log("bookings: ", bookings)

  // Usar el valor de seatsPerTimeSlot del evento, o 1 si no está definido
  const seatsPerTimeSlot = event.seatsPerTimeSlot || 1;
  
  const slots= getSlots(dateStr, bookings, event.availability, event.minDuration!, event.timezone, seatsPerTimeSlot)
//  console.log("slots: ", slots)

  const result: SlotsResult[]= slots.map((slot) => ({
    eventId,
    start: format(toZonedTime(slot.start, event.timezone), "yyyy-MM-dd HH:mm"),
    end: format(toZonedTime(slot.end, event.timezone), "yyyy-MM-dd HH:mm"),
    available: slot.available,
    seatsTotal: slot.seatsTotal,
    seatsAvailable: slot.seatsAvailable
  }))
  console.log("result: ", result)

  return JSON.stringify(result)
}

export async function reservarParaEvento(clientId: string, conversationId: string, eventId: string, start: string, duration: string, metadata: string, seats: string = "1"){
  console.log("reservarParaEvento")
  console.log(`\tconversationId: ${conversationId}`)
  console.log(`\teventId: ${eventId}`)
  console.log(`\tstart: ${start}`)
  console.log(`\tduration: ${duration}`)
  console.log(`\tmetadata: ${metadata}`)
  console.log(`\tseats: ${seats}`)

  if (!conversationId) return "conversationId es obligatorio"
  if (!eventId) return "eventId es obligatorio"
  if (!start) return "start es obligatorio"
  if (!duration) return "duration es obligatorio"
  if (!metadata) return "metadata es obligatorio"

  // Validar que el número de asientos sea un número válido
  const seatsNumber = parseInt(seats);
  if (isNaN(seatsNumber) || seatsNumber <= 0) {
    return "El número de asientos debe ser un número positivo";
  }

  let name= "No proporcionado"
  let metadataObj

  try {
    metadataObj= JSON.parse(metadata)
  } catch (error) {
    return "Error al parsear la metadata"
  }
  console.log("metadataObj: ", metadataObj)
  name= metadataObj.nombre
  console.log("name: ", name)
  if (!name) {
    return "No se proporcionó el nombre del usuario en la metadata"
  }

  const startFormatIsCorrect= checkDateTimeFormatForSlot(start)
  if (!startFormatIsCorrect) {
    return "Formato de fecha incorrecto, debe ser YYYY-MM-DD HH:mm"
  }

  const dateTimeFormat= "yyyy-MM-dd HH:mm"
  let startDate= parse(start, dateTimeFormat, new Date())
  const durationInt= parseInt(duration)
  let endDate= addMinutes(startDate, durationInt)

  const event= await getEventDAO(eventId)
  if (!event) return "Evento no encontrado"

  if (event.type === "SINGLE_SLOT" && event.minDuration !== durationInt)
    return `El evento es de duración fija y debe ser de ${event.minDuration} minutos`

  const offsetInMinutes = moment.tz(startDate, event.timezone).utcOffset()
  startDate= addMinutes(startDate, -offsetInMinutes)
  endDate= addMinutes(endDate, -offsetInMinutes)

  // Verificar disponibilidad considerando el número de asientos solicitados
  const isAvailable= await checkBookingAvailability(startDate, endDate, event, seatsNumber)
  console.log("isAvailable: ", isAvailable)
  if (!isAvailable) 
    return `El slot ${format(startDate, dateTimeFormat)} - ${format(endDate, dateTimeFormat)} no tiene suficientes asientos disponibles (solicitados: ${seatsNumber})`

  const conversation= await getConversation(conversationId)
  if (!conversation) return "No se encontró la conversación, revisar el conversationId"

  let contact= conversation.phone
  if (!contact) contact= "Ocurrió un error al obtener la conversación"

  const data: BookingFormValues = {
    eventId,
    start: startDate,
    end: endDate,
    contact,
    seats: seats,
    name,
    data: metadata,
    clientId,
    conversationId,
  }

  const created= await createBooking(data)
  if (!created) return "Error al reservar, pregunta al usuario si quiere que tu reintentes"

  processTagsAndStage(event, conversation, metadataObj)

  const repoDataWithClientNameAndBooking: RepoDataWithClientNameAndBooking= {
    id: created.id,
    repoName: event.name,
    phone: conversation.phone,
    functionName: event.name,
    data: metadata,
    repositoryId: event.id,
    clientId,
    conversationId,
    createdAt: created.createdAt,
    updatedAt: created.updatedAt,
    client: {
      name: conversation.client.name,
      slug: conversation.client.slug,
    },
    booking: created,
  }

  if (event.webHookUrl) {
    try {
      await sendWebhookNotification(event.webHookUrl, repoDataWithClientNameAndBooking)
    } catch (error) {
      console.log("Error al enviar notificación a webhook")
    }
  }
  const notifyPhones= event.notifyPhones
  if (notifyPhones) {
    try {
      await sendEventNotifications(notifyPhones, repoDataWithClientNameAndBooking)
    } catch (error) {
      console.log("Error al enviar notificación a whatsapp")
    }
  }

  const contactId= conversation.contactId
  if (contactId) {
    const fields= await getFieldsDAOByEventId(eventId)
    for (const field of fields) {
      let value;
      if (field.type === "list") {
        // Verificar si es un array antes de usar join
        if (Array.isArray(metadataObj[field.name])) {
          value = metadataObj[field.name].join(", ");
        } else if (typeof metadataObj[field.name] === 'string') {
          // Si es string, usar como está
          value = metadataObj[field.name];
        } else {
          // Si no es array ni string, convertir a string si existe
          value = metadataObj[field.name] ? String(metadataObj[field.name]) : undefined;
        }
      } else {
        value = metadataObj[field.name];
      }
      
      const linkedCustomFieldId= field.linkedCustomFieldId
      if (value && linkedCustomFieldId) {
        await createOrUpdateFieldValue({
          contactId,
          customFieldId: linkedCustomFieldId,
          value: String(value)
        })
        await createContactEvent(ContactEventType.CUSTOM_FIELD_VALUE_UPDATED, field.name + ": " + value, "EV-" + event.name, contactId)
      }
    }

    const eventTimezone= event.timezone
    // create reminders, one reminder for each reminderDefinition of the event
    const reminderDefinitions= await getReminderDefinitionsDAOByEventId(eventId)
    for (const reminderDefinition of reminderDefinitions) {
      const eventTime= fromZonedTime(created.start, eventTimezone)
      const reminderValues: ReminderFormValues= {
        reminderDefinitionId: reminderDefinition.id,
        contactId,
        eventTime,
        bookingId: created.id,
        eventName: event.name,
        type: ReminderType.BOOKING
      }
      try {
        await createReminder(reminderValues)
      } catch (error) {
        console.log("Error al crear el recordatorio", error)
      }
    }
  }

  return "Reserva registrada."
}

async function processTagsAndStage(event: EventDAO, conversation: any, metadataObj: JsonValue) {
  const eventTags= event.tags
  const chatwootAccountId = conversation.client.whatsappInstances[0]?.chatwootAccountId 
    ? parseInt(conversation.client.whatsappInstances[0].chatwootAccountId) 
    : undefined;
  const chatwootConversationId = conversation.chatwootConversationId;

  const contactId= conversation.contactId

  if (eventTags && chatwootAccountId && contactId) {
    const contactTags= await getTagsOfContact(contactId)
    const eventDataTags= await getEventDataTags(event.id, metadataObj)
    const allTags= [...contactTags, ...eventTags, ...eventDataTags]
    console.log("adding tags to contact, tags: ", allTags)
    await addTagsToContact(contactId, allTags, "EV-" + event.name)  
  } else {
    console.log("no event tags to add to contact")
  }

  const moveToStageId= event.moveToStageId
  if (moveToStageId && chatwootAccountId && contactId) {
    console.log("setting new stage to contact, by: EV-" + event.name)
    await setNewStage(contactId, moveToStageId, "EV-" + event.name)
  }

}

export async function reservarParaEventoDeUnicaVez(clientId: string, conversationId: string, eventId: string, metadata: string){
  console.log("reservarParaEventoDeUnicaVez")
  console.log(`\tconversationId: ${conversationId}`)
  console.log(`\teventId: ${eventId}`)
  console.log(`\tmetadata: ${metadata}`)

  if (!conversationId) return "conversationId es obligatorio"
  if (!eventId) return "eventId es obligatorio"
  if (!metadata) return "metadata es obligatorio"

  let name= "No proporcionado"
  let metadataObj

  try {
    metadataObj= JSON.parse(metadata)
  } catch (error) {
    return "Error al parsear la metadata"
  }
  console.log("metadataObj: ", metadataObj)
  name= metadataObj.nombre
  console.log("name: ", name)
  if (!name) {
    return "No se proporcionó el nombre del usuario en la metadata"
  }

  const event= await getEventDAO(eventId)
  if (!event) return "Evento no encontrado"

  if (event.type !== EventType.FIXED_DATE)
    return "Este evento no es de unica vez"

  const setsLeft= event.seatsAvailable
  if (setsLeft === undefined || setsLeft <= 0)
    return "No hay cupos disponibles para este evento"

  const conversation= await getConversation(conversationId)
  if (!conversation) return "No se encontró la conversación, revisar el conversationId"

  let contact= conversation.phone
  if (!contact) contact= "Ocurrió un error al obtener la conversación"

  const data: BookingFormValues = {
    eventId,
    start: event.startDateTime!,
    end: event.endDateTime!,
    contact,
    seats: "1",
    name,
    data: metadata,
    clientId,
    conversationId,
  }

  const created= await createBooking(data)
  if (!created) return "Error al reservar, pregunta al usuario si quiere que tu reintentes"

  const tags= event.tags
  const chatwootAccountId = conversation.client.whatsappInstances[0]?.chatwootAccountId 
    ? parseInt(conversation.client.whatsappInstances[0].chatwootAccountId) 
    : undefined;
  const chatwootConversationId= conversation.chatwootConversationId

  processTagsAndStage(event, conversation, metadataObj)

  const repoDataWithClientNameAndBooking: RepoDataWithClientNameAndBooking= {
    id: created.id,
    repoName: event.name,
    phone: conversation.phone,
    functionName: event.name,
    data: metadata,
    repositoryId: event.id,
    clientId,
    conversationId,
    createdAt: created.createdAt,
    updatedAt: created.updatedAt,
    client: {
      name: conversation.client.name,
      slug: conversation.client.slug,
    },
    booking: created,
  }

  if (event.webHookUrl) {
    try {
      await sendWebhookNotification(event.webHookUrl, repoDataWithClientNameAndBooking)
    } catch (error) {
      console.log("Error al enviar notificación a webhook")
    }
  }

  const notifyPhones= event.notifyPhones
  if (notifyPhones) {
    try {
      await sendEventNotifications(notifyPhones, repoDataWithClientNameAndBooking)
    } catch (error) {
      console.log("Error al enviar notificación a whatsapp")
    }
  }

  const contactId= conversation.contactId
  if (contactId) {
    const fields= await getFieldsDAOByEventId(eventId)
    for (const field of fields) {
      let value;
      if (field.type === "list") {
        // Verificar si es un array antes de usar join
        if (Array.isArray(metadataObj[field.name])) {
          value = metadataObj[field.name].join(", ");
        } else if (typeof metadataObj[field.name] === 'string') {
          // Si es string, usar como está
          value = metadataObj[field.name];
        } else {
          // Si no es array ni string, convertir a string si existe
          value = metadataObj[field.name] ? String(metadataObj[field.name]) : undefined;
        }
      } else {
        value = metadataObj[field.name];
      }
      
      const linkedCustomFieldId= field.linkedCustomFieldId
      if (value && linkedCustomFieldId) {
        await createOrUpdateFieldValue({
          contactId,
          customFieldId: linkedCustomFieldId,
          value: String(value)
        })
        await createContactEvent(ContactEventType.CUSTOM_FIELD_VALUE_UPDATED, field.name + ": " + value, "EV-" + event.name, contactId)
      }
    }

    const eventTimezone= event.timezone
    // create reminders, one reminder for each reminderDefinition of the event
    const reminderDefinitions= await getReminderDefinitionsDAOByEventId(eventId)
    for (const reminderDefinition of reminderDefinitions) {
      const eventTime= fromZonedTime(created.start, eventTimezone)
      const reminderValues: ReminderFormValues= {
        reminderDefinitionId: reminderDefinition.id,
        contactId,
        eventTime,
        bookingId: created.id,
        eventName: event.name,
        type: ReminderType.BOOKING
      }
      try {
        await createReminder(reminderValues)
      } catch (error) {
        console.log("Error al crear el recordatorio", error)
      }
    }

  }


  return "Reserva registrada."
}

type ObtenerReservasResult = {
  bookingId: string
  start: string
  end: string
  name: string
  contact: string
  status: string
  eventName: string
}

export async function obtenerReservas(clientId: string, conversationId: string){
  console.log("obtenerReservas")
  console.log(`\tconversationId: ${conversationId}`)

  const conversation= await getConversation(conversationId)
  if (!conversation) return `No se encontró una conversación con id ${conversationId}`

  const phone= conversation.phone

  const bookings= await getFutureBookingsDAOByContact(phone, clientId)

  const result: ObtenerReservasResult[]= bookings.map((booking) => ({
    bookingId: booking.id,
    start: format(booking.start, "yyyy-MM-dd HH:mm"),
    end: format(booking.end, "yyyy-MM-dd HH:mm"),
    name: booking.name,
    contact: booking.contact,
    status: booking.status,
    eventName: booking.eventName,
  }))

  console.log("result: ", result)  

  return JSON.stringify(result)
}

export async function cancelarReserva(clientId: string, conversationId: string, bookingId: string){
  console.log("cancelarReserva")
  console.log(`\tconversationId: ${conversationId}`)
  console.log(`\tbookingId: ${bookingId}`)

  const conversation= await getConversation(conversationId)
  if (!conversation) return `No se encontró una conversación con id ${conversationId}`

  const phone= conversation.phone

  const booking= await getBookingDAO(bookingId)
  if (!booking) return `No se encontró una reserva con id ${bookingId}`

  // check contact and phone match
  if (booking.contact !== phone) return "La reserva no pertenece a esta conversación"

  const canceled= await cancelBooking(bookingId)
  if (!canceled) return "Error al cancelar la reserva"

  return `La reserva de ${booking.contact} ha sido cancelada`
}

export async function notificarAsesor(clientId: string, conversationId: string){
  console.log("notificarAsesor")
  console.log(`\tconversationId: ${conversationId}`)

  const dateTime= toZonedTime(new Date(), "America/Montevideo")

  const isWorkHours= isInWorkHours(dateTime)
  console.log("isWorkHours: ", isWorkHours)

  let message= "Debes enviar exactamente este texto al usuario:"

  if (!isWorkHours) {
    message+= "Actualmente estamos fuera del horario laboral de la clínica. Un representante comercial se pondrá en contacto contigo al inicio de la próxima jornada."
  } else {
    message+= "Un representante comercial se pondrá en contacto contigo a la brevedad."
  } 

  return message
}

export async function obtenerLinkDePago(clientId: string, conversationId: string, companyId: string, unitPrice: number, quantity: number, concept: string){
  console.log("obtenerLinkDePago")
  console.log(`\tconversationId: ${conversationId}`)
  console.log(`\tcompanyId: ${companyId}`)
  console.log(`\tunitPrice: ${unitPrice}`)
  console.log(`\tquantity: ${quantity}`)
  console.log(`\tconcept: ${concept}`)

  try {
    const amount= unitPrice * quantity
    const currency= "UYU"
    const link= await createExternalPayment(amount, currency, companyId, concept)
    return link
  } catch (error) {
    return "Error al obtener el link de pago"
  }
}

export async function cambiarEstadoDeContacto(clientId: string, contactId: string, nuevoEstado: string) {
  console.log("cambiarEstadoDeContacto")
  console.log(`\tcontactId: ${contactId}`)
  console.log(`\tnuevoEstado: ${nuevoEstado}`)

  const contact= await getContactDAO(contactId)
  if (!contact) return `No se encontró un contacto con id ${contactId}`
  console.log("contact: ", contact)
  const newStage= await getStageByName(clientId, nuevoEstado)
  if (!newStage) {
    const stages= await getStagesDAO(clientId)
    const stageNames= stages.map(stage => stage.name)
    return `No se encontró un estado con el nombre ${nuevoEstado}. Los estados posibles son: ${stageNames.join(", ")}`
  }
  console.log("newStage: ", newStage)

  const updated= await setNewStage(contactId, newStage.id, "IA-cambiarEstadoDeContacto")
  if (!updated) return "Error al cambiar el estado del contacto"

  return `Estado del contacto cambiado correctamente. Mensaje para el usuario: 'Un agente se pondrá en contacto contigo a la brevedad' y no le preguntes más nada.`
}

export async function buscarProducto(clientId: string, conversationId: string, query: string) {
  console.log("buscarProducto")
  console.log(`\tconversationId: ${conversationId}`)
  console.log(`\tquery: ${query}`)
  
  try {
    const products= await searchProductsWithEmbeddings(clientId, query, 10, 0.65)
    for (const product of products) {
      console.log("product: ", product.title, product.similarity)
    }
    return products
  } catch (error) {
    console.log("Error al buscar productos: ", error)
    return "Hubo un error al buscar productos"
  }
}

export async function buscarOrden(clientId: string, conversationId: string, orderId: string) {
  console.log("buscarOrden")
  console.log(`\tconversationId: ${conversationId}`)
  console.log(`\torderId: ${orderId}`)

  const orderData= await getOrderData(clientId, orderId)
  if (orderData.error) {
    return orderData.msj
  }
  console.log("orderData: ", orderData)
  return orderData
}

export async function defaultFunction(clientId: string, name: string, args: any) {
  console.log("defaultFunction")
  console.log("clientId: ", clientId)
  console.log("name: ", name)
  console.log("args: ", args)

  try {
    const repo= await getRepositoryDAOByFunctionName(name)
    if (!repo)
      return "Hubo un error al procesar esta solicitud"
  
    const { conversationId, ...data } = args

    if (!conversationId)
      return "conversationId es obligatorio"

    const conversation= await getConversation(conversationId)
    if (!conversation)
      return `No se encontró la conversación con id ${conversationId}`
  
    const phone= conversation.phone
  
    const repoData: repoDataFormValues= {
      clientId,
      phone,
      functionName: repo.functionName,
      repoName: repo.name,
      repositoryId: repo.id,
      data,
      conversationId
    }
  
    const created= await createRepoData(repoData)
    if (!created || !created.repositoryId)
      return "Hubo un error al procesar esta solicitud"
  
    const functionClient= await getFunctionClientDAO(repo.functionId, conversation.client.id)
    if (functionClient) {
      if (functionClient.webHookUrl) {
        try {
          await sendWebhookNotification(functionClient.webHookUrl, created)
        } catch (error) {
          console.log("Error al enviar notificación a webhook")
        }
      }
      if (functionClient.notifyPhones) {
        try {
          await sendFCNotifications(functionClient.notifyPhones, created)
        } catch (error) {
          console.log("Error al enviar notificación a whatsapp")
        }
      }
    }
    if (repo.conversationLLMOff) {
      console.log(`simulating setting conversationLLMOff to true for phone ${conversation.phone}`)
      // TODO: set LLMOff
      // await setLLMOff(conversation.id, true)
    }

    const chatwootAccountId= conversation.client.whatsappInstances[0]?.chatwootAccountId 
      ? parseInt(conversation.client.whatsappInstances[0].chatwootAccountId) 
      : undefined;

    const tags= await getTagsOfClientFunction(clientId, repo.functionId)

    const contactId= conversation.contactId
    if (tags && chatwootAccountId && contactId) {
      const repoTags= await getDataTags(repo.id, data as string)
      const allTags= [...tags, ...repoTags]
      console.log("adding tags to contact, tags: ", allTags)
      await addTagsToContact(contactId, allTags, "FC-" + name)    
    } else {
      console.log("no tags to add to contact")
    }

    const moveToStageId= functionClient?.moveToStageId
    if (moveToStageId && chatwootAccountId && contactId) {
      console.log("setting new stage to contact, by: FC-" + name)
      await setNewStage(contactId, moveToStageId, "FC-" + name)
    }

    if (contactId) {
      const fields= await getFieldsDAOByRepositoryId(repo.id)
      for (const field of fields) {
        let value;
        if (field.type === "list") {
          // Verificar si es un array antes de usar join
          if (Array.isArray(data[field.name])) {
            value = data[field.name].join(", ");
          } else if (typeof data[field.name] === 'string') {
            // Si es string, usar como está
            value = data[field.name];
          } else {
            // Si no es array ni string, convertir a string si existe
            value = data[field.name] ? String(data[field.name]) : undefined;
          }
        } else {
          value = data[field.name];
        }
        
        if (value && field.linkedCustomFieldId) {
          await createOrUpdateFieldValue({
            contactId,
            customFieldId: field.linkedCustomFieldId,
            value: String(value)
          })
          await createContactEvent(ContactEventType.CUSTOM_FIELD_VALUE_UPDATED, field.name + ": " + value, "FC-" + name, contactId)
        }
      }
    }

    const assignToComercial= functionClient?.assignToComercial
    if (assignToComercial && contactId) {
      const comercialId= await getNextComercialIdToAssign(clientId)
      if (comercialId) {
        console.log("assigning contact to comercial")
        await assignContactToComercial(contactId, comercialId)
      } else {
        console.log("no comercial to assign")
      }
    }

    return repo.finalMessage    
  } catch (error) {
    console.log(error)
    return "Hubo un error al procesar esta solicitud"        
  }
}

export async function processFunctionCall(clientId: string, name: string, args: any) {
  console.log("function_call: ", name, args)

  let content= null

  switch (name) {
    case "getDateOfNow":
      content = await getDateOfNow()
      break

    case "notifyHuman":
      content = await notifyHuman(clientId)
      break

    case "getDocument":
      content= await getDocument(args.docId)
      break

    case "getSection":
      content= await getSection(args.docId, args.secuence)
      break
    case "registrarPedido":
      content= await registrarPedido(clientId, 
        args.conversationId, 
        args.clasificacion, 
        decodeAndCorrectText(args.consulta),
        decodeAndCorrectText(args.nombre),
        args.email, 
        decodeAndCorrectText(args.horarioContacto),
        args.idTrackeo, 
        args.urlPropiedad, 
        decodeAndCorrectText(args.consultaAdicional),
        decodeAndCorrectText(args.resumenConversacion),
      )
      break
    case "reservarSummit":
      content= await reservarSummit(clientId,
        args.conversationId,
        decodeAndCorrectText(args.nombreReserva),
        decodeAndCorrectText(args.nombreCumpleanero),
        parseInt(args.cantidadInvitados),
        decodeAndCorrectText(args.fechaReserva),
        decodeAndCorrectText(args.email),
        decodeAndCorrectText(args.resumenConversacion),
      )
      break
    case "echoRegister":
      content= echoRegister(clientId, 
        args.conversationId, 
        decodeAndCorrectText(args.text)
      )
      break
    case "completarFrase":
      content= completarFrase(clientId, 
        args.conversationId, 
        decodeAndCorrectText(args.texto)        
      )
      break
    case "reservarServicio":
      content= await reservarServicio(clientId,
        args.conversationId,
        args.nombreReserva,
        args.telefonoContacto,
        args.fechaReserva,
        args.localReserva,
        args.marcaAuto,
        args.modeloAuto,
        args.matriculaAuto,
        args.kilometraje
      )
      break

    case "obtenerDisponibilidad":
      content= await obtenerDisponibilidad(clientId, args.eventId, args.date)
      break

    case "reservarParaEvento":
      content= await reservarParaEvento(clientId, args.conversationId, args.eventId, args.start, args.duration, args.metadata, args.seats)
      break

    case "reservarParaEventoDeUnicaVez":
      content= await reservarParaEventoDeUnicaVez(clientId, args.conversationId, args.eventId, args.metadata)
      break

    case "obtenerReservas":
      content= await obtenerReservas(clientId, args.conversationId)
      break

    case "cancelarReserva":
      content= await cancelarReserva(clientId, args.conversationId, args.bookingId)      
      break

    case "notificarAsesor":
      content= await notificarAsesor(clientId, args.conversationId)
      break

    case "obtenerLinkDePago":
      content= await obtenerLinkDePago(clientId, args.conversationId, args.companyId, args.unitPrice, args.quantity, args.concept)
      break

    case "cambiarEstadoDeContacto":
      content= await cambiarEstadoDeContacto(clientId, args.contactId, args.nuevoEstado)
      break

    case "buscarProducto":
      content= await buscarProducto(clientId, args.conversationId, args.query)
      break

    case "buscarOrden":
      content= await buscarOrden(clientId, args.conversationId, args.orderId)
      break

    default:
      content= await defaultFunction(clientId, name, args)
      break
        
  }

  if (content !== null) {      
    return JSON.stringify(content)
  } else {
    return "function call not found"
  }
}

export async function getAgentes(name: string): Promise<boolean> {
let res= await functionHaveRepository(name)
if (res) return true

switch (name) {
  case "notifyHuman":
    res= true
    break
  case "registrarPedido":
    res= true
    break
  case "reservarSummit":
    res= true
    break
  case "reservarServicio":
    res= true
    break

  case "notificarAsesor":
    res= true
    break
    
  default:
    break
}
return res
}

const horarioLaboral= ["07:00-19:00", "07:00-19:00", "07:00-19:00", "07:00-19:00", "07:00-19:00", "08:00-12:00", ""]

export function isInWorkHours(dateTime: Date) {
  //dateTime= toUtc
  console.log("dateTime: ", format(dateTime, "yyyy-MM-dd HH:mm"))
  

  const dayOfWeek= dateTime.getDay() -1
  const time= dateTime.getTime()
  let timeRange= horarioLaboral[dayOfWeek]

  const [start, end]= timeRange.split("-")
  const [startHour, startMinute]= start.split(":")
  const [endHour, endMinute]= end.split(":")
  const startTime= new Date(dateTime)
  startTime.setHours(parseInt(startHour), parseInt(startMinute))
  const endTime= new Date(dateTime)
  endTime.setHours(parseInt(endHour), parseInt(endMinute))
  console.log("startTime: ", format(startTime, "yyyy-MM-dd HH:mm"))
  console.log("endTime: ", format(endTime, "yyyy-MM-dd HH:mm"))

  return time >= startTime.getTime() && time <= endTime.getTime()
}