import { getClientBySlug } from "@/services/clientService"
import { getClientUsersDAO } from "@/services/user-service"
import ClientUserList from "./client-user-list"
import { Users } from "lucide-react"
import { ClientUserDialog } from "./client-user-dialogs"

type Props = {
    params: Promise<{
      slug: string
    }>
}
  
export default async function UsersPage(props: Props) {
  const params = await props.params;
  const slug= params.slug
  const client= await getClientBySlug(slug)
  if (!client) {
    return <div>Client not found</div>
  }
  const data= await getClientUsersDAO(client.id)
  if (data.length === 0) {
    return <div className="mx-10">{getEmptyClientUsersComponent(client.id)}</div>
  }

  return (
    <div className="w-full max-w-lg mx-auto">      
      <p className="text-3xl font-bold my-2 text-center">Usuarios</p>
      <ClientUserList users={data} />
      <div className="flex justify-end mx-auto my-2">
        <ClientUserDialog clientId={client.id} />
      </div>
    </div>
  )
}

function getEmptyClientUsersComponent(clientId: string) {
    return (
        <div className="w-full max-w-5xl mx-auto py-12">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center bg-muted">
            <div className="mb-6 flex justify-center">
              <Users className="h-16 w-16 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              Aún no hay usuarios de rol cliente
            </h3>
            <p className="text-gray-500 mb-6">
              Comienza agregando tu primer usuario de rol cliente
            </p>
            <ClientUserDialog clientId={clientId} />
          </div>
        </div>
      )
    }
    