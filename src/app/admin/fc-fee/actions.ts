"use server";

import { setFCImplementation } from "@/services/clientService";
import { revalidatePath } from "next/cache";
import { FunctionDAO, getClientFunctions } from "@/services/function-services";
import { RepositoryDAO } from "@/services/repository-services";

export async function toggleFCImplementationAction(clientId: string, fcImplemented: boolean) {
  try {
    await setFCImplementation(clientId, fcImplemented);
    
    // Revalidamos la ruta de la página de FC Fee para que se actualice automáticamente
    revalidatePath('/admin/fc-fee');
    
    return { success: true };
  } catch (error) {
    console.error("Error actualizando el estado de implementación FC:", error);
    return { success: false, error: "Error al actualizar el estado de implementación FC" };
  }
}

interface FunctionInfo {
  name: string;
  description: string | null;
  repositoryCount: number;
  repositories: {
    name: string;
    url: string;
  }[];
}

export async function getClientFunctionsAction(clientId: string): Promise<FunctionInfo[]> {
  try {
    const clientFunctions = await getClientFunctions(clientId);
    
    // Transformar los datos para enviar información de repositorios
    const functionsWithRepos = clientFunctions.map(cf => {
      const func = cf.function as FunctionDAO;
      const repositories = func.repositories || [];
      
      return {
        name: func.name,
        description: func.description,
        repositoryCount: repositories.length,
        repositories: repositories.map((repo: RepositoryDAO) => ({
          name: repo.name,
          url: repo.id // Usamos el ID como URL por ahora
        }))
      };
    });
    
    return functionsWithRepos;
  } catch (error) {
    console.error("Error obteniendo las funciones del cliente:", error);
    return [];
  }
} 