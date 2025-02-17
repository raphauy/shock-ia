import * as z from "zod"
import { prisma } from "@/lib/db"
import { UserDAO } from "./user-service"
import { getChatwootUserName, listAccountAgents } from "./chatwoot"
import { getWhatsappInstance } from "./clientService"

export type ComercialDAO = {
	id: string
	chatwootUserId: number | undefined
	chatwootUserName: string | undefined
	activo: boolean
	user: UserDAO
	userId: string
	clientId: string
	createdAt: Date
	updatedAt: Date
}

export type ChatwootUserDAO = {
	id: number
	name: string
}

export const ComercialSchema = z.object({
	chatwootUserId: z.number().optional(),
	activo: z.boolean(),	
	userId: z.string().min(1, "userId is required."),
	clientId: z.string().min(1, "clientId is required."),
})

export type ComercialFormValues = z.infer<typeof ComercialSchema>


export async function getComercialsDAO(clientId: string) {
  const found = await prisma.comercial.findMany({
    where: {
      clientId: clientId
    },
    orderBy: {
      id: 'asc'
    },
    include: {
      user: true
    }
  })
  return found as ComercialDAO[]
}

export async function getActiveComercialsDAO(clientId: string) {
  const found = await prisma.comercial.findMany({
    where: {
      clientId: clientId,
      activo: true
    },
    include: {
      user: true
    }
  })
  return found as ComercialDAO[]
}

export async function getComercialDAO(id: string) {
  const found = await prisma.comercial.findUnique({
    where: {
      id
    },
  })
  return found as ComercialDAO
}


    
export async function createComercial(data: ComercialFormValues) {
  const whatsappInstance= await getWhatsappInstance(data.clientId)
  if (!data.chatwootUserId) {
    throw new Error("Chatwoot user not found")
  }
  const chatwootUserName= await getChatwootUserName(Number(whatsappInstance?.chatwootAccountId), data.chatwootUserId)
  const created = await prisma.comercial.create({
    data: {
      ...data,
      chatwootUserName
    }
  })
  return created
}

export async function updateComercial(id: string, data: ComercialFormValues) {
  const updated = await prisma.comercial.update({
    where: {
      id
    },
    data
  })
  return updated
}

export async function deleteComercial(id: string) {
  const deleted = await prisma.comercial.delete({
    where: {
      id
    },
  })
  return deleted
}

export async function getChatwootUsers(chatwootAccountId: number): Promise<ChatwootUserDAO[]> {
  const chatwootUsers = await listAccountAgents(chatwootAccountId)
  if (!chatwootUsers) {
    return []
  }
  const res: ChatwootUserDAO[] = chatwootUsers
    .filter(agent => agent.id && agent.name)
    .map((agent) => ({
      id: agent.id!,
      name: agent.name!
    }))
  return res
}

export async function toggleComercialStatus(id: string): Promise<boolean> {
  const actualStatus = await prisma.comercial.findUnique({
    where: {
      id
    },
    select: {
      activo: true
    }
  })

  if (!actualStatus) {
    return false
  }

  const updated = await prisma.comercial.update({
    where: {
      id
    },
    data: {
      activo: !actualStatus.activo
    }
  })  
  return updated !== null
}