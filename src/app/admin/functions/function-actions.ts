"use server"
  
import { FunctionDAO, FunctionFormValues, SimpleFunction, createFunction, deleteFunction, getFunctionDAO, getFunctionsWithRepo, getTagsOfFunction, setTagsOfFunction, updateFunction } from "@/services/function-services"
import { revalidatePath } from "next/cache"


export async function getFunctionDAOAction(id: string): Promise<FunctionDAO | null> {
    return getFunctionDAO(id)
}

export async function createOrUpdateFunctionAction(id: string | null, data: FunctionFormValues): Promise<FunctionDAO | null> {
    try {
        data.definition && JSON.parse(data.definition)
    } catch (error: any) {
        throw new Error("La definición no es un objeto JSON válido.")
    }
    let updated= null
    if (id) {
        updated= await updateFunction(id, data)
    } else {
        updated= await createFunction(data)
    }     

    revalidatePath("/admin/functions")

    return updated as FunctionDAO
}

export async function deleteFunctionAction(id: string): Promise<FunctionDAO | null> {    
    const deleted= await deleteFunction(id)

    revalidatePath("/admin/functions")

    return deleted as FunctionDAO
}

export async function getFunctionsWithRepoAction(clientId: string): Promise<SimpleFunction[]> {
    return getFunctionsWithRepo(clientId)
}

export async function getTagsOfFunctionAction(functionId: string) {
    return getTagsOfFunction(functionId)
}

export async function setTagsOfFunctionAction(functionId: string, tags: string[]) {
    const res= await setTagsOfFunction(functionId, tags)

    revalidatePath("/admin/tags")

    return res
}