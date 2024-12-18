"use server"
  
import { revalidatePath } from "next/cache"
import { ImportedContactDAO, ImportedContactFormValues, createImportedContact, updateImportedContact, getImportedContactDAO, deleteImportedContact } from "@/services/imported-contacts-services"

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

    revalidatePath("/crm/importedContacts")

    return updated as ImportedContactDAO
}

export async function deleteImportedContactAction(id: string): Promise<ImportedContactDAO | null> {    
    const deleted= await deleteImportedContact(id)

    revalidatePath("/crm/importedContacts")

    return deleted as ImportedContactDAO
}
    
