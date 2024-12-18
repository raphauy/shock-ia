"use server"
  
import { addContactsToCampaign, addTagToCampaign, CampaignDAO, CampaignFormValues, cancelCampaign, createCampaign, deleteCampaign, deleteScheduledCampaignContact, getCampaignDAO, processCampaign, processCampaignContact, removeAllContactsFromCampaign, removeTagFromCampaign, setCampaignContactStatus, setMessageToCampaign, setMoveToStageIdOfCampaign, updateCampaign } from "@/services/campaign-services"
import { CampaignContactStatus } from "@prisma/client"
import { revalidatePath } from "next/cache"


export async function getCampaignDAOAction(id: string): Promise<CampaignDAO | null> {
    return getCampaignDAO(id)
}

export async function createOrUpdateCampaignAction(id: string | null, data: CampaignFormValues): Promise<CampaignDAO | null> {       
    let updated= null
    if (id) {
        updated= await updateCampaign(id, data)
    } else {
        updated= await createCampaign(data)
    }     

    revalidatePath("/client/[slug]/crm", "page")

    return updated as CampaignDAO
}

export async function deleteCampaignAction(id: string): Promise<CampaignDAO | null> {    
    const deleted= await deleteCampaign(id)

    revalidatePath("/client/[slug]/crm", "page")

    return deleted as CampaignDAO
}

export async function setMessageToCampaignAction(campaignId: string, message: string): Promise<boolean> {
    const updated= await setMessageToCampaign(campaignId, message)
    
    revalidatePath("/client/[slug]/crm", "page")

    return updated !== null
}

export async function addContactsToCampaignAction(campaignId: string, contactIds: string[]) {
    const created= await addContactsToCampaign(campaignId, contactIds)

    revalidatePath("/client/[slug]/crm", "page")

    return created !== null
}

export async function removeAllContactsFromCampaignAction(campaignId: string) {
    const deleted= await removeAllContactsFromCampaign(campaignId)

    revalidatePath("/client/[slug]/crm", "page")

    return deleted !== null
}

export async function processCampaignContactAction(campaignContactId: string) {
    try {
        const processed= await processCampaignContact(campaignContactId)

        revalidatePath("/client/[slug]/crm", "page")

        return processed !== null
    } catch (error) {
        console.error("Error al procesar el contacto: ")
        if (error instanceof Error) {
            console.error("Error: ", error.message)
        }
        await setCampaignContactStatus(campaignContactId, CampaignContactStatus.ERROR)
        return false
    }
}

export async function processCampaignAction(campaignId: string) {
    const processed= await processCampaign(campaignId)

    revalidatePath("/client/[slug]/crm", "page")

    return processed !== null
}

export async function addTagToCampaignAction(campaignId: string, tag: string) {
    const updated= await addTagToCampaign(campaignId, tag)

    revalidatePath("/client/[slug]/crm", "page")

    return updated !== null
}

export async function removeTagFromCampaignAction(campaignId: string, tag: string) {
    const updated= await removeTagFromCampaign(campaignId, tag)

    revalidatePath("/client/[slug]/crm", "page")

    return updated !== null
}

export async function deleteScheduledCampaignContactAction(campaignContactId: string) {
    const cancelled= await deleteScheduledCampaignContact(campaignContactId)

    revalidatePath("/client/[slug]/crm", "page")

    return cancelled !== null
}

export async function cancelCampaignAction(campaignId: string) {
    const cancelled= await cancelCampaign(campaignId)

    revalidatePath("/client/[slug]/crm", "page")

    return cancelled !== null
}

export async function setMoveToStageIdOfCampaignAction(campaignId: string, moveToStageId: string | null): Promise<boolean> {
    console.log("setMoveToStageIdOfCampaignAction", campaignId, moveToStageId)
    const updated= await setMoveToStageIdOfCampaign(campaignId, moveToStageId)
    console.log("updated", updated)

    if (!updated) return false

    revalidatePath("/client/[slug]/crm", "page")

    return true
}