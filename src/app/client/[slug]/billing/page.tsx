import { Billing } from "@/app/admin/billing/billing"
import { getClientBySlug } from "@/services/clientService"

type Props = {
  params: Promise<{
    slug: string
  }>
}
export default async function BillingPage(props: Props) {
  const params = await props.params;
  const slug = params.slug
  const client= await getClientBySlug(slug)
  if (!client) {
    return <div>Client not found</div>
  }

  return (
    <div className="w-full h-full">
        <Billing clientId={client.id} />
    </div>
  )
}
