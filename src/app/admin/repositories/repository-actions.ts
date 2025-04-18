"use server"
  
import { checkValidPhone } from "@/lib/utils"
import { addFunctionToClient, getFunctionDAO, removeFunctionFromClient, setAssignToComercial, setMoveToStageIdOfClientFunction, setNotifyPhones } from "@/services/function-services"
import { RepositoryDAO, createRepository, deleteRepository, getFullRepositoryDAO, setConversationLLMOff, setFinalMessage, setFunctionActive, setFunctionDescription, setFunctionName, setLLMOffMessage, setName, setNotifyExecution, setWebHookUrl } from "@/services/repository-services"
import { revalidatePath } from "next/cache"


export async function getRepositoryDAOAction(id: string): Promise<RepositoryDAO | null> {
    return getFullRepositoryDAO(id)
}

export async function createRepositoryAction(name: string): Promise<RepositoryDAO | null> {       
    try {
        const created = await createRepository(name)
        revalidatePath("/admin/repositories")
        return created as RepositoryDAO
    } catch (error: any) {
        // Propagamos el error original para que se pueda mostrar en la UI
        throw error
    }
}

export async function deleteRepositoryAction(id: string): Promise<RepositoryDAO | null> {    
    const deleted= await deleteRepository(id)

    revalidatePath("/admin/repositories")

    return deleted as RepositoryDAO
}

export async function setNameAction(id: string, name: string): Promise<boolean> {
    const updated= await setName(id, name)

    if (!updated) return false

    revalidatePath(`/admin/repositories/${updated.id}`)

    return true
}

export async function setFunctionNameAction(id: string, functionName: string): Promise<boolean> {
    const updated= await setFunctionName(id, functionName)

    if (!updated) return false

    revalidatePath(`/admin/repositories/${updated.id}`)

    return true
}

export async function setFunctionDescriptionAction(id: string, functionDescription: string): Promise<boolean> {
    const updated= await setFunctionDescription(id, functionDescription)

    if (!updated) return false

    revalidatePath(`/admin/repositories/${updated.id}`)

    return true
}   

export async function setFinalMessageAction(id: string, finalMessage: string): Promise<boolean> {
    const updated= await setFinalMessage(id, finalMessage)

    if (!updated) return false

    revalidatePath(`/admin/repositories/${updated.id}`)

    return true
}

export async function setLLMOffMessageAction(id: string, llmOffMessage: string): Promise<boolean> {
    const updated= await setLLMOffMessage(id, llmOffMessage)

    if (!updated) return false

    revalidatePath(`/admin/repositories/${updated.id}`)

    return true
}

export async function setNotifyExecutionAction(id: string, notifyExecution: boolean): Promise<boolean> {
    const updated= await setNotifyExecution(id, notifyExecution)

    if (!updated) return false

    revalidatePath(`/admin/repositories/${updated.id}`)

    return true
}

export async function setConversationLLMOffAction(id: string, conversationLLMOff: boolean): Promise<boolean> {
    const updated= await setConversationLLMOff(id, conversationLLMOff)

    if (!updated) return false

    revalidatePath(`/admin/repositories/${updated.id}`)

    return true
}

export async function setFunctionActiveAction(id: string, functionActive: boolean): Promise<boolean> {
    const updated= await setFunctionActive(id, functionActive)

    if (!updated) return false

    revalidatePath(`/admin/repositories/${updated.id}`)

    return true
}

export async function setWebHookUrlAction(clientId: string, functionId: string, webHookUrl: string): Promise<boolean> {
    const updated= await setWebHookUrl(clientId, functionId, webHookUrl)

    if (!updated) return false

    revalidatePath(`/admin/repositories`)

    return true
}

export async function addFunctionToClientAction(clientId: string, functionId: string, repoId: string): Promise<boolean> {
    const ok= await addFunctionToClient(clientId, functionId)

    if (!ok) return false

    const repoFunction= await getFunctionDAO(functionId)
    if (!repoFunction) throw new Error("Función no encontrada")

    revalidatePath(`/admin/repositories/${repoId}`)

    return true
}

export async function removeFunctionFromClientAction(clientId: string, functionId: string, repoId: string): Promise<boolean> {
    const ok= await removeFunctionFromClient(clientId, functionId)

    if (!ok) return false

    const repoFunction= await getFunctionDAO(functionId)
    if (!repoFunction) throw new Error("Función no encontrada")

    revalidatePath(`/admin/repositories/${repoId}`)

    return true
}

export async function setMoveToStageIdOfClientFunctionAction(clientId: string, functionId: string, moveToStageId: string): Promise<boolean> {
    const updated= await setMoveToStageIdOfClientFunction(clientId, functionId, moveToStageId)

    if (!updated) return false

    revalidatePath(`/admin/repositories`)

    return true
}

export async function setNotifyPhonesAction(clientId: string, functionId: string, notifyPhones: string): Promise<boolean> {
    const notifyPhonesArray= notifyPhones.split(",").map(phone => phone.trim())
    // if a phone do not have a +, add it
    for (let i = 0; i < notifyPhonesArray.length; i++) {
        if (!notifyPhonesArray[i].startsWith("+")) {
            notifyPhonesArray[i]= "+" + notifyPhonesArray[i]
        }
    }
    // check if all phones are valid
    for (const phone of notifyPhonesArray) {
        console.log("checking phone: ", phone)
        if (!checkValidPhone(phone))
            throw new Error("Teléfono inválido: " + phone)
    }
    const updated= await setNotifyPhones(clientId, functionId, notifyPhonesArray)

    if (!updated) return false

    revalidatePath(`/admin/repositories`)

    return true
}

export async function setAssignToComercialAction(clientId: string, functionId: string, assignToComercial: boolean): Promise<boolean> {
    const updated= await setAssignToComercial(clientId, functionId, assignToComercial)

    if (!updated) return false

    revalidatePath(`/admin/repositories`)

    return true
}