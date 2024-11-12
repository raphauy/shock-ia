"use server"

import { addTag, removeTag } from "@/services/clientService"
import { revalidatePath } from "next/cache"

export async function addTagAction(clientId: string, tag: string) {
    const updated= await addTag(clientId, tag)

    revalidatePath(`/client/[slug]/crm/tags`, "page")

    return updated
}

export async function removeTagAction(clientId: string, tag: string) {
    const updated= await removeTag(clientId, tag)

    revalidatePath(`/client/[slug]/crm/tags`, "page")

    return updated
}