import { getClientBySlug, getCountData } from "@/services/clientService"
import ClientData from "./client-data"

interface Props{
  params: Promise<{
    slug: string
  }>,
}
 
export default async function ClientPage(props: Props) {
  const params = await props.params;

  const {
    slug
  } = params;


  const client= await getClientBySlug(slug)
  if (!client) return <div>Cliente no encontrado (p)</div>

  const countData= await getCountData(client?.id)

  return (<ClientData countData={countData} />)
}
