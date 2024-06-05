"use server"
  
import { ModelDAO, ModelFormValues, createModel, deleteModel, getFullModelDAO, getFullModelDAOByName, getModelsDAO, getSimilarModels, updateModel } from "@/services/model-services"
import { revalidatePath } from "next/cache"


export async function getModelDAOAction(id: string): Promise<ModelDAO | null> {
    return getFullModelDAO(id)
}

export async function getModelDAOActionByName(name: string): Promise<ModelDAO | null> {
    return getFullModelDAOByName(name)
}

export async function getModelsDAOAction(): Promise<ModelDAO[]> {
    return getModelsDAO()
}

export async function getSimilarModelsAction(modelId: string): Promise<ModelDAO[]> {
    return getSimilarModels(modelId)
}


export async function createOrUpdateModelAction(id: string | null, data: ModelFormValues): Promise<ModelDAO | null> {       
    let updated= null
    if (id) {
        updated= await updateModel(id, data)
    } else {
        updated= await createModel(data)
    }     

    revalidatePath("/admin/models")

    return updated as ModelDAO
}

export async function deleteModelAction(id: string): Promise<ModelDAO | null> {    
    const deleted= await deleteModel(id)

    revalidatePath("/admin/models")

    return deleted as ModelDAO
}

