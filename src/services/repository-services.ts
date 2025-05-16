import { prisma } from "@/lib/db"
import { FieldType } from "@/lib/generated/prisma"
import { colorPalette } from "@/lib/utils"
import { Tool, tool } from "ai"
import * as z from "zod"
import { FieldDAO, getFieldsDAOByRepositoryId } from "./field-services"
import { FunctionDAO, createFunction, deleteFunction, nameIsAvailable } from "./function-services"
import { defaultFunction } from "./functions"
import { genericExecute } from "@/lib/ai/tools"

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


export async function getRepositorysDAO(clientId: string) {
  const found = await prisma.repository.findMany({
    where: {
      function: {
        clients: {
          some: { clientId }
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    },
  })
  return found as RepositoryDAO[]
}

export async function getRepositoryDAO(id: string) {
  const found = await prisma.repository.findUnique({
    where: {
      id
    },
    include: {
      function: true
    }
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
  try {
    // functionName: clean the spaces and lowercase only the first letter
    let functionName = name.replace(/ /g, '').toLowerCase().slice(0, 1) + name.replace(/ /g, '').slice(1)
    const isAvailable = await nameIsAvailable(functionName)
    if (!isAvailable) functionName = `${functionName}1`

    const functionDescription = `Esta función se debe utilizar ...
Instrucciones:
- Debes ir preguntando por la información necesaria para llenar cada campo en su orden de aparición
- Cada pregunta debe esperar su respuesta antes de hacer la siguiente pregunta.
- Cuando obtengas toda la información debes invocar la función.`

    const parameters: Parameters = {
      type: "object",
      properties: [],
      required: []
    }
    const definition = generateFunctionDefinition(functionName, functionDescription, parameters)

    const repoFunction = await createFunction({
      name: functionName,
      description: functionDescription,
      definition
    })
    if (!repoFunction) throw new Error("Error creating repository function")

    const color = colorPalette[Math.floor(Math.random() * colorPalette.length)]
    const data = {
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

    await updateRepositoryToolDefinition(created.id)

    return created
  } catch (error: any) {
    // Verificar si es un error de Prisma relacionado con la unicidad del nombre
    if (error.code === 'P2002' && error.meta?.target?.includes('name')) {
      throw new Error(`Ya existe una FC con el nombre "${name}". Por favor, utiliza otro nombre.`)
    } else if (error.message.includes('Unique constraint failed')) {
      throw new Error(`Ya existe una función con ese nombre. Por favor, utiliza otro nombre.`)
    }
    
    // Si es otro tipo de error, lo propagamos
    throw error
  }
}

// delete the repository and the function associated with it
export async function deleteRepository(id: string) {
  const repo = await getFullRepositoryDAO(id)
  if (!repo) throw new Error("Repository not found")

  // Si hay más de un cliente asociado, no permitir la eliminación
  if (repo.function.clients.length > 1) {
    throw new Error(`No se puede eliminar esta FC porque está siendo utilizada por ${repo.function.clients.length} clientes. Primero debes desasociarla de los clientes.`)
  }

  // Si hay un cliente asociado, eliminar la asociación
  if (repo.function.clients.length === 1) {
    const clientFunction = repo.function.clients[0]
    await prisma.clientFunction.delete({
      where: {
        clientId_functionId: {
          clientId: clientFunction.clientId,
          functionId: repo.functionId
        }
      }
    })
  }

  // Eliminar el repositorio
  const deleted = await prisma.repository.delete({
    where: {
      id
    },    
  })
  if (!deleted) throw new Error("Error al eliminar el repositorio")
  
  // Eliminar la función asociada
  const functionId = repo.functionId
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
  await updateRepositoryToolDefinition(id)
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
  await updateRepositoryToolDefinition(id)
  
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



/**
 *  functions to manage dynamic tools
 */

// Tipo para la definición serializada de una herramienta
export type SerializedToolDefinition = {
  functionName: string;
  description: string;
  parametersSchema: string; // Schema de Zod serializado
  repositoryId: string;
}

/**
 * Función interna para generar una herramienta CoreTool a partir de un repositorio y sus campos
 * @private
 */
async function _generateCoreTool(repositoryId: string, clientId: string): Promise<Record<string, Tool>> {
  const repository = await getRepositoryDAO(repositoryId);
  if (!repository) throw new Error("Repository not found");
  const fields = await getFieldsDAOByRepositoryId(repositoryId);

  // Convertir los campos del repositorio a propiedades para la herramienta
  const parameters = z.object({
    ...fields.reduce((acc, field) => {
      // Determinar el tipo de campo para Zod
      let fieldSchema;
      
      switch (field.type) {
        case FieldType.string:
          fieldSchema = z.string();
          break;
        case FieldType.number:
          fieldSchema = z.number();
          break;
        case FieldType.boolean:
          fieldSchema = z.boolean();
          break;
        case FieldType.list:
          // Si es una lista con opciones predefinidas
          if (field.listOptions && field.listOptions.length > 0) {
            fieldSchema = z.enum(field.listOptions as [string, ...string[]]);
          } else {
            fieldSchema = z.array(z.string());
          }
          break;
        default:
          fieldSchema = z.string();
      }
      
      // Añadir descripción al campo
      fieldSchema = fieldSchema.describe(field.description);
      
      // Si el campo es requerido o no
      if (!field.required) {
        fieldSchema = fieldSchema.optional();
      }
      
      return {
        ...acc,
        [field.name]: fieldSchema
      };
    }, {}),
    // Añadir conversationId como campo requerido
    conversationId: z.string().describe("ID de la conversación")
  });

  // Crear la herramienta dinámica
  const dynamicTool = {
    [repository.functionName]: tool({
      description: repository.functionDescription,
      parameters,
      execute: async (args: Record<string, any>) => {
        // Llamar a la función genérica de ejecución con los argumentos
        return await genericExecute({
          ...args,
          repositoryId: repository.id,
          functionName: repository.functionName,
          clientId: clientId
        });
      }
    })
  };

  return dynamicTool as Record<string, Tool>;
}

/**
 * Serializa la definición de una herramienta para guardarla en la base de datos
 */
export async function serializeToolDefinition(repositoryId: string): Promise<string> {
  const repository = await getRepositoryDAO(repositoryId);
  if (!repository) throw new Error("Repository not found");
  const fields = await getFieldsDAOByRepositoryId(repositoryId);
  
  // Crear un objeto que represente la definición de la herramienta
  const toolDefinition: SerializedToolDefinition = {
    functionName: repository.functionName,
    description: repository.functionDescription,
    parametersSchema: JSON.stringify(
      fields.map(field => ({
        name: field.name,
        type: field.type,
        description: field.description,
        required: field.required,
        listOptions: field.listOptions
      }))
    ),
    repositoryId: repository.id,
  };
  
  // Serializar la definición completa
  return JSON.stringify(toolDefinition);
}

/**
 * Hidrata (deserializa) una definición de herramienta para convertirla en una CoreTool utilizable
 */
export function hydrateToolDefinition(serializedDefinition: string, clientId: string): Record<string, Tool> {
  // Deserializar la definición
  const toolDefinition: SerializedToolDefinition = JSON.parse(serializedDefinition);
  const fields = JSON.parse(toolDefinition.parametersSchema);
  
  // Crear el esquema de parámetros con Zod
  const parameters = z.object({
    ...fields.reduce((acc: Record<string, any>, field: any) => {
      // Determinar el tipo de campo para Zod
      let fieldSchema;
      
      switch (field.type) {
        case FieldType.string:
          fieldSchema = z.string();
          break;
        case FieldType.number:
          fieldSchema = z.number();
          break;
        case FieldType.boolean:
          fieldSchema = z.boolean();
          break;
        case FieldType.list:
          // Si es una lista con opciones predefinidas
          if (field.listOptions && field.listOptions.length > 0) {
            fieldSchema = z.enum(field.listOptions as [string, ...string[]]);
          } else {
            fieldSchema = z.array(z.string());
          }
          break;
        default:
          fieldSchema = z.string();
      }
      
      // Añadir descripción al campo
      fieldSchema = fieldSchema.describe(field.description);
      
      // Si el campo es requerido o no
      if (!field.required) {
        fieldSchema = fieldSchema.optional();
      }
      
      return {
        ...acc,
        [field.name]: fieldSchema
      };
    }, {}),
    // Añadir conversationId como campo requerido
    conversationId: z.string().describe("ID de la conversación")
  });
  
  // Crear la herramienta dinámica
  const dynamicTool = {
    [toolDefinition.functionName]: tool({
      description: toolDefinition.description,
      parameters,
      execute: async (args: Record<string, any>) => {
        // Llamar a la función genérica de ejecución con los argumentos
        return await genericExecute({
          ...args,
          repositoryId: toolDefinition.repositoryId,
          functionName: toolDefinition.functionName,
          clientId: clientId
        });
      }
    })
  };
  
  return dynamicTool as Record<string, Tool>;
}

/**
 * Actualiza el campo functionDefinition del repositorio con la definición serializada de la herramienta
 */
export async function updateRepositoryToolDefinition(repositoryId: string): Promise<void> {
  console.log("updateRepositoryToolDefinition", repositoryId)
  // Serializar la definición de la herramienta
  const serializedDefinition = await serializeToolDefinition(repositoryId);
  
  // Actualizar el campo functionDefinition del repositorio
  await prisma.repository.update({
    where: {
      id: repositoryId
    },
    data: {
      function: {
        update: {
          toolDefinition: serializedDefinition
        }
      }
    }
  });
}



/**
 * Obtiene la herramienta CoreTool desde la definición almacenada en la base de datos.
 * Si no existe una definición almacenada, la genera y la guarda automáticamente.
 * Esta es la función principal que debe utilizarse para obtener herramientas CoreTool.
 */
export async function getToolFromDatabase(repositoryId: string, clientId: string): Promise<Record<string, Tool>> {
  const repository = await getRepositoryDAO(repositoryId);
  if (!repository) throw new Error("Repository not found");
  
  try {
    // Si no hay definición almacenada o está vacía, generarla y guardarla
    if (!repository.function.toolDefinition || repository.function.toolDefinition === "") {
      // Generar la herramienta
      const tool = await _generateCoreTool(repositoryId, clientId);
      
      // Guardar la definición en la base de datos
      await updateRepositoryToolDefinition(repositoryId);
      
      return tool;
    }
    
    // Hidratar la definición almacenada
    return hydrateToolDefinition(repository.function.toolDefinition, clientId);
  } catch (error) {
    console.error("Error al obtener la herramienta:", error);
    
    // En caso de error al hidratar, regenerar la herramienta
    const tool = await _generateCoreTool(repositoryId, clientId);
    
    // Intentar actualizar la definición
    try {
      await updateRepositoryToolDefinition(repositoryId);
    } catch (updateError) {
      console.error("Error al actualizar la definición:", updateError);
    }
    
    return tool;
  }
}

