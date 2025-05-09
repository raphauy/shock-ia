import { getNotificationsDAO } from "@/services/notification-services"
import { DataTable } from "./notification-table"
import { columns } from "./notification-columns"
import { getClientBySlug } from "@/services/clientService"

type Props = {
  params: Promise<{
    slug: string
  }>
}

export default async function NotificationPage(props: Props) {
  const params = await props.params;

  const client = await getClientBySlug(params.slug)
  if (!client) {
    return <div>Cliente no encontrado</div>
  }

  const data= await getNotificationsDAO(client.id)

  return (
    <div className="w-full">      

      <div className="container bg-white p-3 py-4 mx-auto border rounded-md text-muted-foreground dark:text-white dark:bg-black">
        <DataTable columns={columns} data={data} subject="Notification"/>      
      </div>
    </div>
  )
}
  
