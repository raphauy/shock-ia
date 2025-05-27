import { getClient } from "./clientService"
import { getDocumentsCountByClient } from "./document-services"
import { getClientRepositoryFunctionsNames } from "./function-services"

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
    tools.push({ name: "getDocument", mcpName: "Local Static Tools" })
  }

  // get client functions
  const clientRepositoryFunctionsNames= await getClientRepositoryFunctionsNames(clientId)
  console.log("clientRepositoryFunctionsNames: " + JSON.stringify(clientRepositoryFunctionsNames))
  for (const functionName of clientRepositoryFunctionsNames) {
    tools.push({ name: functionName, mcpName: "Local Dynamic Tools" })
  }

  // provisory tools
  tools.push({ name: "Coming soon...", mcpName: "MCP Tools" })

  return {
    totalTools: tools.length,
    tools
  }
}