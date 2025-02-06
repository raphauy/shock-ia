import * as z from "zod"
import { prisma } from "@/lib/db"
import { FunctionClientDAO, FunctionDAO, createFunction, deleteFunction, nameIsAvailable } from "./function-services"
import { FieldDAO } from "./field-services"
import { colorPalette } from "@/lib/utils"

export type RepositoryDAO = {
	id: string
	name: string
  color: string
	functionName: string
	functionDescription: string
  functionActive: boolean
  notifyExecution: boolean
  conversationLLMOff: boolean
	finalMessage: string | undefined
  llmOffMessage: string | undefined
	createdAt: Date
	updatedAt: Date
  functionId: string
  function: FunctionDAO
  fields: FieldDAO[]
}

export const repositorySchema = z.object({
	name: z.string().min(1, "El nombre es obligatorio."),
})

export type RepositoryFormValues = z.infer<typeof repositorySchema>


export async function getRepositorysDAO() {
  const found = await prisma.repository.findMany({
    orderBy: {
      id: 'asc'
    },
  })
  return found as RepositoryDAO[]
}

export async function getRepositoryDAO(id: string) {
  const found = await prisma.repository.findUnique({
    where: {
      id
    },
  })
  return found as RepositoryDAO
}

export async function getRepositoryDAOByFunctionName(functionName: string) {
  const found = await prisma.repository.findUnique({
    where: {
      functionName
    },
    include: {
      function: {
        include: {
          clients: true
        }
      }
    }
  })

  return found
}
    
export async function createRepository(name: string) {

  // functionName: clean the spaces and lowercase only the first letter
  let functionName= name.replace(/ /g, '').toLowerCase().slice(0, 1) + name.replace(/ /g, '').slice(1)
  const isAvailable= await nameIsAvailable(functionName)
  if (!isAvailable) functionName= `${functionName}1`

  const functionDescription= `Esta función se debe utilizar ...
Instrucciones:
- Debes ir preguntando por la información necesaria para llenar cada campo en su orden de aparición
- Cada pregunta debe esperar su respuesta antes de hacer la siguiente pregunta.
- Cuando obtengas toda la información debes invocar la función.`

  const parameters: Parameters= {
    type: "object",
    properties: [],
    required: []
  }
  const definition= generateFunctionDefinition(functionName, functionDescription, parameters)

  const repoFunction= await createFunction({
    name: functionName,
    description: functionDescription,
    definition
  })
  if (!repoFunction) throw new Error("Error creating repository function")

  const color= colorPalette[Math.floor(Math.random() * colorPalette.length)]
  const data= {
    functionId: repoFunction.id,
    name,
    functionName,
    functionDescription,
    finalMessage: "Datos registrados correctamente. Un asesor te contactará a la brevedad.",
    color
  }

  const created = await prisma.repository.create({
    data
  })
  return created
}

// delete the repository and the function associated with it
export async function deleteRepository(id: string) {
  const repo= await getFullRepositoryDAO(id)
  if (!repo) throw new Error("Repository not found")

  const deleted= await prisma.repository.delete({
    where: {
      id
    },    
  })
  if (!deleted) throw new Error("Error al eliminar el repositorio")
  
  const functionId= repo.functionId
  if (functionId) {
    await deleteFunction(functionId)
  }

  return deleted
}


export async function getFullRepositorysDAO() {
  const found = await prisma.repository.findMany({
    orderBy: {
      createdAt: 'desc'
    },
    include: {
      function: {
        include: {
          clients: true
        }
      },
      fields: true
		}
  })
  return found as RepositoryDAO[]
}
  
export async function getFullRepositoryDAO(id: string) {
  const found = await prisma.repository.findUnique({
    where: {
      id
    },
    include: {
      function: {
        include: {          
          clients: {
            include: {
              client: true
            },
            orderBy: {
              clientId: "asc"
            }
          }          
        }
      },
      fields: {
        orderBy: {
          order: "asc"
        }
      }
		}
  })
  return found as RepositoryDAO
}
    

export async function setName(id: string, name: string) {
  const updated = await prisma.repository.update({
    where: {
      id
    },
    data: {
      name,      
    }
  })

  return updated
}

export async function setFunctionName(id: string, functionName: string) {
  const repo= await getFullRepositoryDAO(id)
  if (!repo) throw new Error("Repository not found")

  const isAvailable= await nameIsAvailable(functionName)
  if (!isAvailable) 
    if (repo.functionName !== functionName)
      throw new Error(`Ya existe una función con el nombre ${functionName}`)


  const updated = await prisma.repository.update({
    where: {
      id
    },
    data: {
      functionName,
    }
  })

  await updateFunctionDefinition(id)

  return updated
}

