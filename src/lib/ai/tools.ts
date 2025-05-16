import { Tool, tool } from 'ai';
import { z } from 'zod';
import { getDocumentDAO } from '../../services/document-services';
import { getRepositorysDAO, getToolFromDatabase } from '@/services/repository-services';
import { defaultFunction } from '@/services/functions';

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
    const staticTools= await getStaticTools()
    const dynamicTools= await getDynamicTools(clientId)
    const mcpTools= await getMCPTools(clientId)
    return {
        ...staticTools,
        ...dynamicTools,
        ...mcpTools
    }
}

async function getStaticTools() {
    return {
        ...getDocumentTool
    }
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
    const staticTools = await getStaticTools();
    const dynamicTools = await getDynamicTools(clientId);
    const mcpTools = await getMCPTools(clientId);
    
    const uiGroupsTools: UiGroupToolData[] = [
        {
            groupName: "Local Static Tools",
            tools: toolToToolData(getDocumentTool)
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
    // toolList example:
    // {
    //     getDocument: tool({
    //         description: 'Devuelve la información completa de un documento a partir de su id. Los documentos pueden utilizarse para responder a las peticiones del usuario.".',
    //     }),
    //     otherTool: tool({
    //         description: 'Descripción de otherTool".',
    //     }),
    // }   
    // return an array of ToolData
    return Object.keys(toolList).map(toolName => ({
        name: toolName,
        description: (toolList as any)[toolName]?.description || ""
    }))
}