"use server"
  
import { revalidatePath } from "next/cache"
import { CampaignDAO, CampaignFormValues, createCampaign, updateCampaign, getCampaignDAO, deleteCampaign, setMessageToCampaign } from "@/services/campaign-services"


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