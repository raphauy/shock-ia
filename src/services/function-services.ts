import * as z from "zod"
import { prisma } from "@/lib/db"
import { ChatCompletionCreateParams } from "openai/resources/index.mjs"
import { Client } from "@prisma/client"

export type FunctionDAO = {
	id: string
	name: string
	description: string | null
	definition: string | null
	createdAt: Date
	updatedAt: Date
}

export const functionSchema = z.object({
	name: z.string({required_error: "name is required."}),
	description: z.string().optional(),
	definition: z.string().optional(),	
})

export type FunctionFormValues = z.infer<typeof functionSchema>


export async function getFunctionsDAO() {
  const found = await prisma.function.findMany({
    orderBy: {
      id: 'asc'
    },
  })
  return found as FunctionDAO[]
}

export async function getFunctionDAO(id: string) {
  const found = await prisma.function.findUnique({
    where: {
      id
    },
  })
  return found as FunctionDAO
}
    
export async function createFunction(data: FunctionFormValues) {
  const created = await prisma.function.create({
    data
  })
  return created
}

export async function updateFunction(id: string, data: FunctionFormValues) {
  const updated = await prisma.function.update({
    where: {
      id
    },
    data
  })
  return updated
}

export async function deleteFunction(id: string) {
  const deleted = await prisma.function.delete({
    where: {
      id
    },
  })
  return deleted
}

export async function getFunctionsDefinitions(clientId: string): Promise<ChatCompletionCreateParams.Function[]> {
  const found = await prisma.clientFunction.findMany({
    where: {
      clientId
    },
  })

  const functions= await prisma.function.findMany({
    where: {
      id: {
        in: found.map((f) => f.functionId)
      }
    }
  })

  try {
    const res= functions.map((f) => {
      return f.definition ? JSON.parse(f.definition) : null
    })
  
    return res
      
  } catch (error) {
    throw new Error("Error al parsear las definiciones de las funciones.")    
  }
}

export async function getClientsOfFunctionByName(name: string): Promise<Client[]> {
  const found = await prisma.clientFunction.findMany({
    where: {
      function: {
        name
      }
    },
    include: {
      client: true
    }
  })

  return found.map((f) => f.client)
}
