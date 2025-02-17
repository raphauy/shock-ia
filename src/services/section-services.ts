import * as z from "zod"
import { prisma } from "@/lib/db"
import { OpenAIEmbeddings } from "langchain/embeddings/openai"
import pgvector from 'pgvector/utils';
import { DocumentDAO, getDocumentsDAOByClient } from "./document-services";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { getClient, getClientHaveCRM, getFunctionsOfClient } from "./clientService";
import { getActiveConversation } from "./conversationService";
import { toZonedTime } from "date-fns-tz";
import { getActiveEventsDAOByClientId } from "./event-services";
import { EventType } from "@prisma/client";
import { getContactByPhone } from "./contact-services";
import { getClientCustomFields, getCustomFieldsDAO } from "./customfield-services";
import { getFieldValuesByContactId } from "./fieldvalue-services";

export type SectionDAO = {
	id: string
	secuence: number
	tokenCount: number
	status: string
	createdAt: Date
	updatedAt: Date
	documentId: string
	text: string
  clientSlug: string
  document?: DocumentDAO
}

export const sectionSchema = z.object({
	secuence: z.number({required_error: "secuence is required."}),
	tokenCount: z.number({required_error: "tokenCount is required."}),
	status: z.string({required_error: "status is required."}),
	documentId: z.string({required_error: "documentId is required."}),
	text: z.string({required_error: "text is required."}),
  embedding: z.unknown().optional(),	
})

export type SectionFormValues = z.infer<typeof sectionSchema>


export async function getSectionsDAO() {
  const found = await prisma.section.findMany({
    orderBy: {
      id: 'asc'
    },
  })
  return found as SectionDAO[]
}

export async function getSectionDAO(id: string) {
  console.log("getSectionDAO");
  
  const found = await prisma.section.findUnique({
    where: {
      id
    },
    include: {
      document: {
        include: {
          client: true
        }
      }
    }
  })
  if (!found) return null

  const sectionsCount= await prisma.section.count({
    where: {
      documentId: found?.documentId
    }
  })

  const res= {
    ...found,
    document: {
      ...found?.document,
      description: found.document.description || "",
      jsonContent: found.document.jsonContent || "",
      textContent: found.document.textContent || "",
      fileSize: found.document.fileSize || 0,
      wordsCount: found.document.wordsCount || 0,
      externalId: found.document.externalId || "",
      url: found.document.url || "",
      sectionsCount,
      clientSlug: found.document.client.slug
    },
    clientSlug: found.document.client.slug
  }

  return res
}
    
export async function createSection(data: SectionFormValues) {
  // TODO: implement createSection
  const created = await prisma.section.create({
    data
  })
  return created
}

export async function updateSection(id: string, data: SectionFormValues) {
  const updated = await prisma.section.update({
    where: {
      id
    },
    data
  })
  return updated
}

export async function deleteSection(id: string) {
  const deleted = await prisma.section.delete({
    where: {
      id
    },
  })
  return deleted
}

const SECTION_CHAR_SIZE = 10000

// function to process the text into sections for embedding
export async function processSections(allText: string, documentId: string) {

  // delete all the sections for the document
  await prisma.section.deleteMany({
    where: {
      documentId
    }
  })

  // each section will have a secuence number starting from 1
  // split the text into sections of aprox SECTION_CHAR_SIZE
  // Consideration of Context: It is important that each section maintains its meaning and context so that the generated embedding is useful. 
  // To achieve this, include a portion of the text from the chunk before and after the current chunk. Overlap the chunks by a 10% of their total size.
  // The last section should include the remaining text.
  // each section must be breaked in an end of line character
  const sections = []
  let secuence = 1
  let start = 0
  let end = SECTION_CHAR_SIZE
  let text = allText.slice(start, end)
  while (text.length > 0) {
    sections.push({
      secuence,
      tokenCount: text.split(" ").length,
      status: "updated",
      documentId,
      text
    })
    secuence++
    start = end - Math.floor(SECTION_CHAR_SIZE * 0.1)
    end = start + SECTION_CHAR_SIZE
    text = allText.slice(start, end)
  }

  // iterate over the sections to save them in the database
  for (const section of sections) {
    const created= await createSection(section)
    await embedAndSave(section.text, created.id)
  }

  return sections
}


async function embedAndSave(text: string, sectionId: string) {
  const embeddings = new OpenAIEmbeddings({
    openAIApiKey: process.env.OPENAI_API_KEY_FOR_EMBEDDINGS,
    verbose: true,
    modelName: "text-embedding-3-large",    
  })
  
  const vector= await embeddings.embedQuery(text)
  const embedding = pgvector.toSql(vector)
  await prisma.$executeRaw`UPDATE "Section" SET embedding = ${embedding}::vector, status = 'embedded' WHERE id = ${sectionId}`
  console.log(`Text embeded: ${text}`)      
}

export type SimilaritySearchResult = {
  id: string
  docId: string
  name: string
  text: string
  secuence: number
  distance: number
}


  export async function similaritySearch(clientId: string, text: string, limit: number = 5): Promise<SimilaritySearchResult[]> {
    console.log(`Searching for similar sections for: ${text} and clientId: ${clientId}`)

    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY_FOR_EMBEDDINGS,
      verbose: true,
      modelName: "text-embedding-3-large",
    });
  
    const vector = await embeddings.embedQuery(text);
    const textEmbedding = pgvector.toSql(vector);
  
    let result: SimilaritySearchResult[] = [];
  
    result = await prisma.$queryRaw`
      SELECT s."id", d."id" as "docId", d."name", s."text", s."secuence", s."embedding" <-> ${textEmbedding}::vector AS distance
      FROM "Section" AS s
      INNER JOIN "Document" AS d ON s."documentId" = d."id"
      WHERE d."clientId" = ${clientId} AND s."embedding" <-> ${textEmbedding}::vector < 1.05
      ORDER BY distance
      LIMIT ${limit}`;


    return result;
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
  }

  const res= {
    contextString,
    sectionsIds: []
  }

  return res
}

export async function setSectionsToMessage(messageId: string, sectionsIds: string[]) {
  const message= await prisma.message.findUnique({
    where: {
      id: messageId
    }
  })
  if (!message) throw new Error("Message not found")

  for (const sectionId of sectionsIds) {
    await prisma.messageSection.create({
      data: {
        messageId,
        sectionId
      }
    })
  }

  return true
}

export async function getSectionsOfMessage(messageId: string) {
  const sections= await prisma.messageSection.findMany({
    where: {
      messageId
    }
  })
  return sections
}

export async function getSectionOfDocument(documentId: string, secuence: number) {
  const section= await prisma.section.findFirst({
    where: {
      documentId,
      secuence
    },
    include: {
      document: true
    }
  })
  return section
}

export async function getSectionCountOfDocument(documentId: string) {
  const count= await prisma.section.count({
    where: {
      documentId
    }
  })
  return count
}