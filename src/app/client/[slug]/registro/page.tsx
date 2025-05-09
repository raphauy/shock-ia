import { getDataClientBySlug } from "@/app/admin/clients/(crud)/actions"
import { columns } from "@/app/admin/narvaez/narvaez-columns"
import { DataTable } from "@/app/admin/narvaez/narvaez-table"
import { getClientsOfFunctionByName } from "@/services/function-services"
import { getFullNarvaezsDAOByClient } from "@/services/narvaez-services"
import { redirect } from "next/navigation"

type Props= {
  params: Promise<{
    slug: string
  }>
}

export default async function NarvaezPage(props: Props) {
  const params = await props.params;

  const slug = params.slug

  const clientsOfNarvaez= await getClientsOfFunctionByName("registrarPedido")

  if (!clientsOfNarvaez.map(c => c.slug).includes(slug))
    return redirect(`/client/${slug}`)

  const client= await getDataClientBySlug(slug)
  if (!client)
    return <div>Cliente no encontrado</div>

  const data= await getFullNarvaezsDAOByClient(client.id)

  return (
    <div className="w-full">      

      <div className="container p-3 py-4 mx-auto border rounded-md text-muted-foreground dark:text-white">
        <DataTable columns={columns} data={data} subject="Registro"/>      
      </div>
    </div>
  )
}
  
