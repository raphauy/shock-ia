import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import getSession from "@/lib/auth"
import { BookOpen, HomeIcon, MessageCircle, User } from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation"
import { getDataClientOfUser, getDataClients } from "./admin/clients/(crud)/actions"
import { getCountDataOfAllClients } from "@/services/clientService"
import ClientData from "./client/[slug]/client-data"

export const maxDuration = 99
export const dynamic = 'force-dynamic'

export default async function Home() {
  const session= await getSession()

  if (!session) return redirect("/login")

  const user= session.user

  console.log("user: ", user.email)  

  if (user.role !== 'admin' && user.role !== 'cliente')
    return redirect("/unauthorized?message=No estas autorizado a acceder a esta página, contacta con los administradores de OsomGPT")

  if (user.role === "cliente") {
    const client= await getDataClientOfUser(user.id)
    if (!client) return <div>Usuario sin cliente asignado</div>
    
    return redirect(`/client/${client.slug}`)
  }

  const countData= await getCountDataOfAllClients()


  return (
    <div className="flex flex-col">
      {
        countData.map(data => <ClientData key={data.clientSlug} countData={data} />)       
      }
    </div>
  )
}