export async function setFunctionDescription(id: string, functionDescription: string) {
  const repo= await getFullRepositoryDAO(id)
  if (!repo) throw new Error("Repository not found")

  const updated = await prisma.repository.update({
    where: {
      id
    },
    data: {
      functionDescription,
    }
  })

  await updateFunctionDefinition(id)

  return updated
}

export async function setFinalMessage(id: string, finalMessage: string) {
  const updated = await prisma.repository.update({
    where: {
      id
    },
    data: {
      finalMessage
    }
  })

  return updated
}

export async function setLLMOffMessage(id: string, llmOffMessage: string) {
  const updated = await prisma.repository.update({
    where: {
      id
    },
    data: {
      llmOffMessage
    }
  })

  return updated
}

export async function setNotifyExecution(id: string, notifyExecution: boolean) {
  const updated = await prisma.repository.update({
    where: {
      id
    },
    data: {
      notifyExecution
    }
  })

  return updated
}

export async function setConversationLLMOff(id: string, conversationLLMOff: boolean) {
  const updated = await prisma.repository.update({
    where: {
      id
    },
    data: {
      conversationLLMOff
    }
  })

  return updated
}

export async function setFunctionActive(id: string, functionActive: boolean) {
  const updated = await prisma.repository.update({
    where: {
      id
    },
    data: {
      functionActive
    }
  })
  return updated
}

export async function updateFunctionDefinition(id: string) {
  const repo= await getFullRepositoryDAO(id)
  if (!repo) throw new Error("Repository not found")

  const fields= repo.fields.sort((a, b) => a.order - b.order)
  const properties= fields.map((field) => ({
    name: field.name,
    type: field.type === "list" ? "array" : field.type as "string" | "number" | "boolean" | "array",
    items: field.type === "list" ? {
      type: "string" as const,
      enum: field.listOptions ?? [],
    } : undefined,
    description: field.description,
  }))
  const required= fields.filter((field) => field.required).map((field) => field.name)
  const parameters: Parameters= {
    type: "object",
    properties,
    required
  }
  
  const updatedDefinition= generateFunctionDefinition(repo.functionName, repo.functionDescription, parameters)

  const updated = await prisma.repository.update({
    where: {
      id
    },
    data: {
      function: {
        update: {
          name: repo.functionName,
          description: repo.functionDescription,
          definition: updatedDefinition
        }        
      }
    }
  })

  return updated
}


export type Property= {
  name: string
  type: "string" | "number" | "boolean" | "array"
  description: string
  items?: {
    type: "string"
    enum: string[]
  }
}

export type Parameters= {
  type: "object"
  properties: Property[]
  required: string[]
}

/**
 * Function generation functions
 * this functions are OpenAI function definitions for the function calls
 * example:
 * {
    "name": "notifyHuman",
    "description": "Se debe invocar esta función para notificar a un agente cuando la intención del usuario es hablar con un humano o hablar con un agente o agendar una visita.",
    "parameters": {}
  }
    // parameters will come later
 */
export function generateFunctionDefinition(name: string, description: string, parameters: Parameters): string {
  const properties= parameters.properties
  const required= parameters.required
  // there is one property which needs to be inserted in all the functions and is required
  const conversationIdProperty: Property= {
    name: "conversationId",
    type: "string",
    description: "conversationId proporcionado en el prompt",
  }
  properties.push(conversationIdProperty)
  required.push("conversationId")

  const jsonParameters = {
    type: "object",
    properties: properties.reduce((acc: { [key: string]: { type: string; items?: { type: string; enum: string[] }; description: string } }, property) => {
      if (property.type === "array") {
        acc[property.name] = {
          type: "array",
          items: {
            type: "string",
            enum: property.items?.enum ?? [],
          },
          description: property.description,
        };
      } else {
        acc[property.name] = {
          type: property.type,
          description: property.description,
        };
      }
      return acc;
    }, {}),
    required: required,
  };

  const functionDefinition = {
    name: name,
    description: description,
    parameters: jsonParameters,
  };

  // Convert the functionDefinition object to a JSON string with indentation
  const jsonString = JSON.stringify(functionDefinition, null, 2);

  // Verify that the jsonString is valid JSON
  try {
    JSON.parse(jsonString);
  } catch (error) {
    console.error("Error parsing functionDefinition: ", error);
    throw new Error("Error parsing functionDefinition");
  }

  return jsonString;
}

export async function setWebHookUrl(clientId: string, functionId: string, webHookUrl: string) {
  const updated= await prisma.clientFunction.update({
    where: {
      clientId_functionId: {
        clientId,
        functionId
      }
    },
    data: {
      webHookUrl
    }
  })

  return updated
}

export async function getReposOfClient(clientId: string) {
  const repos= await prisma.repository.findMany({
    where: {
      function: {
        clients: {
          some: { clientId }
        }
      }
    }
  })

  return repos as RepositoryDAO[]
}