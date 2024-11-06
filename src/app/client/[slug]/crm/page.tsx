import { getClientBySlug } from "@/services/clientService";
import { getKanbanStagesDAO } from "@/services/stage-services";
import { notFound } from "next/navigation";
import { KanbanComponent } from "./kanban/kanban";

type Props = {
  params: {
    slug: string
  } 
}
export default async function CRMKanban({ params }: Props) {
  const client = await getClientBySlug(params.slug)
  if (!client) {
    notFound()
  }
  const stages = await getKanbanStagesDAO(client.id)
  return (
    <div className="mt-7">
      <KanbanComponent initialStages={stages} clientId={client.id} />
    </div>
  )
}