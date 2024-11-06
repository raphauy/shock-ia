"use client"

import { cn } from "@/lib/utils";
import { BookOpen, Bot, Car, ChevronRightSquare, DatabaseZap, LayoutDashboard, MessageCircle, Receipt, Ticket, User, Warehouse } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface Props {
  slug: string
  showRegistro?: boolean
  showCarServices?: boolean
  showRepoData?: boolean
  repoLabel: string
}
export default function SideBar({ slug, showRegistro, showCarServices, showRepoData, repoLabel }: Props) {

  const data= [
    {
      href: `/client/${slug}`,
      icon: LayoutDashboard,
      text: "Dashboard"
    },
    {
      href: "divider", icon: User
    },
    {
      href: `/client/${slug}/documents`,
      icon: BookOpen,
      text: "Documentos"
    },
    {
      href: `/client/${slug}/chats`,
      icon: MessageCircle,
      text: "Conversaciones"
    },
    {
      href: `/client/${slug}/prompt`,
      icon: ChevronRightSquare,
      text: "Prompt"
    },
    {
      href: `/client/${slug}/simulator`,
      icon: Bot,
      text: "Simulador"
    },
    {
      href: "divider", icon: User
    },
    {
      href: `/client/${slug}/billing`,
      icon: Receipt,
      text: "Costos por uso"
    },
    {
      href: "divider", icon: User
    },  
    {
      href: `/client/${slug}/users`,
      icon: User,
      text: "Usuarios"
    },
  ]

  const path= usePathname()

  const commonClasses= "flex gap-2 items-center py-1 mx-2 rounded hover:bg-gray-200 dark:hover:text-black"
  const selectedClasses= "font-bold text-shock-color dark:border-r-white"

  const isChatPage= path.startsWith(`/client/${slug}/chats`)
  const isEventsPage= path.startsWith(`/client/${slug}/events`)
  const isCRMPage= path.startsWith(`/client/${slug}/crm`)

  if (isEventsPage || isCRMPage) return null

  return (
    <div className={cn("flex flex-col justify-between border-r border-r-shock-color/50", !isChatPage && "lg:pl-8")}>
      <section className="flex flex-col gap-3 py-4 mt-3 ">
        {data.map(({ href, icon: Icon, text }, index) => {
          if (href === "divider") return divider(index)
          
          const selected= path.endsWith(href)
          const classes= cn(commonClasses, selected && selectedClasses)
          return (
            <Link href={href} key={href} className={classes}>
              <div className="pb-1">
                <Icon />
              </div>
              <p className={cn("hidden", !isChatPage && "md:block md:w-36")}>{text}</p>                  
            </Link>
          )
        })}
        <Link href={`/client/${slug}/registro`} className={cn(commonClasses, path.endsWith("registro") && selectedClasses, !showRegistro && "hidden")}>
          <div className="pb-1">
            <Warehouse size={23} />
          </div>
          <p className={cn("hidden", !isChatPage && "md:block md:w-36")}>Registro</p>                  
        </Link>

        <Link href="/client/summit/summit" className={cn(commonClasses, path.endsWith("summit/summit") && selectedClasses, slug !== "summit" && "hidden")}>
          <div>
            <Ticket size={23} />
          </div>
          <p className={cn("hidden", !isChatPage && "md:block md:w-36")}>Reservas</p>                  
        </Link>

        <Link href={`/client/${slug}/car-service`} className={cn(commonClasses, path.endsWith("car-service") && selectedClasses, !showCarServices && "hidden")}>
          <div className="pb-1">
          <Car size={23} />
          </div>
          <p className={cn("hidden", !isChatPage && "md:block md:w-36")}>Servicios</p>                  
        </Link>

        <Link href={`/client/${slug}/registros`} className={cn(commonClasses, path.endsWith("registros") && selectedClasses, !showRepoData && "hidden")}>
          <div className="pb-1">
            <DatabaseZap size={23} />
          </div>
          <p className={cn("hidden", !isChatPage && "md:block md:w-36")}>{repoLabel}</p>                  
        </Link>

        {divider()}



      </section>
    </div>
  );
}


function divider(key?: number) {
  return <div key={key} className="mx-2 my-5 border-b border-b-shock-color/50" />
}
