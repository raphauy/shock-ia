import { getDataClientBySlug, getDataClientOfUser } from "@/app/admin/clients/(crud)/actions";
import { TooltipProvider } from "@/components/ui/tooltip";
import { getCurrentUser } from "@/lib/auth";
import { getClientsOfFunctionByName, getClientsWithSomeFunctionWithRepository } from "@/services/function-services";
import { redirect } from "next/navigation";
import React from "react";
import SideBar from "./side-bar";

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
    return redirect("/unauthorized?message=" + encodeURIComponent("No estas autorizado a acceder a esta página, contacta con los administradores de Shock IA"))

  let client= null
  if (currentUser.role === "admin" || currentUser.role === "osom") {
    client = await getDataClientBySlug(slug)
  } else if (currentUser.role === "cliente") {   
    client= await getDataClientOfUser(currentUser.id)    
  }
  if (!client) 
    return <div>Cliente no encontrado (l)</div>
  
  if (slug !== client.slug)
    return redirect("/unauthorized?message=" + encodeURIComponent("No tienes permisos para ver este cliente."))

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
        {/* <CRMSideBar slug={slug} /> */}
        <div className="flex flex-col items-center flex-grow p-1">
          <TooltipProvider>
            {children}
          </TooltipProvider>
        </div>
      </div>
    </>
  )
}
