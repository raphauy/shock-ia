"use server"

import { addFunctionToClient } from "@/services/function-services"
import { RepositoryDAO, createRepository } from "@/services/repository-services"
import { revalidatePath } from "next/cache"

export async function createRepositoryAndAssociateAction(name: string, clientId: string): Promise<RepositoryDAO | null> {
    // Primero creamos el repositorio
    const created = await createRepository(name)
    
    if (!created) return null
    
    // Luego asociamos la función del repositorio al cliente
    try {
        await addFunctionToClient(clientId, created.functionId)
        
        // Revalidamos los paths para actualizar la UI
        revalidatePath(`/admin/config`)
        revalidatePath(`/admin/repositories`)
        
        return created as RepositoryDAO
    } catch (error) {
        console.error("Error al asociar la función al cliente:", error)
        // Si hay un error, devolvemos null
        return null
    }
} 