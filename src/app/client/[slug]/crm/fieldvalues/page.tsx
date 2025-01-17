import { getFieldValuesDAO } from "@/services/fieldvalue-services"
import { FieldValueDialog } from "./fieldvalue-dialogs"
import { DataTable } from "./fieldvalue-table"
import { columns } from "./fieldvalue-columns"

export default async function FieldValuePage() {
  
  const data= await getFieldValuesDAO()

  return (
    <div className="w-full">      

      <div className="container bg-white p-3 py-4 mx-auto border rounded-md text-muted-foreground dark:text-white dark:bg-black">
        <DataTable columns={columns} data={data} subject="FieldValue"/>      
      </div>
    </div>
  )
}
  
