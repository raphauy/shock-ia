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
import { BulkDeleteContactDialog } from "./contact-dialogs"
import ComercialSelector from "./comercial-selector"
import { getActiveComercialsDAO } from "@/services/comercial-services"

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
    comercialId: string
  }
}

export default async function ContactsPage({ params, searchParams }: Props) {
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

  // comercials
  const comercialId = searchParams.comercialId ?? undefined
  const comercials = await getActiveComercialsDAO(client.id)

  const allTags= await getAllTags(client.id)

  const contacts= await getFilteredContacts(client.id, from, to, tags, stageId, comercialId)

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
        {comercials.length > 0 && (
          <div className="flex items-center gap-2 max-w-[820px] w-full">
            <p className="font-bold w-24">Comercial:</p>
            <ComercialSelector baseUrl={baseUrl} comercials={comercials} />
          </div>
        )}
        <div className="flex items-center gap-2 max-w-[820px] w-full">
          <p className="font-bold w-24">Etiquetas:</p>
          <TagSelector actualTags={tags} allTags={allTags} baseUrl={baseUrl} />
        </div>
        <DataTable columns={columns} data={contacts} subject="Contacto" fieldToFilter="name"/>
      </div>

      <div className="flex justify-end mt-4">
        <BulkDeleteContactDialog ids={contacts.map(contact => contact.id)} />
      </div>

    </div>
  )
}