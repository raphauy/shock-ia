import { Tool, tool } from 'ai';
import { z } from 'zod';
import { getDocumentDAO, getDocumentsCount, getDocumentsCountByClient } from '../../services/document-services';
import { getRepositorysDAO, getToolFromDatabase } from '@/services/repository-services';
import { buscarOrden, buscarProducto, defaultFunction } from '@/services/functions';
import { clientHasOrderFunction, getClient, getClientIdByConversationId } from '@/services/clientService';

export async function genericExecute(args: any)  {
    const { repositoryId, functionName, conversationId, clientId, ...data } = args;
    console.log("defaultFunction")
    console.log("repositoryId: ", repositoryId)
    console.log("functionName: ", functionName)
    console.log("conversationId: ", conversationId)
    console.log("data: ", data)
    console.log("args: ", args)
  
    try {
      const response= await defaultFunction(clientId, functionName, args)
      return response
    } catch (error) {
      console.error("Error al ejecutar la función:", error);
      return "Ocurrió un error al ejecutar la función."
    }
}

export async function getAllClientTools(clientId: string) {
    const staticTools= await getStaticTools(clientId)
    const dynamicTools= await getDynamicTools(clientId)
    const mcpTools= await getMCPTools(clientId)
    return {
        ...staticTools,
        ...dynamicTools,
        ...mcpTools
    }
}

async function getStaticTools(clientId: string) {
    let res= {}
    const client= await getClient(clientId)
    if (!client) throw new Error("Client not found")

    const documentCount= await getDocumentsCountByClient(clientId)
    console.log("documentCount: ", documentCount)
    if (documentCount > 0) {
        res= {
            ...res,
            ...getDocumentTool
        }
    }
    const haveProducts= client.haveProducts
    if (haveProducts) {
        res= {
            ...res,
            ...buscarProductoTool
        }
    }
    const haveOrderFunction= await clientHasOrderFunction(clientId)
    if (haveOrderFunction) {
        res= {
            ...res,
            ...buscarOrdenTool
        }
    }
    return res
}

async function getDynamicTools(clientId: string) {
    const repositories= await getRepositorysDAO(clientId)
    let dynamicTools= {}
    for (const repository of repositories) {
        const tool= await getToolFromDatabase(repository.id, clientId)
        console.log("Tool of:", repository.name)
        dynamicTools= {
          ...dynamicTools,
          ...tool
        }
    }
    console.log("dynamicTools tools count:", Object.keys(dynamicTools).length)

    return dynamicTools
}

async function getMCPTools(clientId: string) {
    // TODO: Implementar MCPTools
    let mcpTools= {}

    return {
        ...mcpTools
    }
}



/******************************************************************************************************
 * Static Tools
 *******************************************************************************************************/
export const getDocumentTool= {
    getDocument: tool({
        description: 'Devuelve la información completa de un documento a partir de su id. Los documentos pueden utilizarse para responder a las peticiones del usuario.".',
        parameters: z.object({
            docId: z.string().describe('El identificador del documento que se quiere consultar'),
        }),
        execute: async ({ docId }) => {
          const document= await obtenerDocumento(docId)
          return document
        },
    }),
}

export type DocumentResult= {
    documentId: string
    documentName: string
    documentDescription: string | null
    content: string | null
}

export async function obtenerDocumento(id: string) {
    const document= await getDocumentDAO(id)
    if (!document) return "Document not found"
    console.log(`\tgetDocument: doc: ${document.name}`)
  
    const res: DocumentResult= {
        documentId: document.id,
        documentName: document.name,
        documentDescription: document.description ?? null,
        content: document.textContent ?? null,
    }
    return res
}

export const buscarProductoTool= {
    buscarProducto: tool({
        description: 'Busca un producto en la base de datos de productos. Esta es una búsqueda semántica, por lo que la query será transformada a un vector y se buscarán productos que tengan una similaridad semántica. Entre los resultados viene el campo similarity que indica la similaridad del producto con la query, cuanto más cercano a 0, más similar es el producto con la query.',
        parameters: z.object({
            conversationId: z.string().describe('Id de la conversación que se proporciona en el prompt.'),
            query: z.string().describe('Nombre, descripción o algún otro aspecto del producto que se quiere buscar.'),
        }),
        execute: async ({ conversationId, query }) => {
            try {
                const clientId= await getClientIdByConversationId(conversationId)
                if (!clientId) return "No se encontró un cliente para el conversationId: " + conversationId
                const response= await buscarProducto(clientId, conversationId, query)
                return JSON.stringify(response)
            } catch (error) {
                console.error("Error en buscarProducto:", error)
                return "Error al buscar productos"
            }
        },
    })
}

export const buscarOrdenTool= {
    buscarOrden: tool({
        description: 'Busca una orden en la base de datos de ordenes a partir de su ID.',
        parameters: z.object({
            conversationId: z.string().describe('Id de la conversación que se proporciona en el prompt.'),
            orderId: z.string().describe('Id de la orden que se quiere buscar.'),
        }),
        execute: async ({ conversationId, orderId }) => {
            const clientId= await getClientIdByConversationId(conversationId)
            if (!clientId) return "No se encontró un cliente para el conversationId: " + conversationId
            try {
                const response= await buscarOrden(clientId, conversationId, orderId)
                return JSON.stringify(response)
            } catch (error) {
                console.error("Error en buscarOrden:", error)
                return "Error al buscar orden"
            }
        },
    })
}

/******************************************************************************************************
 * UI Group Tools Data
 *******************************************************************************************************/

export type ToolData= {
    name: string
    description: string
}

export type UiGroupToolData= {
    groupName: string
    tools: ToolData[]
}

export async function getUiGroupsTools(clientId: string): Promise<UiGroupToolData[]> {
    const staticTools = await getStaticTools(clientId);
    const dynamicTools = await getDynamicTools(clientId);
    const mcpTools = await getMCPTools(clientId);
    
    const uiGroupsTools: UiGroupToolData[] = [
        {
            groupName: "Local Static Tools",
            tools: toolToToolData(staticTools)
        },
        {
            groupName: "Local Dynamic Tools",
            tools: toolToToolData(dynamicTools)
        },
        {
            groupName: "MCP Tools",
            tools: toolToToolData(mcpTools)
        }
    ]
    return uiGroupsTools
}

// Helper function to convert a tool to a ToolData[]
function toolToToolData(toolList: any): ToolData[] {
    return Object.keys(toolList).map(toolName => ({
        name: toolName,
        description: (toolList as any)[toolName]?.description || ""
    }))
}

/**
 * Prepara las herramientas para ser utilizadas con generateText
 * Elimina las funciones y otros objetos no serializables
 */
// export function prepareToolsForGeneration(tools: Record<string, any>): Record<string, any> {
//     const preparedTools: Record<string, any> = {};
    
//     for (const toolName in tools) {
//         if (Object.keys(tools[toolName]).length === 0) continue;
        
//         const tool = tools[toolName];
//         if (tool.description && tool.parameters) {
//             preparedTools[toolName] = {
//                 description: tool.description,
//                 parameters: tool.parameters
//             };
//         }
//     }
    
//     return preparedTools;
// }