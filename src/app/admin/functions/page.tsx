import { getFunctionsDAO } from "@/services/function-services"
import { FunctionDialog } from "./function-dialogs"
import { DataTable } from "./function-table"
import { columns } from "./function-columns"
import { getCurrentUser } from "@/lib/auth"

export default async function UsersPage() {
  
  const data= await getFunctionsDAO()

  const currentUser= await getCurrentUser()
  const isRapha= currentUser?.email === "rapha.uy@rapha.uy"

  return (
    <div className="w-full">      

      {isRapha &&
      <div className="flex justify-end mx-auto my-2">
        <FunctionDialog isAdmin={isRapha} />
      </div>
      }

      <div className="container p-3 py-4 mx-auto border rounded-md text-muted-foreground dark:text-white">
        <DataTable columns={columns} data={data} subject="Function" />      
      </div>
    </div>
  )
}
  
