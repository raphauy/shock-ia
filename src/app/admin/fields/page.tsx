import { getFullFieldsDAO } from "@/services/field-services"
import { columns } from "./field-columns"
import { DataTable } from "./field-table"

export default async function FieldPage() {
  
  const data= await getFullFieldsDAO()

  return (
    <div className="w-full">      

      <div className="container bg-white p-3 py-4 mx-auto border rounded-md text-muted-foreground dark:text-white dark:bg-black">
        <DataTable columns={columns} data={data} subject="Field"/>      
      </div>
    </div>
  )
}
  
