import { getDataClientBySlug, getDataClientOfUser } from "@/app/admin/clients/(crud)/actions";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import SideBar from "./side-bar";
import { getClientsOfFunctionByName, getClientsWithSomeFunctionWithRepository } from "@/services/function-services";
import { getFullModelDAO, getFullModelsDAO } from "@/services/model-services";
import { ModelSelector, SelectorData } from "@/components/header/model-selector";
import { TooltipProvider } from "@/components/ui/tooltip";

type Props= {
  children: React.ReactNode
  params: {
    slug: string
  }
}

export default async function SlugLayout({ children, params }: Props) {
  const currentUser = await getCurrentUser()
  const slug = params.slug

  if (!currentUser) {
    return redirect("/unauthorized?message=" + encodeURIComponent("Deberías estar logueado."))
  }

  if (currentUser.role !== 'admin' && currentUser.role !== 'cliente' && currentUser.role !== 'osom')
    return redirect("/unauthorized?message=No estas autorizado a acceder a esta página, contacta con los administradores de OsomGPT")

  let client= null
  if (currentUser.role === "admin" || currentUser.role === "osom") {
    client = await getDataClientBySlug(slug)
  } else if (currentUser.role === "cliente") {   
    client= await getDataClientOfUser(currentUser.id)    
  }
  if (!client) 
    return <div>Cliente no encontrado (l)</div>
  
  if (slug !== client.slug)
    return redirect("/unauthorized?message=No tienes permisos para ver este cliente.")

  const clientsOfNarvaez= await getClientsOfFunctionByName("registrarPedido")
  const showRegistro= clientsOfNarvaez.map(c => c.slug).includes(slug)

  const clientsOfCarServices= await getClientsOfFunctionByName("reservarServicio") 
  const showCarServices= clientsOfCarServices.map(c => c.slug).includes(slug)

  const clientsWithRepo= await getClientsWithSomeFunctionWithRepository()
  const showRepoData= clientsWithRepo.map(c => c.slug).includes(slug)

  return (
    <>
      <div className="flex flex-grow w-full">
        <SideBar slug={slug} showRegistro={showRegistro} showCarServices={showCarServices} showRepoData={showRepoData} repoLabel="Registros" />
        <div className="flex flex-col items-center flex-grow p-1">
          <TooltipProvider>
            {children}
          </TooltipProvider>
        </div>
      </div>
    </>
  )
}
