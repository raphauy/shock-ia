import { getNotificationsDAO } from "@/services/notification-services"
import { DataTable } from "./notification-table"
import { columns } from "./notification-columns"

export default async function NotificationPage() {
  
  const data= await getNotificationsDAO()

  return (
    <div className="w-full">      

      <div className="container bg-white p-3 py-4 mx-auto border rounded-md text-muted-foreground dark:text-white dark:bg-black">
        <DataTable columns={columns} data={data} subject="Notification"/>      
      </div>
    </div>
  )
}
  
