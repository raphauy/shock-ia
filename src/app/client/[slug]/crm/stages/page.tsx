import { getStagesDAO } from "@/services/stage-services"
import { StageDialog } from "./stage-dialogs"
import { DataTable } from "./stage-table"
import { columns } from "./stage-columns"
import { getClientBySlug } from "@/services/clientService"
import { notFound } from "next/navigation"

type Props = {  
  params: Promise<{
    slug: string
  }>
}
export default async function StagePage(props: Props) {
  const params = await props.params;

  const client= await getClientBySlug(params.slug)
  if (!client) {
    notFound()
  }
  const data= await getStagesDAO(client.id)

  return (
    <div className="w-full">      

      <div className="flex justify-end mx-auto my-2">
        <StageDialog clientId={client.id} />
      </div>

      <div className="container bg-white p-3 py-4 mx-auto border rounded-md text-muted-foreground dark:text-white dark:bg-black">
        <DataTable columns={columns} data={data} subject="Stage"/>      
      </div>
    </div>
  )
}
  
