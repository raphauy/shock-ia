import { getClientBySlug } from "@/services/clientService"
import { DocumentDialog } from "./document-dialogs"
import { DataTable } from "./document-table"
import { columns } from "./document-columns"
import { getDocumentsDAOByClient } from "@/services/document-services"

type Props= {
  params: Promise<{
    slug: string
  }>
}
export default async function UsersPage(props: Props) {
  const params = await props.params;
  const slug= params.slug
  const client= await getClientBySlug(slug)
  if (!client) {
    return <div>Cliente no encontrado</div>
  }

  const data= await getDocumentsDAOByClient(client.id)

  return (
    <div className="w-full">      

      <div className="flex justify-end mx-auto my-2">
        <DocumentDialog clientId={client.id} />
      </div>

      <div className="container p-3 py-4 mx-auto border rounded-md text-muted-foreground dark:text-white">
        <DataTable columns={columns} data={data} subject="Documento"/>      
      </div>
    </div>
  )
}
  
