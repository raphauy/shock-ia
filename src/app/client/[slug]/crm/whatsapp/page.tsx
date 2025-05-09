import { ConnectionDetails } from "@/app/admin/config/whatsapp/connection-details"
import { getWhatsappInstance } from "@/services/clientService"
import { getClientBySlug } from "@/services/clientService"
import { fetchInstance } from "@/services/wrc-sdk"

type Props = {
    params: Promise<{
        slug: string
    }>
}
export default async function WhatsappPage(props: Props) {
    const params = await props.params;
    const slug= params.slug
    const client= await getClientBySlug(slug)
    if (!client) return <div>Cliente no encontrado: {slug}</div>
    const whatsappInstance= await getWhatsappInstance(client.id)
    if (!whatsappInstance) return <div>No hay instancia de whatsapp (WRC)</div>

    const inboxProvider = client.inboxProvider
    if (inboxProvider !== "CHATWOOT") {
        return <div>El proveedor no es CHATWOOT</div>
    }

    const wrcInstance = await fetchInstance(whatsappInstance.name)
    if (!wrcInstance) {
      return <div>WRC instance not found</div>
    }

    return (
        <div className="mt-10">
            <ConnectionDetails instance={wrcInstance} clientId={client.id} chatwootAccountId={whatsappInstance.chatwootAccountId} whatsappInboxId={whatsappInstance.whatsappInboxId}/>
        </div>
      )
}