import { getContactsDAO } from "@/services/contact-services"
import { ContactDialog } from "./contact-dialogs"
import { DataTable } from "./contact-table"
import { columns } from "./contact-columns"
import { getClientBySlug } from "@/services/clientService"
import { notFound } from "next/navigation"

type Props= {
  params: { 
    slug: string 
  }
}

export default async function ContactPage({ params }: Props) {

  const slug= params.slug
  const client= await getClientBySlug(slug)
  if (!client) return notFound()

  const data= await getContactsDAO(client.id)

  return (
    <div className="w-full">      

      <div className="flex justify-end mx-auto my-2">
        <ContactDialog clientId={client.id} />
      </div>

      <div className="container bg-white p-3 py-4 mx-auto border rounded-md text-muted-foreground dark:text-white dark:bg-black">
        <DataTable columns={columns} data={data} subject="Contact"/>      
      </div>
    </div>
  )
}
  
