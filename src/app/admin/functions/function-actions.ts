"use server"
  
import { revalidatePath } from "next/cache"
import { getCurrentUser } from "@/lib/auth"
import { FunctionDAO, FunctionFormValues, createFunction, updateFunction, deleteFunction, getFunctionDAO } from "@/services/function-services"


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

