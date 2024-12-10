import { getDatesFromSearchParams } from "@/lib/utils"
import { getAllTags, getClientBySlug } from "@/services/clientService"
import { getFilteredContacts } from "@/services/contact-services"
import { notFound } from "next/navigation"
import TagSelector from "../campaigns/[campaignId]/tag-selector"
import DatesFilter from "../kanban/dates-filter"
import { columns } from "./contact-columns"
import { DataTable } from "./contact-table"
import StageSelector from "../campaigns/[campaignId]/stage-selector"
import { getStagesDAO } from "@/services/stage-services"

type Props= {
  params: {
    slug: string
  }
  searchParams: {
    from: string
    to: string
    last: string
    tags: string
    stageId: string
  }
}

export default async function CampaignPage({ params, searchParams }: Props) {
  const client= await getClientBySlug(params.slug)
  if (!client) return notFound()

  // dates
  const { from, to }= getDatesFromSearchParams(searchParams)

  // tags
  const tags = typeof searchParams.tags === 'string' 
    ? searchParams.tags.split(",") 
    : []

  // stages
  const stageId= searchParams.stageId ?? undefined
  const allStages= await getStagesDAO(client.id)

  const allTags= await getAllTags(client.id)

  const contacts= await getFilteredContacts(client.id, from, to, tags, stageId)

  const baseUrl= `/client/${params.slug}/crm/contacts`

  return (
    <div className="p-4">
      <div className="space-y-4">
        <p className="text-2xl font-bold text-center">Contactos</p>
        <div className="flex items-center gap-2">
          <p className="font-bold w-20">Fecha:</p>
          <DatesFilter baseUrl={baseUrl} allTags={allTags} />
        </div>
        <div className="flex items-center gap-2 max-w-[820px] w-full">
          <p className="font-bold w-24">Estado:</p>
          <StageSelector baseUrl={baseUrl} allStages={allStages} />
        </div>
        <div className="flex items-center gap-2 max-w-[820px] w-full">
          <p className="font-bold w-24">Etiquetas:</p>
          <TagSelector actualTags={tags} allTags={allTags} baseUrl={baseUrl} />
        </div>
        <DataTable columns={columns} data={contacts} subject="Contacto"/>
      </div>

    </div>
  )
}