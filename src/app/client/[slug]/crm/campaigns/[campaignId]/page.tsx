import { DescriptionForm } from "@/components/description-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { cn, getDatesFromSearchParams } from "@/lib/utils"
import { CampaignDAO, getCampaignDAO } from "@/services/campaign-services"
import { getAllTags } from "@/services/clientService"
import { ContactDAOWithStage, getFilteredContacts } from "@/services/contact-services"
import { getStagesDAO, StageDAO } from "@/services/stage-services"
import { CampaignStatus } from "@prisma/client"
import { notFound } from "next/navigation"
import { columns as simpleColumns } from "../../contacts/contact-columns"
import { DataTable } from "../../contacts/contact-table"
import DatesFilter from "../../kanban/dates-filter"
import { setMessageToCampaignAction } from "../campaign-actions"
import { columns } from "./contact-columns"
import RemoveAllContactsButton from "./remove-all-contacts"
import SetContactsButton from "./set-contacts-button"
import StageSelector from "./stage-selector"
import TagSelector from "./tag-selector"
import ProcessCampaignButton from "./process-campaign-button"

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
  const campaign: CampaignDAO | null = await getCampaignDAO(params.campaignId)
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

  const contactsReady= campaign.status === CampaignStatus.CREADA && campaign.contacts.length > 0

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
            <div className="flex items-center gap-2">
              <div>
                <span className="font-semibold">Contactos:</span> {campaign.contacts.length === 0 ? "Aún no hay contactos seleccionados para esta campaña" : campaign.contacts.length + " contactos"}
              </div>
              { contactsReady && <RemoveAllContactsButton campaignId={campaign.id} />}
            </div>
          </div>
        </CardContent>
      </Card>
      <DescriptionForm id={campaign.id} label="Mensaje al usuario" initialValue={campaign.message ?? ""} update={setMessageToCampaignAction} />

      <Separator className="mt-10 mb-4"/>

      { !contactsReady && campaign.status !== CampaignStatus.EN_PROCESO && campaign.status !== CampaignStatus.COMPLETADA && showFilters(campaign.id, baseUrl, allTags, allStages, contacts, tags)}

      {
        (campaign.status === CampaignStatus.COMPLETADA || campaign.status === CampaignStatus.EN_PROCESO || contactsReady) && (
          <div className="space-y-4">
            <DataTable columns={columns} data={campaign.contacts} subject="Contacto"/>
            <div className="border border-dashed rounded-md p-4 flex justify-center items-center h-40">
              { campaign.status !== CampaignStatus.COMPLETADA && <ProcessCampaignButton campaignId={campaign.id} />}
            </div>
          </div>
        )
      }


    </div>
  )
}

function showFilters(campaignId: string, baseUrl: string, allTags: string[], allStages: StageDAO[], contacts: ContactDAOWithStage[], tags: string[]) {
  const contactsWithValidWhatsapp= contacts.filter((c) => isValidWhatsappContact(c))
  const contactsDiscarded= contacts.length - contactsWithValidWhatsapp.length
  return (
    <div>
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
        <DataTable columns={simpleColumns} data={contactsWithValidWhatsapp} subject="Contacto"/>
        {
          contactsDiscarded > 0 && <p className="text-red-500">* Se descartaron {contactsDiscarded} contactos que no tienen whatsapp</p>
        }
      </div>

      <div className="my-4 w-full border border-dashed rounded-md p-4 flex justify-center items-center h-40">
        {
          contacts.length > 0 ? (
            <SetContactsButton campaignId={campaignId} contactsIds={contactsWithValidWhatsapp.map((c) => c.id)} />
          ) : (
            <p>No hay contactos seleccionados para esta campaña</p>
          )
        }
      </div>

    </div>
  )
}

function isValidWhatsappContact(contact: ContactDAOWithStage) {
  // Verifica que tenga chatwootId y que el teléfono comience con + seguido solo de dígitos
  return contact.chatwootId && 
         contact.phone && 
         contact.phone.startsWith("+") && 
         contact.phone.slice(1).match(/^\d+$/)
}
