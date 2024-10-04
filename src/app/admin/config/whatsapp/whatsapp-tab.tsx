import { fetchInstance } from "@/services/wrc-sdk"
import { DataClient } from "../../clients/(crud)/actions"
import { ConnectionDetails } from "./connection-details"
import CreateInstanceButton from "./create-instance-button"
import Hook from "../hook"

type Props = {
  client: DataClient
  basePath: string
}

export default async function WhatsappTab({ client, basePath }: Props) {

  const inboxProvider = client.inboxProvider
  console.log("tab", client.nombre, client.inboxProvider)

  if (inboxProvider === "WRC") {
    const instance = client.whatsappInstance
    if (!instance) {
      const instanceName = client.slug
    
      return <div className="flex items-center justify-center w-full mt-10 border rounded-md border-dashed h-40">
        <CreateInstanceButton name={instanceName} />
      </div>
    } else {
      const wrcInstance = await fetchInstance(instance.name)
      if (!wrcInstance) {
        return <div>No instance found</div>
      } else {
        return (
          <ConnectionDetails instance={wrcInstance} clientId={client.id} chatwootAccountId={client.whatsappInstance?.chatwootAccountId}/>
        )
      }
    }  
  }

  // default id OSOM provider
  return (
    <Hook basePath={basePath} />
  )
}