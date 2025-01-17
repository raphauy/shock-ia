import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth";
import { getClientBySlug, getClientIdBySlug, getClientsCount, getLastClient, getLastClientId } from "@/services/clientService";
import { getDocumentsCount } from "@/services/document-services";
import getUsers from "@/services/userService";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { BookOpen, Briefcase, Settings, User } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

type Props= {
  searchParams: {
    slug: string
  }
}

export default async function AdminPage({searchParams}: Props) {
  const slug= searchParams.slug
  const users= await getUsers()
  const clientsCount= await getClientsCount()
  const documentsCount= await getDocumentsCount()

  const user= await getCurrentUser()
  console.log(format(new Date(), "MM-dd HH:mm:ss", {locale: es}), user?.name, "(admin page)")    

  let targetClientId= null
  if (slug) {
    targetClientId= await getClientIdBySlug(slug)
  }

  if (targetClientId) {
    redirect(`/admin/config?clientId=${targetClientId}`)
  } else {    
    targetClientId= await getLastClientId()
  }



  return (
    <div className="flex flex-col">
      <p className="mt-10 mb-5 text-3xl font-bold text-center">Admin Dashboard</p>
      <div className="grid grid-cols-1 gap-3 p-2 md:grid-cols-2 lg:grid-cols-3">
        <div className="flex flex-col items-center">
          <Link href="/admin/clients" className="h-full">
            <Card className="w-64 h-full">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">Clientes</CardTitle>
                <Briefcase className="text-gray-500" size={20} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{clientsCount}</div>
              </CardContent>
            </Card>
          </Link>
        </div>
        <div className="flex flex-col items-center">
          <Link href="/admin/documents" className="h-full">
            <Card className="w-64 h-full">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">Documentos</CardTitle>
                <BookOpen className="text-gray-500" size={20} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{documentsCount}</div>
              </CardContent>
            </Card>
          </Link>
        </div>          
        <div className="flex flex-col items-center">
          <Link href="/admin/users">
            <Card className="w-64">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">Usuarios</CardTitle>
                <User className="text-gray-500" size={20} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{users.length}</div>
                <div className="flex justify-between">
                    <p className="text-xs text-muted-foreground">
                      admin ({users.filter(user => user.role === "admin").length})
                    </p>
                    <p className="text-xs text-muted-foreground">
                      shock ({users.filter(user => user.role === "osom").length})
                    </p>
                    <p className="text-xs text-muted-foreground">
                      cliente ({users.filter(user => user.role === "cliente").length})
                    </p>
                </div>
                <div className="flex justify-between">
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
      <Link href={`/admin/config?clientId=${targetClientId}`} className="mt-10 text-center">
        <Button variant="link" className="space-x-2"><Settings /><p>Configuración</p></Button>
      </Link>

    </div>
  )
}
