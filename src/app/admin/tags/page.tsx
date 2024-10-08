import { getAllFunctionsWithRepo } from "@/services/function-services";
import { FunctionTaggerComponent } from "./function-tagger";
import { getClientIdsWithChatwootData } from "@/services/clientService";

export type FunctionData = {
    id: string
    label: string
    tags: string[]
    haveChatwoot: boolean
}
  
export default async function Tags() {
    const clientIdsWithChatwootData = await getClientIdsWithChatwootData()
    console.log(clientIdsWithChatwootData)
    const functionsWithRepo = (await getAllFunctionsWithRepo())
    const functionsData: FunctionData[] = functionsWithRepo.map(func => ({
        id: func.id,
        label: func.name,
        tags: func.tags,
        haveChatwoot: clientIdsWithChatwootData.some(clientId => func.clients.some(client => client.clientId === clientId))
    }))
    return (
        <div className="w-full max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold my-4 text-center">Etiquetas</h1>
            <FunctionTaggerComponent functions={functionsData} />
        </div>
    )
}