import { columns } from "@/app/admin/carservices/carservice-columns"
import { DataTable } from "@/app/admin/carservices/carservice-table"
import { getDataClientBySlug } from "@/app/admin/clients/(crud)/actions"
import { getCarServicesDAOByClientId } from "@/services/carservice-services"
import { getClientsOfFunctionByName } from "@/services/function-services"
import { redirect } from "next/navigation"

type Props= {
  params: Promise<{
    slug: string
  }>
  searchParams: Promise<{
    name?: string
  }>
}

export default async function UsersPage(props: Props) {
  const searchParams = await props.searchParams;
  const params = await props.params;

  const name = searchParams.name

  const slug = params.slug
  const clientsOfCarServices= await getClientsOfFunctionByName("reservarServicio")

  if (!clientsOfCarServices.map(c => c.slug).includes(slug))
    return redirect(`/client/${slug}`)

  const client= await getDataClientBySlug(slug)
  if (!client)
    return <div>Cliente no encontrado</div>

  const data= await getCarServicesDAOByClientId(client.id)


  return (
    <div className="w-full">      

      <div className="container p-3 py-4 mx-auto border rounded-md text-muted-foreground dark:text-white">
        <DataTable columns={columns} data={data} subject="Servicio" name={name}/>
      </div>
    </div>
  )
}
  
