import { RepoCard } from "@/app/admin/repositories/repo-card"
import { RepositoryDAO } from "@/services/repository-services"

type Props= {
  repositories: RepositoryDAO[]
}
export default function RepoGrid({ repositories }: Props) {

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 w-full mt-4">
      {
        repositories.map(repository => (
          <RepoCard key={repository.id} repository={repository} />
        ))
      }
    </div>
  )
}
