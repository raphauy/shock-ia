import * as z from "zod"
import { prisma } from "@/lib/db"

export type ProviderDAO = {
	id: string
	name: string
	apiKey: string
	baseUrl: string
	streaming: boolean
	createdAt: Date
	updatedAt: Date
}

export const providerSchema = z.object({
	name: z.string().min(1, "name is required."),
	apiKey: z.string().min(1, "apiKey is required."),
	baseUrl: z.string().min(1, "baseUrl is required."),
  streaming: z.boolean().default(false),	
})

export type ProviderFormValues = z.infer<typeof providerSchema>


export async function getProvidersDAO() {
  const found = await prisma.provider.findMany({
    orderBy: {
      id: 'asc'
    },
  })
  return found as ProviderDAO[]
}

export async function getProviderDAO(id: string) {
  const found = await prisma.provider.findUnique({
    where: {
      id
    },
  })
  return found as ProviderDAO
}
    
export async function createProvider(data: ProviderFormValues) {
  // TODO: implement createProvider
  const created = await prisma.provider.create({
    data
  })
  return created
}

export async function updateProvider(id: string, data: ProviderFormValues) {
  const updated = await prisma.provider.update({
    where: {
      id
    },
    data
  })
  return updated
}

export async function deleteProvider(id: string) {
  const deleted = await prisma.provider.delete({
    where: {
      id
    },
  })
  return deleted
}


export async function getFullProvidersDAO() {
  const found = await prisma.provider.findMany({
    orderBy: {
      id: 'asc'
    },
    include: {
		}
  })
  return found as ProviderDAO[]
}
  
export async function getFullProviderDAO(id: string) {
  const found = await prisma.provider.findUnique({
    where: {
      id
    },
    include: {
		}
  })
  return found as ProviderDAO
}
    