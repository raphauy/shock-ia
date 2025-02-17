"use server"

import { ClientUserFormValues, createClientUser, deleteUser, getClientUsersDAO, getUserDAO, updateClientUser } from "@/services/user-service";
import { revalidatePath } from "next/cache";

export async function getClientUsersAction(clientId: string) {
    const users = await getClientUsersDAO(clientId)
    return users
}

export async function getUserDAOAction(id: string) {
    const user = await getUserDAO(id)
    return user
}

export async function createOrUpdateClientUserAction(id: string | null, data: ClientUserFormValues) {
    let updated= null
    if (id) {
        updated= await updateClientUser(id, data)
    } else {
        updated= await createClientUser(data)
    }

    revalidatePath("/client/[slug]/crm", "page")
    
    return updated
}

export async function deleteClientUserAction(id: string) {
    const deleted= await deleteUser(id)
    revalidatePath("/client/[slug]/crm", "page")
    return deleted
}