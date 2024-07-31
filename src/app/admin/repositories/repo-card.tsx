import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { RepositoryDAO } from "@/services/repository-services"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"
import { Briefcase, CalendarIcon, UsersIcon } from "lucide-react"
import Link from "next/link"

type Props= {
  repository: RepositoryDAO
}


export function RepoCard({ repository }: Props) {
  const color = repository.color
  const clientesStr= repository.function.clients.length === 0 ? 
  "ninguno" : 
  repository.function.clients.length === 1 ? 
  `1 cliente` : 
  `${repository.function.clients.length} clientes`
  
  return (
    <Link href={`/admin/repositories/${repository.id}`} prefetch={false} className="w-full max-w-lg">
      <Card className="w-full max-w-lg">
        <CardHeader
          className={`flex flex-col items-start gap-2 p-4 rounded-t-lg h-[130px]`}
          style={{
            background: `linear-gradient(45deg, ${color} 25%, ${color} 50%, ${color} 75%, ${color} 100%)`,
          }}
        >
          <CardTitle className="text-white">{repository.name}</CardTitle>
          <CardDescription className="text-white line-clamp-3">
            {repository.functionDescription}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CalendarIcon className="w-4 h-4" />
            <span>actualizado {formatDistanceToNow(repository.updatedAt, { locale: es })}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Briefcase className="w-4 h-4 mb-1" />
            {clientesStr}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
