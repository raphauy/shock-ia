import { getCarServicesDAO } from "@/services/carservice-services"
import { CarServiceDialog } from "./carservice-dialogs"
import { DataTable } from "./carservice-table"
import { columns } from "./carservice-columns"

export default async function CarServicePage() {

  const data= await getCarServicesDAO()

  return (
    <div className="w-full">      

      <div className="flex justify-end mx-auto my-2">
        <CarServiceDialog />
      </div>

      <div className="container p-3 py-4 mx-auto bg-white border rounded-md text-muted-foreground dark:text-white">
        <DataTable columns={columns} data={data} subject="CarService" />
      </div>
    </div>
  )
}
  
