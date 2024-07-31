"use server"
  
import { revalidatePath } from "next/cache"
import { createRepoData, updateRepoData, getFullRepoDataDAO, deleteRepoData, RepoDataDAO } from "@/services/repodata-services"


export async function getRepoDataDAOAction(id: string): Promise<RepoDataDAO | null> {
    return getFullRepoDataDAO(id)
}


export async function deleteRepoDataAction(id: string): Promise<RepoDataDAO | null> {    
    const deleted= await deleteRepoData(id)

    revalidatePath("/client/[slug]/repo-data", "page")

    return deleted as RepoDataDAO
}

