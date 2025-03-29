import { getRemindersDAO } from "@/services/reminder-services"
import { columns } from "./reminder-columns"
import { ReminderDialog } from "./reminder-dialogs"
import { DataTable } from "./reminder-table"
import { getContactsDAO } from "@/services/contact-services"
import { getClientIdBySlug } from "@/services/clientService"
import { getReminderDefinitionsDAO } from "@/services/reminder-definition-services"

type Props= {
  params: {
    slug: string
  },
}
export default async function ReminderPage({ params }: Props) {
  const clientSlug= params.slug
  const clientId= await getClientIdBySlug(clientSlug)
  if (!clientId) {
    return <div>Cliente no encontrado</div>
  }
  const data= await getRemindersDAO(clientId)
  const contacts= await getContactsDAO(clientId)
  const reminderDefinitions= await getReminderDefinitionsDAO(clientId, true)
  return (
    <div className="w-full">      

      <div className="flex justify-between mx-auto my-4 text-center">
        <p className="text-2xl font-bold">Recordatorios</p>
        <ReminderDialog contacts={contacts} reminderDefinitions={reminderDefinitions} />
      </div>

      <div className="container bg-white p-3 py-4 mx-auto border rounded-md text-muted-foreground dark:text-white dark:bg-black">
        <DataTable columns={columns} data={data} subject="Recordatorio"/>      
      </div>
    </div>
  )
}
  
