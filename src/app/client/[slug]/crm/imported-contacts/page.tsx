import { getImportedContactsDAO } from "@/services/imported-contacts-services"
import { ImportedContactDialog } from "./imported-contact-dialogs"
import { DataTable } from "./imported-contact-table"
import { columns } from "./imported-contact-columns"
import { getClientBySlug } from "@/services/clientService"
import { ImportCSVButton } from "./import-csv-button"

type Props= {
  params: {
    slug: string
  }
}

export default async function ImportedContactPage({ params }: Props) {
  const slug= params.slug
  const client= await getClientBySlug(slug)
  if (!client) {
    return <div>Cliente no encontrado</div>
  }
  const data= await getImportedContactsDAO(client.id)

  return (
    <div className="w-full">      

      <div className="flex justify-end mx-auto my-2 gap-2">
        <ImportedContactDialog clientId={client.id} />
        <ImportCSVButton />
      </div>

      <div className="container bg-white p-3 py-4 mx-auto border rounded-md text-muted-foreground dark:text-white dark:bg-black">
        <DataTable columns={columns} data={data} subject="ImportedContact"/>      
      </div>
    </div>
  )
}
  
