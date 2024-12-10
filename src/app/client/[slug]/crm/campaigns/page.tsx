import { getCampaignsDAO } from "@/services/campaign-services"
import { CampaignDialog } from "./campaign-dialogs"
import { DataTable } from "./campaign-table"
import { columns } from "./campaign-columns"
import { getClientBySlug } from "@/services/clientService"
import { notFound } from "next/navigation"

type Props= {
  params: { 
    slug: string 
  }
}

export default async function CampaignPage({ params }: Props) {
  
  const slug= params.slug
  const client= await getClientBySlug(slug)
  if (!client) return notFound()

  const data= await getCampaignsDAO(client.id)

  if (data.length === 0) 
    return (
      <div className="flex justify-center items-center h-32 border rounded-md p-4 border-dashed mt-20">
        <CampaignDialog clientId={client.id} />
      </div>
    )


  return (
    <div className="w-full">      

      <div className="flex justify-end mx-auto my-2">
        <CampaignDialog clientId={client.id} />
      </div>

      <div className="container bg-white p-3 py-4 mx-auto border rounded-md text-muted-foreground dark:text-white dark:bg-black">
        <DataTable columns={columns} data={data} subject="Campaña"/>      
      </div>
    </div>
  )
}
  
