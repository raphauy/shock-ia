import { getFullRepoDatasDAO, getFullRepoDatasDAOByContactId } from "@/services/repodata-services"
import { getClientBySlug } from "@/services/clientService"
import { DataTable } from "../../registros/repodata-table"
import { columns } from "../../registros/repodata-columns"
import { getContactEventDAO } from "@/services/contact-event-services"
import { getContactDAO } from "@/services/contact-services"

type Props= {
  params: {
    slug: string
  }
  searchParams: {
    contactId?: string
  }
}

export default async function RepoDataPage({ params, searchParams }: Props) {

  const contactId= searchParams.contactId
  const slug = params.slug
  const client= await getClientBySlug(slug)
  if (!client) return <div>Cliente no encontrado</div>

  let data
  let contactName
  if (contactId) {
    data= await getFullRepoDatasDAOByContactId(contactId)
    const contact= await getContactDAO(contactId)
    contactName= contact?.name || contact?.phone
  } else {
    data= await getFullRepoDatasDAO(slug)
  }

  const repoNames= Array.from(new Set(data.map(repo => repo.repoName)))

  return (
    <div className="w-full">

      {contactName && (
        <p className="font-bold text-xl mb-4 text-center mt-4"> Registros de {contactName}</p>
      )}

      <div className="container bg-white p-3 py-4 mx-auto border rounded-md text-muted-foreground dark:text-white dark:bg-black">
        <DataTable columns={columns} data={data} subject="RepoData" repoNames={repoNames} repoLabel={"Registros"} columnsOff={["repoName"]}/>
      </div>
    </div>
  )
}
  
