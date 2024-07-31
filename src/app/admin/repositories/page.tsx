import { getFullRepositorysDAO } from "@/services/repository-services"
import RepositoriesTabs from "./repo-tabs"
import { getCurrentUser } from "@/lib/auth"
import { notFound } from "next/navigation"

export default async function RepositoryPage() {

  const user= await getCurrentUser()
  if (user?.email !== "rapha.uy@rapha.uy") {
    return notFound()
  }
  
  const repositories= await getFullRepositorysDAO()

  return (
    <div className="w-full ml-4">

      <RepositoriesTabs repositories={repositories} />

    </div>
  )
}
