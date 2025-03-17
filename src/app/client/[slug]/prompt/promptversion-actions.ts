"use server"
  
import { revalidatePath } from "next/cache"
import { PromptVersionDAO, PromptVersionFormValues, createPromptVersion, updatePromptVersion, deletePromptVersion, getPromptVersionDAO } from "@/services/prompt-version-services"
import { setPrompt } from "@/services/clientService"


export async function getPromptVersionDAOAction(id: string): Promise<PromptVersionDAO | null> {
    return getPromptVersionDAO(id)
}

export async function createOrUpdatePromptVersionAction(id: string | null, data: PromptVersionFormValues): Promise<PromptVersionDAO | null> {       
    let updated= null
    if (id) {
        updated= await updatePromptVersion(id, data)
    } else {
        updated= await createPromptVersion(data)
    }     

    revalidatePath("/admin/promptVersions")

    return updated as PromptVersionDAO
}

export async function deletePromptVersionAction(id: string): Promise<PromptVersionDAO | null> {    
    const deleted= await deletePromptVersion(id)

    revalidatePath("/admin/promptVersions")

    return deleted as PromptVersionDAO
}

export async function updatePromptAndCreateVersionAction(versionPrompt: PromptVersionFormValues) {

    await setPrompt(versionPrompt.content, versionPrompt.clientId)
    const newVersion= await createPromptVersion(versionPrompt)
    if (!newVersion) throw new Error("Error al crear la versión del prompt")

    revalidatePath(`/admin/config`)
    return newVersion
}

export async function updatePromptAction(versionPrompt: PromptVersionFormValues) {
    await setPrompt(versionPrompt.content, versionPrompt.clientId)
    revalidatePath(`/admin/config`)
    return true
}
