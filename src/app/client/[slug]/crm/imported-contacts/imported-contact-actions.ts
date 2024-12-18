"use server"
  
import { ImportedContactDAO, ImportedContactFormValues, createImportedContact, deleteImportedContact, fireProcessPendingContactsAPI, getImportedContactDAO, updateImportedContact } from "@/services/imported-contacts-services"
import { revalidatePath } from "next/cache"

export async function getImportedContactDAOAction(id: string): Promise<ImportedContactDAO | null> {
    return getImportedContactDAO(id)
}

export async function createOrUpdateImportedContactAction(id: string | null, data: ImportedContactFormValues): Promise<ImportedContactDAO | null> {       
    let updated= null
    if (id) {
        updated= await updateImportedContact(id, data)
    } else {
        updated= await createImportedContact(data)
    }

    fireProcessPendingContactsAPI()

    // sleep 2 seconds
    await new Promise(resolve => setTimeout(resolve, 2000));

    revalidatePath("/crm/importedContacts")

    return updated as ImportedContactDAO
}

export async function deleteImportedContactAction(id: string): Promise<ImportedContactDAO | null> {    
    const deleted= await deleteImportedContact(id)

    revalidatePath("/crm/importedContacts")

    return deleted as ImportedContactDAO
}
    
