import { getClientBySlug } from "@/services/clientService";
import { getKanbanStagesDAO } from "@/services/stage-services";
import { notFound } from "next/navigation";
import { KanbanComponent } from "./kanban/kanban";
import DatesFilter from "./kanban/dates-filter";

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

  let from= null
  let to= null
  const last= searchParams.last
  const today= new Date()
  if (last === "HOY") {
      from= new Date(today.getFullYear(), today.getMonth(), today.getDate())
      to= new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)
  } else if (last === "7D") {
      from= new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() - 7)
      to= new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)
  } else if (last === "30D") {
      from= new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() - 30)
      to= new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)
  } else if (last === "LAST_MONTH") {
      from= new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1)
      console.log("from: ", from)
      // the day should be the last day of the previous month
      const firstDayOfCurrentMonth= new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      // substract one day to get the last day of the previous month
      const lastDayOfPreviousMonth= new Date(firstDayOfCurrentMonth.getTime() - 24 * 60 * 60 * 1000)
      to= new Date(new Date().getFullYear(), new Date().getMonth() - 1, lastDayOfPreviousMonth.getDate())
      console.log("to: ", to)
  } else if (last === "ALL") {
      from= null
      to= null
  } else {
      from= searchParams.from ? new Date(searchParams.from) : null
      to= searchParams.to ? new Date(searchParams.to) : null
  }

  console.log("from: ", from)
  console.log("to: ", to)
  console.log("last: ", last)

  const client = await getClientBySlug(params.slug)
  if (!client) {
    notFound()
  }
  const stages = await getKanbanStagesDAO(client.id, from, to)
  return (
    <div>
      <DatesFilter />
      <KanbanComponent initialStages={stages} clientId={client.id} />
    </div>
  )
}