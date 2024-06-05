import * as z from "zod"
import { prisma } from "@/lib/db"

export type SummitDAO = {
	id: string
	nombreReserva: string | undefined
	nombreCumpleanero: string | undefined
  cantidadInvitados: number | undefined
	fechaReserva: string | undefined
	email: string | undefined
	resumenConversacion: string | undefined
	createdAt: Date
	updatedAt: Date
	conversationId: string
}

export const summitSchema = z.object({
	nombreReserva: z.string().optional(),
	nombreCumpleanero: z.string().optional(),
  cantidadInvitados: z.number().optional(),
	fechaReserva: z.string().optional(),
	email: z.string().optional(),
	resumenConversacion: z.string().optional(),
	conversationId: z.string({required_error: "conversationId is required."}),
})

export type SummitFormValues = z.infer<typeof summitSchema>


export async function getSummitsDAO() {
  const found = await prisma.summit.findMany({
    orderBy: {
      createdAt: 'desc'
    },
  })
  return found as SummitDAO[]
}

export async function getSummitDAO(id: string) {
  const found = await prisma.summit.findUnique({
    where: {
      id
    },
  })
  return found as SummitDAO
}
    
export async function createSummit(data: SummitFormValues) {
  
  const updated= await prisma.summit.upsert({
    where: {
      conversationId: data.conversationId
    },
    update: data,
    create: data
  })

  return updated
}

export async function updateSummit(id: string, data: SummitFormValues) {
  const updated = await prisma.summit.update({
    where: {
      id
    },
    data
  })
  return updated
}

export async function deleteSummit(id: string) {
  const deleted = await prisma.summit.delete({
    where: {
      id
    },
  })
  return deleted
}


export async function getFullSummitsDAO() {
  const found = await prisma.summit.findMany({
    orderBy: {
      id: 'asc'
    },
    include: {
			conversation: true,
		}
  })
  return found as SummitDAO[]
}
  
export async function getFullSummitDAO(id: string) {
  const found = await prisma.summit.findUnique({
    where: {
      id
    },
    include: {
			conversation: true,
		}
  })
  return found as SummitDAO
}
    
export async function getSummitIdByConversationId(conversationId: string) {
  const found = await prisma.summit.findUnique({
    where: {
      conversationId
    },
  })
  return found?.id
}

export async function getSummitEntry(clientId: string, phone: string){
  console.log("clientId: ", clientId)
  console.log("phone: ", phone)
  
  const found = await prisma.summit.findFirst({
    where: {
      conversation: {
        phone
      }
    },
    orderBy: {
      updatedAt: 'desc'
    }
  })

  return found
}
