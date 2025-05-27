import * as z from "zod"
import { prisma } from "@/lib/db"
import { processSections } from "./section-services"

export type DocumentDAO = {
	id: string
	name: string
	description: string | undefined
	jsonContent: string | undefined
	textContent: string | undefined
	type: string
	fileSize: number | undefined
	wordsCount: number | undefined
	status: string
	externalId: string | undefined
	url: string | undefined
	createdAt: Date
	updatedAt: Date
	clientId: string
  clientSlug: string
  sectionsCount: number
}

export const documentSchema = z.object({
	name: z.string({required_error: "name is required."}),
	description: z.string().optional(),
	jsonContent: z.string().optional(),
	textContent: z.string().optional(),
  url: z.string().optional(),
	fileSize: z.number().optional(),
	wordsCount: z.number().optional(),
	clientId: z.string({required_error: "clientId is required."}),
})

export type DocumentFormValues = z.infer<typeof documentSchema>


export async function getDocumentsDAO() {
  const found = await prisma.document.findMany({
    orderBy: {
      createdAt: 'desc'
    },
    include: {
      client: true,
      sections: true
    }
  })
  const res= found.map((doc) => {
    return {
      ...doc,
      jsonContent: undefined,
      textContent: undefined,
      clientSlug: doc.client.slug,
      sectionsCount: doc.sections.length
    }
  })

  return res as DocumentDAO[]
}

export async function getDocumentsDAOByClient(clientId: string) {
  const found = await prisma.document.findMany({
    where: {
      clientId
    },
    orderBy: {
      createdAt: 'asc'
    },
    include: {
      client: true,
      sections: true
    }
  })
  const res= found.map((doc) => {
    return {
      ...doc,
      jsonContent: undefined,
      textContent: undefined,
      clientSlug: doc.client.slug,
      sectionsCount: doc.sections.length
    }
  })

  return res as DocumentDAO[]
}

export async function getDocumentsByClient(clientId: string) {
  const found = await prisma.document.findMany({
    where: {
      clientId
    },
    include: {
      client: true,
      sections: true
    }
  })
  return found

}

export async function getDocumentsCount() {
  const count = await prisma.document.count()
  return count
}

export async function getDocumentsCountByClient(clientId: string) {
  const count = await prisma.document.count({
    where: {
      clientId
    }
  })
  return count
}
export async function getDocumentDAO(id: string) {
  const found = await prisma.document.findUnique({
    where: {
      id
    },
    include: {
      client: true,
      sections: true
    }
  })
  if (!found) return null

  const res= {
    ...found,
    clientSlug: found.client.slug,
    sectionsCount: found.sections.length
  }

  return res as DocumentDAO
}
    
export async function createDocument(data: DocumentFormValues) {
  const created = await prisma.document.create({
    data
  })

  if (!created) return null

  const BASE_PATH= process.env.NEXTAUTH_URL
  const url= `${BASE_PATH}/d/${created.id}`
  data.url= url
  const updated= await updateDocument(created.id, data)

  if (updated.textContent){
    const sections= await processSections(updated.textContent, updated.id)
    console.log("sections", sections)
  }

  return updated
}

export async function updateDocument(id: string, data: DocumentFormValues) {
  const updated = await prisma.document.update({
    where: {
      id
    },
    data
  })
  return updated
}

export async function deleteDocument(id: string) {
  // delete all the sections for the document
  await prisma.section.deleteMany({
    where: {
      documentId: id
    }
  })
  const deleted = await prisma.document.delete({
    where: {
      id
    },
  })
  return deleted
}


export async function getFullDocumentsDAO() {
  const found = await prisma.document.findMany({
    orderBy: {
      id: 'asc'
    },
    include: {
		}
  })
  return found as DocumentDAO[]
}
  
export async function getFullDocumentDAO(id: string) {
  const found = await prisma.document.findUnique({
    where: {
      id
    },
    include: {
		}
  })
  return found as DocumentDAO
}
    

export async function updateContent(id: string, textContent: string, jsonContent: string) {
  const wordsCount= textContent.split(" ").length
  const updated = await prisma.document.update({
    where: {
      id
    },
    data: {
      textContent,
      jsonContent,
      wordsCount
    }
  })

  const sections= await processSections(textContent, id)
  console.log("sections", sections)
  
  return updated
}