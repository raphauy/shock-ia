import { getProvidersDAO } from "@/services/provider-services"
import { ProviderDialog } from "./provider-dialogs"
import { DataTable } from "./provider-table"
import { columns } from "./provider-columns"

export default async function ProviderPage() {
  
  const data= await getProvidersDAO()

  return (
    <div className="w-full">      

      <div className="flex justify-end mx-auto my-2">
        <ProviderDialog />
      </div>

      <div className="container bg-white p-3 py-4 mx-auto border rounded-md text-muted-foreground dark:text-white">
        <DataTable columns={columns} data={data} subject="Provider"/>      
      </div>
    </div>
  )
}
  
