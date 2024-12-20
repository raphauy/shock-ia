import { getClientBySlug, getCountData } from "@/services/clientService"
import ClientData from "./client-data"

interface Props{
  params: {
    slug: string
  },
}
 
export default async function ClientPage({ params: { slug } }: Props) {

  
  const client= await getClientBySlug(slug)
  if (!client) return <div>Cliente no encontrado (p)</div>

  const countData= await getCountData(client?.id)
 
  return (<ClientData countData={countData} />)
}
