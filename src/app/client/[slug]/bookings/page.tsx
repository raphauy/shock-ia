import { getFullBookingsDAO } from "@/services/booking-services"
import { BookingDialog } from "./booking-dialogs"
import { DataTable } from "./booking-table"
import { columns } from "./booking-columns"

type Props = {  
  params: Promise<{
    slug: string
  }>
}

export default async function BookingPage(props: Props) {
  const params = await props.params;

  const data= await getFullBookingsDAO(params.slug)

  return (
    <div className="w-full">      

      <div className="container bg-white p-3 py-4 mx-auto border rounded-md text-muted-foreground dark:text-white dark:bg-black">
        <DataTable columns={columns} data={data} subject="Booking"/>      
      </div>
    </div>
  )
}
  
