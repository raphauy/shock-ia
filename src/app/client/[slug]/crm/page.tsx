import { getDatesFromSearchParams } from "@/lib/utils";
import { getAllTags, getClientBySlug } from "@/services/clientService";
import { getComercialsDAO } from "@/services/comercial-services";
import { getKanbanStagesDAO } from "@/services/stage-services";
import { notFound } from "next/navigation";
import DatesFilter from "./kanban/dates-filter";
import { KanbanComponent } from "./kanban/kanban";

type Props = {
  params: {
    slug: string
  } 
  searchParams: {
    from: string
    to: string
    last: string
  }
}
export default async function CRMKanban({ params, searchParams }: Props) {

  const { from, to }= getDatesFromSearchParams(searchParams)

  const client = await getClientBySlug(params.slug)
  if (!client) {
    notFound()
  }
  const stages = await getKanbanStagesDAO(client.id, from, to)
  const allTags = await getAllTags(client.id)
  const baseUrl= `/client/${params.slug}/crm`
  const comercials= await getComercialsDAO(client.id)
  return (
    <div className="ml-1">
      <div className="flex items-center gap-2">
        <p className="font-bold w-20">Fecha:</p>
        <DatesFilter baseUrl={baseUrl} allTags={allTags} />
      </div>

      <KanbanComponent initialStages={stages} clientId={client.id} allTags={allTags} comercials={comercials} />
    </div>
  )
}

