"use server"
  
import { revalidatePath } from "next/cache"
import { CampaignDAO, CampaignFormValues, createCampaign, updateCampaign, getCampaignDAO, deleteCampaign, setMessageToCampaign, addContactsToCampaign, removeAllContactsFromCampaign, processCampaignContact, processCampaign } from "@/services/campaign-services"


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
    const processed= await processCampaignContact(campaignContactId)

    revalidatePath("/client/[slug]/crm", "page")

    return processed !== null
}

export async function processCampaignAction(campaignId: string) {
    const processed= await processCampaign(campaignId)

    revalidatePath("/client/[slug]/crm", "page")

    return processed !== null
}