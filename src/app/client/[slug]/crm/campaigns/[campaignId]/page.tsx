import { notFound } from "next/navigation"
import { getCampaignDAOAction, setMessageToCampaignAction } from "../campaign-actions"
import { CampaignDAO } from "@/services/campaign-services"
import { cn, getDatesFromSearchParams } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CampaignStatus } from "@prisma/client"
import { DescriptionForm } from "@/components/description-form"
import { getFilteredContacts } from "@/services/contact-services"
import { DataTable } from "../../contacts/contact-table"
import { Separator } from "@/components/ui/separator"
import DatesFilter from "../../kanban/dates-filter"
import { getAllTags } from "@/services/clientService"
import TagSelector from "./tag-selector"
import { columns } from "../../contacts/contact-columns"
import StageSelector from "./stage-selector"
import { getStagesDAO } from "@/services/stage-services"

type Props= {
  params: {
    campaignId: string
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
  const campaign: CampaignDAO | null = await getCampaignDAOAction(params.campaignId)
  if (!campaign) return notFound()

  // dates
  const { from, to }= getDatesFromSearchParams(searchParams)

  // tags
  const tags = typeof searchParams.tags === 'string' 
    ? searchParams.tags.split(",") 
    : []
  const allTags= await getAllTags(campaign.clientId)

  // stages
  const stageId= searchParams.stageId ?? undefined
  const allStages= await getStagesDAO(campaign.clientId)

  // contacts
  const contacts= await getFilteredContacts(campaign.clientId, from, to, tags, stageId)

  const baseUrl= `/client/${params.slug}/crm/campaigns/${params.campaignId}`

  return (
    <div className="p-4">
      <Card>
        <CardHeader>
          <CardTitle>{campaign.name}</CardTitle>
          <CardDescription>{campaign.type}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2">
            <div className="flex items-center gap-2">
              <span className="font-semibold">Estado:</span> <p className={cn("font-bold", 
                campaign.status === CampaignStatus.CREADA && "text-yellow-500",
                campaign.status === CampaignStatus.EN_PROCESO && "text-green-500",
                campaign.status === CampaignStatus.COMPLETADA && "text-blue-500",
                campaign.status === CampaignStatus.EN_PAUSA && "text-red-500",
                campaign.status === CampaignStatus.CANCELADA && "text-gray-500")}>{campaign.status}</p>
            </div>
            <div>
              <span className="font-semibold">Contactos:</span> {campaign.contacts.length === 0 ? "Aún no hay contactos seleccionados para esta campaña" : campaign.contacts.length + " contactos"}
            </div>
            <div>
              <span className="font-semibold">ID:</span> {campaign.id}
            </div>
          </div>
        </CardContent>
      </Card>
      <DescriptionForm id={campaign.id} label="Mensaje al usuario" initialValue={campaign.message ?? ""} update={setMessageToCampaignAction} />
      <Separator className="mt-10 mb-4"/>
      <div className="space-y-4">
        <p className="text-lg font-bold">Filtrar Contactos:</p>
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