import * as z from "zod"
import { prisma } from "@/lib/db"
import { OpenAIEmbeddings } from "langchain/embeddings/openai"
import pgvector from 'pgvector/utils';
import { DocumentDAO, getDocumentsDAOByClient } from "./document-services";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { getFunctionsOfClient } from "./clientService";
import { getActiveConversation } from "./conversationService";
import { toZonedTime } from "date-fns-tz";
import { getActiveEventsDAOByClientId } from "./event-services";

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

  let contextString= "Hablas correctamente el español, incluyendo el uso adecuado de tildes y eñes.\nPor favor, utiliza solo caracteres compatibles con UTF-8 y adecuados para el idioma español. Ten especial cuidado para no incluir este caracter: �\n"
  let sectionsIds: string[] = []

  const conversation= await getActiveConversation(phone, clientId)
  if (conversation) {
    contextString+= "\nconversationId para invocar funciones: " + conversation.id + "\n"
  }

  if (functionsNames.includes("getDateOfNow")) {
    contextString+= "\n**** Fecha y hora en Montevideo****\n"
    const timezone = "America/Montevideo";
    const now = new Date();
    const zonedDate = toZonedTime(now, timezone);
    const hoy = format(zonedDate, "EEEE, dd/MM/yyyy HH:mm:ss", {
      locale: es,
    });
    contextString+= `Hoy es ${hoy}.\n`
  }

  if (functionsNames.includes("getDocument")) {
    const documents= await getDocumentsDAOByClient(clientId)
    contextString+= "\n**** Documentos ****\n"
    contextString+= "Documentos que pueden ser relevantes para elaborar una respuesta:\n"
    documents.map((doc) => {
      contextString += `{
  docId: "${doc.id}",
  docName: "${doc.name}",
  docDescription: "${doc.description}",
  docURL: "${doc.url}",
  sectionsCount: ${doc.sectionsCount}
},
`
    })

//    const similarity= await similaritySearch(clientId, userInput, 3)
    const similarity: SimilaritySearchResult[] = []

    if (similarity.length > 0) {
      contextString+= "\n**** Sections ****\n"
      contextString+= "Sections que pueden ser relevantes para elaborar una respuesta:\n"
      similarity.map((item) => {
        contextString += `{
    docId: "${item.docId}",
    docTitle: "${item.name}",
    SectionSecuence: ${item.secuence},
    Text: "${item.text}",
    SemanticDistance: ${item.distance}
  },

  `
      })
      contextString+= "Puedes utilizar directamente la información de alguna de estas secciones para elaborar una respuesta.\n"
    }

    contextString+= "Puedes utilizar la función getDocument para obtener toda la información de un documento y la función getSection para obtener la información de una sección.\n"
    contextString+= "Hay documentos con más de una Section. Si obtienes una Section con secuence 1 por ejemplo y no está la información para la respuesta, solicita la siguiente Section, utiliza función getSection con la secuence 2.\n"

    sectionsIds = similarity.map((item) => item.id)
  }

  // info de eventos y disponibilidad si tiene la función obtenerDisponibilidad

  if (functionsNames.includes("obtenerDisponibilidad")) {
    const events= await getActiveEventsDAOByClientId(clientId)
    const availableEvents= events.filter(event => event.availability.length > 0)
    console.log("availableEvents: ", availableEvents.map((event) => event.name))

    contextString+= "\n**** Eventos disponibles, no son reservas, son eventos disponibles para reservar ****\n"
    contextString+= "Eventos que pueden ser relevantes para elaborar una respuesta:\n"
    availableEvents.map((event) => {
    contextString += `{
    eventId: "${event.id}",
    eventName: "${event.name}",
    eventDescription: "${event.description}",
    eventAddress: "${event.address}",
    timezone: "${event.timezone}",
    minDuration: ${event.minDuration},
    maxDuration: ${event.maxDuration},
}
`
    const hoy = format(toZonedTime(new Date(), event.timezone), "EEEE, dd/MM/yyyy HH:mm:ss", {
      locale: es,
    });
    contextString+= `Ahora es ${hoy} en el timezone del evento (${event.timezone})\n`
    contextString+= `---------------\n\n`

// eventSeatsPerTimeSlot: ${event.seatsPerTimeSlot}
    })

  }




  const res= {
    contextString,
    sectionsIds
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