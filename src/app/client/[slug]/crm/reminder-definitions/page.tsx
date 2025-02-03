import { getReminderDefinitionsDAO } from "@/services/reminder-definition-services"
import { ReminderDefinitionDialog } from "./reminderdefinition-dialogs"
import { DataTable } from "./reminderdefinition-table"
import { columns } from "./reminderdefinition-columns"
import { getClientBySlug } from "@/services/clientService"
import { notFound } from "next/navigation"
import { ReminderDefinitionList } from "./reminder-definition-list"

type Props= {
  params: {
    slug: string
  }
}

export default async function ReminderDefinitionPage({ params }: Props) {
  const clientSlug= params.slug
  const client= await getClientBySlug(clientSlug)
  if (!client) {
    return notFound()
  }
  const clientId= client.id
  const data= await getReminderDefinitionsDAO(clientId)

  return (
    <div className="w-full">      

      <div className="flex justify-end mx-auto my-2">
        <ReminderDefinitionDialog clientId={clientId}/>
      </div>

      <ReminderDefinitionList reminderDefinitions={data}/>

      {/* <div className="container bg-white p-3 py-4 mx-auto border rounded-md text-muted-foreground dark:text-white dark:bg-black">
        <DataTable columns={columns} data={data} subject="ReminderDefinition"/>      
      </div> */}
    </div>
  )
}
  
