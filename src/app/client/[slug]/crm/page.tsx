import { getAllTags, getClientBySlug } from "@/services/clientService";
import { getKanbanStagesDAO } from "@/services/stage-services";
import { notFound } from "next/navigation";
import { KanbanComponent } from "./kanban/kanban";
import DatesFilter from "./kanban/dates-filter";
import { fromZonedTime, toZonedTime } from "date-fns-tz";
import { getDatesFromSearchParams } from "@/lib/utils";

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
  return (
    <div>
      <div className="border-b mb-2">
        <DatesFilter allTags={allTags} baseUrl={baseUrl} />
      </div>
      <KanbanComponent initialStages={stages} clientId={client.id} allTags={allTags} />
    </div>
  )
}

