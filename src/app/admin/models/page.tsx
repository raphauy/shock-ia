import { getModelsDAO } from "@/services/model-services"
import { ModelDialog } from "./model-dialogs"
import { DataTable } from "./model-table"
import { columns } from "./model-columns"

export default async function ModelPage() {
  
  const data= await getModelsDAO()

  return (
    <div className="w-full">      

      <div className="flex justify-end mx-auto my-2">
        <ModelDialog />
      </div>

      <div className="container bg-white p-3 py-4 mx-auto border rounded-md text-muted-foreground dark:text-white">
        <DataTable columns={columns} data={data} subject="Model"/>      
      </div>
    </div>
  )
}
  
