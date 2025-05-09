import { ModelSelector, SelectorData } from "@/components/header/model-selector";
import { getFullModelDAOByName, getFullModelsDAO } from "@/services/model-services";
import SimulatorBox from "./simulator-box";
import { getClientBySlug } from "@/services/clientService";
import { redirect } from "next/navigation";
import SimulatorNoStreamingBox from "./simulator-no-stremaing-box";

type Props = {
    params: Promise<{
        slug: string
    }>,
    searchParams: Promise<{
        model: string
    }>
}
export default async function SimulatorPage(props: Props) {
    const searchParams = await props.searchParams;
    const params = await props.params;
    const slug= params.slug as string
    const modelName= searchParams.model
    console.log("modelName", modelName)

    const model= modelName && (await getFullModelDAOByName(modelName))

    if (!model) {
        
        const client= await getClientBySlug(slug)
        if (client) {
            console.log("client found")

            const model= client.model
            if (model) {
                console.log("redirecting")
                redirect(`/client/${slug}/simulator?model=${model.name}`)
            } else {
                console.log("redirecting to home")
                redirect(`/client/${slug}`)
            }
        } else {
            console.log("redirecting to home")
            redirect(`/client/${slug}`)
        }
    }

    const haveStreaming= model.provider.streaming && model.streaming

    const models= await getFullModelsDAO()
    const selectorData: SelectorData[]= models.map(model => ({slug: model.name, name: model.name}))


    return (
        <div className="flex flex-col items-center w-full h-full">
            <div>
                <ModelSelector selectors={selectorData} />
            </div>

            {
                haveStreaming ?
                <SimulatorBox />
                :
                <SimulatorNoStreamingBox />
            }

        </div>
    )
}
