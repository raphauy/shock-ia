import { getClient } from "./clientService"
import { getDocumentsByClient, getDocumentsCountByClient } from "./document-services"

type UserTools = {
  totalTools: number
  tools: Array<{ name: string; mcpName: string }>
}

export async function getLocalTools(clientId: string): Promise<UserTools> {
  const client= await getClient(clientId)
  if (!client) {
    throw new Error("Client not found, clientId: " + clientId)
  }

  const tools: Array<{ name: string; mcpName: string }> = []

  const documentsCount= await getDocumentsCountByClient(clientId)
  if (documentsCount > 0) {
    tools.push({ name: "getDocument", mcpName: "Local Tools" })
  }

  // provisory tools
  tools.push({ name: "Comming soon...", mcpName: "MCP Tools" })

  return {
    totalTools: tools.length,
    tools
  }
}