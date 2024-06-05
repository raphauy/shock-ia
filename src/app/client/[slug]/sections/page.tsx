import { getSectionsDAO } from "@/services/section-services"
import { SectionDialog } from "./section-dialogs"
import { DataTable } from "./section-table"
import { columns } from "./section-columns"

export default async function UsersPage() {
  
  const data= await getSectionsDAO()

  return (
    <div className="w-full">      

      <div className="flex justify-end mx-auto my-2">
        <SectionDialog />
      </div>

      <div className="container p-3 py-4 mx-auto border rounded-md text-muted-foreground dark:text-white">
        <DataTable columns={columns} data={data} subject="Section"/>      
      </div>
    </div>
  )
}
  
