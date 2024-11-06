"use server"
  
import { revalidatePath } from "next/cache"
import { ContactDAO, ContactFormValues, createContact, updateContact, getContactDAO, deleteContact, getContactsByStage, updateStageContacts } from "@/services/contact-services"

export async function getContactDAOAction(id: string): Promise<ContactDAO | null> {
    return getContactDAO(id)
}

export async function createOrUpdateContactAction(id: string | null, data: ContactFormValues): Promise<ContactDAO | null> {       
    let updated= null
    if (id) {
        updated= await updateContact(id, data)
    } else {
        updated= await createContact(data)
    }     

    revalidatePath("/client/[slug]/crm", "page")

    return updated as ContactDAO
}

export async function deleteContactAction(id: string): Promise<ContactDAO | null> {    
    const deleted= await deleteContact(id)

    revalidatePath("/client/[slug]/crm", "page")

    return deleted as ContactDAO
}

export async function getContactsByStageAction(stageId: string) {
    return getContactsByStage(stageId)
}

export async function updateStageContactsAction(contacts: ContactDAO[]) {
    const updated= await updateStageContacts(contacts)

    revalidatePath("/client/[slug]/crm", "page")

    return updated
}