import { getDataClientBySlug } from "@/app/admin/clients/(crud)/actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CountData, getClientBySlug, getCountData } from "@/services/clientService"
import { getUsersOfClient } from "@/services/userService"
import { BookOpen, HomeIcon, MessageCircle, User } from "lucide-react"
import Link from "next/link"
import { getDataConversations, getTotalMessages } from "./chats/actions"

interface Props{
  countData: CountData
}
 
export default async function ClientData({ countData }: Props) {
 
  return (
    <div className="flex flex-col">
      <Link href={`/client/${countData.clientSlug}`}>
        <p className="mt-10 mb-5 text-3xl font-bold text-center">{countData.clientName}</p>
      </Link>
      <div className="grid grid-cols-1 gap-3 p-2 md:grid-cols-2 lg:grid-cols-3">

        <div className="flex flex-col items-center">
          <Link href={`/client/${countData.clientSlug}/documents`} className="h-full">
            <Card className="w-64 h-full">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">Documentos</CardTitle>
                <BookOpen className="text-gray-500" size={20} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{countData.documents}</div>
              </CardContent>
            </Card>
          </Link>
        </div>

        <div className="flex flex-col items-center">
          <Link href={`/client/${countData.clientSlug}/chats`}>
            <Card className="w-64">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">Conversaciones</CardTitle>
                <MessageCircle className="text-gray-500" size={20} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{countData.conversations}</div>
                <div className="flex justify-between">
                  <p className="text-xs text-muted-foreground">
                    {countData.messages} mensajes
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
        <div className="flex flex-col items-center">
          <Link href={`/client/${countData.clientSlug}/users`} className="h-full">
            <Card className="w-64 h-full">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">Usuarios</CardTitle>
                <User className="text-gray-500" size={20} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{countData.users}</div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  )
}
