import { getConfigsDAO } from "@/services/config-services"
import { ConfigDialog } from "./config-dialogs"
import { DataTable } from "./config-table"
import { columns } from "./config-columns"
import { getCurrentUser } from "@/lib/auth"
import APIToken from "../config/api-token"

export default async function ConfigsPage() {
  let data = await getConfigsDAO()

  const user= await getCurrentUser()
  const isSuperAdmin= user?.email === "rapha.uy@rapha.uy" || user?.email === "gilberto@osomdigital.com"
  if (!isSuperAdmin) {
    data= data.filter((item) => item.name !== "PROCESS_BLOCKED")
  }

  const API_TOKEN= process.env.API_TOKEN || "No configurado"

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mx-auto my-2 font-bold">
        <p>Esta configuración aplica a todos los clientes:</p>
        {
          isSuperAdmin && <ConfigDialog />
        }
      </div>

      <div className="container p-3 py-4 mx-auto border rounded-md text-muted-foreground dark:text-white">
        <DataTable columns={columns} data={data} subject="Config" />
      </div>

      <div className="mt-14">
        <APIToken apiToken={API_TOKEN} />
      </div>


    </div>
  );
}
