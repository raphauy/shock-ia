"use server"
  
import { revalidatePath } from "next/cache"
import { ProviderDAO, ProviderFormValues, createProvider, updateProvider, getFullProviderDAO, deleteProvider, getProvidersDAO } from "@/services/provider-services"


export async function getProviderDAOAction(id: string): Promise<ProviderDAO | null> {
    return getFullProviderDAO(id)
}

export async function getProvidersDAOAction(): Promise<ProviderDAO[]> {
    return getProvidersDAO()
}

export async function createOrUpdateProviderAction(id: string | null, data: ProviderFormValues): Promise<ProviderDAO | null> {       
    let updated= null
    if (id) {
        updated= await updateProvider(id, data)
    } else {
        updated= await createProvider(data)
    }     

    revalidatePath("/admin/providers")

    return updated as ProviderDAO
}

export async function deleteProviderAction(id: string): Promise<ProviderDAO | null> {    
    const deleted= await deleteProvider(id)

    revalidatePath("/admin/providers")

    return deleted as ProviderDAO
}

