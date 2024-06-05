import { getDataClientBySlug } from "@/app/admin/clients/(crud)/actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getClientBySlug, getCountData } from "@/services/clientService"
import { getUsersOfClient } from "@/services/userService"
import { BookOpen, HomeIcon, MessageCircle, User } from "lucide-react"
import Link from "next/link"
import { getDataConversations, getTotalMessages } from "./chats/actions"
import ClientData from "./client-data"

interface Props{
  params: {
    slug: string
  },
}
 
export default async function ClientPage({ params: { slug } }: Props) {

  
  const client= await getClientBySlug(slug)
  if (!client) return <div>Cliente no encontrado (p)</div>

  const countData= await getCountData(client?.id)
 
  return (<ClientData countData={countData} />)
}
