import * as z from "zod"
import { prisma } from "@/lib/db"
import { ChatCompletionCreateParams } from "openai/resources/index.mjs"
import { Client } from "@/lib/generated/prisma"
import { RepositoryDAO } from "./repository-services"
import { getClient } from "./clientService"

export type FunctionClientDAO= {
  functionId: string
  clientId: string
  client: ClientDAO
  webHookUrl: string | null
  uiLabel: string
  notifyPhones: string[]
  tags: string[]
  moveToStageId: string | null
  assignToComercial: boolean
}
type ClientDAO= {
  id: string
  name: string
}
export type FunctionDAO = {
	id: string
	name: string
	description: string | null
	definition: string | null
  toolDefinition: string | null
  tags: string[]
	createdAt: Date
	updatedAt: Date
  clients: FunctionClientDAO[]
  repositories?: RepositoryDAO[]
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
    include: {
      clients: true,
      repositories: true
    }
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
  try {
    const created = await prisma.function.create({
      data
    })
    return created
  } catch (error: any) {
    // Verificar si es un error de Prisma relacionado con la unicidad del nombre
    if (error.code === 'P2002' && error.meta?.target?.includes('name')) {
      throw new Error(`Ya existe una función con el nombre "${data.name}". Por favor, utiliza otro nombre.`)
    }
    
    // Si es otro tipo de error, lo propagamos
    throw error
  }
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

export async function nameIsAvailable(name: string) {
  const found = await prisma.function.findMany({
    where: {
      name
    },
    include: {
      clients: true
    }
  })

  return found.length === 0
}

export async function addFunctionToClient(clientId: string, functionId: string): Promise<boolean> {
  const client= await getClient(clientId)
  if (!client) throw new Error("Client not found")

  const clientFunction= await prisma.clientFunction.findUnique({
    where: {
      clientId_functionId: {
        clientId,
        functionId
      }
    }
  })
  if (clientFunction) throw new Error("La función ya está asociada a este cliente")

  const updated= await prisma.clientFunction.create({
    data: {
      clientId,
      functionId
    }
  })

  if (!updated) throw new Error("Error al asociar la función al cliente")

  return true
}

export async function removeFunctionFromClient(clientId: string, functionId: string): Promise<boolean> {
  const client= await getClient(clientId)
  if (!client) throw new Error("Client not found")

  const clientFunction= await prisma.clientFunction.findUnique({
    where: {
      clientId_functionId: {
        clientId,
        functionId
      }
    }
  })
  if (!clientFunction) throw new Error("La función no está asociada a este cliente")

  const deleted= await prisma.clientFunction.delete({
    where: {
      clientId_functionId: {
        clientId,
        functionId
      }
    }
  })

  if (!deleted) throw new Error("Error al eliminar la función del cliente")

  return true  
}

export async function getClientsWithSomeFunctionWithRepository(): Promise<Client[]> {
  const clients = await prisma.client.findMany({
    where: {
      functions: {
        some: {
          function: {
            repositories: {
              some: {},
            },
          },
        },
      },
    },
  });

  return clients;
}

export async function getFunctionClientDAO(functionId: string, clientId: string) {
  const found = await prisma.clientFunction.findUnique({
    where: {
      clientId_functionId: {
        clientId,
        functionId
      }
    }
  })

  return found  
}

export type SimpleFunction= {
  repoId: string
  functionName: string
}

export async function getFunctionsWithRepo(clientId: string): Promise<SimpleFunction[]> {
  const found = await prisma.clientFunction.findMany({
    where: {
      clientId,
      function: {
        repositories: {
          some: {}
        }
      }
    },
    select: {
      functionId: true,
      function: {
        select: {
          name: true,
          repositories: true
        }
      }
    }
  })

  const res= found.map((f) => ({
    repoId: f.function.repositories[0].id,
    functionName: f.function.name
  }))

  return res
}

export async function getAllFunctionsWithRepo() {
  const found = await prisma.function.findMany({
    where: {
      repositories: {
        some: {}
      }
    },
    include: {
      clients: true
    }
  })

  return found
}

export async function getFunctionIdByFunctionName(name: string) {
  const found = await prisma.function.findUnique({
    where: {
      name
    }
  })

  return found?.id
}

export async function functionHaveRepository(functionName: string) {
  const found = await prisma.function.findMany({
    where: {
      name: functionName,
      repositories: {
        some: {}
      }
    }
  })

  return found.length > 0
}

export async function getTagsOfFunction(functionId: string) {
  const found = await prisma.function.findUnique({
    where: {
      id: functionId
    }
  })

  return found?.tags
}

export async function setTagsOfFunction(functionId: string, tags: string[]) {
  const updated = await prisma.function.update({
    where: {
      id: functionId
    },
    data: {
      tags
    }
  })
}

export async function addTagToFunction(clientId: string, functionId: string, tag: string) {
  const updated = await prisma.clientFunction.update({
    where: {
      clientId_functionId: {
        clientId,
        functionId
      }
    },
    data: {
      tags: { 
        push: tag 
      }
    }
  })

  return updated
}

export async function removeTagFromFunction(clientId: string, functionId: string, tag: string) {
  const client = await prisma.clientFunction.findUnique({
    where: {
      clientId_functionId: {
        clientId,
        functionId
      }
    }
  });

  const updated = await prisma.clientFunction.update({
    where: {
      clientId_functionId: {
        clientId,
        functionId
      }
    },
    data: {
      tags: {
        set: client?.tags.filter(t => t !== tag) || []
      }
    }
  })

  return updated
}

export async function getClientFunctions(clientId: string) {
  const found = await prisma.clientFunction.findMany({
    where: {
      clientId,
      function: {
        repositories: {
          some: {}
        }
      }
    },
    include: {
      function: true,
      client: true
    }
  })

  return found
}

export async function getClientRepositoryFunctionsNames(clientId: string) {
  const found = await prisma.clientFunction.findMany({
    where: {
      clientId,
      function: {
        repositories: {
          some: {}
        }
      }
    },
    select: {
      function: {
        select: {
          name: true
        }
      }
    }
  })

  return found.map((f) => f.function.name)
}

export async function getTagsOfClientFunction(clientId: string, functionId: string) {
  const found = await prisma.clientFunction.findUnique({
    where: {
      clientId_functionId: { clientId, functionId }
    }
  })
  return found?.tags
}

export async function setMoveToStageIdOfClientFunction(clientId: string, functionId: string, moveToStageId: string) {
  const updated = await prisma.clientFunction.update({
    where: { 
      clientId_functionId: { 
        clientId, 
        functionId 
      } 
    },
    data: { 
      moveToStageId 
    }
  })

  return updated
}

export async function setNotifyPhones(clientId: string, functionId: string, notifyPhones: string[]) {
  const updated = await prisma.clientFunction.update({
    where: { 
      clientId_functionId: { 
        clientId, functionId 
      } 
    },
    data: { 
      notifyPhones 
    }
  })
  return updated
}

export async function getGenericFunctions(): Promise<FunctionDAO[]> {
  const gfNames= ["getDocument", "notificarAgente"]

  const found= await prisma.function.findMany({
    where: {
      name: {
        in: gfNames
      }
    },
    include: {
      clients: true,
      repositories: true
    }
  })

  return found as FunctionDAO[]
}

export async function setAssignToComercial(clientId: string, functionId: string, assignToComercial: boolean) {
  const updated = await prisma.clientFunction.update({
    where: { clientId_functionId: { clientId, functionId } },
    data: { assignToComercial }
  })
  return updated
}