import { columns } from "@/app/admin/summits/summit-columns"
import { DataTable } from "@/app/admin/summits/summit-table"
import { getSummitsDAO } from "@/services/summit-services"

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
  
