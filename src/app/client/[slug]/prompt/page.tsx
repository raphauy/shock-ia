import { getClientBySlug } from "@/services/clientService"
import { PromptForm } from "@/app/admin/prompts/prompt-form"
import { updatePrompt } from "@/app/admin/clients/(crud)/actions"

type Props= {
    params: {
      slug: string
    }
}  
export default async function PromptPage({ params }: Props) {
    const slug= params.slug
        
    const client= await getClientBySlug(slug)
    if (!client) {
      return <div>Cliente no encontrado</div>
    }

    return (
        <div className="container mt-10 space-y-5">
            <div 
                className="w-full p-4 border rounded-lg">
                <p className="text-2xl font-bold">{client.name}</p>
                <PromptForm id={client.id} update={updatePrompt} prompt={client.prompt || ""} />
            </div>
            
        </div>
    )
}
