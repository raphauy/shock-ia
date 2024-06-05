import { getSummitsDAO } from "@/services/summit-services"
import { SummitDialog } from "./summit-dialogs"
import { DataTable } from "./summit-table"
import { columns } from "./summit-columns"

export default async function UsersPage() {
  
  const data= await getSummitsDAO()

  return (
    <div className="w-full">      

      <div className="container p-3 py-4 mx-auto border rounded-md text-muted-foreground dark:text-white">
        <DataTable columns={columns} data={data} subject="Summit"/>      
      </div>
    </div>
  )
}
  
