"use client"

import { cn } from "@/lib/utils";
import { Bot, Briefcase, ChevronRightSquare, Database, FunctionSquare, LayoutDashboard, MessageCircle, Receipt, ScreenShare, Settings, Tag, User, Warehouse, Banknote, FolderSync, CloudCog, Network } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { getLastClientIdAction } from "./clients/(crud)/actions";
import { useSession } from "next-auth/react";

export default function SideBar() {
  const { data: sessionData } = useSession();
  const user = sessionData?.user;
  const email = user?.email?.toLowerCase() || '';
  const hasAccessToFCFee = email === 'rapha.uy@rapha.uy' || email === 'joaquin@shock.uy';

  const data= [
    {
      href: `/admin`,
      icon: LayoutDashboard,
      text: "Dashboard"
    },
    {
      href: "divider", icon: User
    },
    {
      href: `/admin/users`,
      icon: User,
      text: "Usuarios"
    },
    {
      href: `/admin/clients`,
      icon: Briefcase,
      text: "Clientes"
    },
    {
      href: `/admin/functions`,
      icon: FunctionSquare,
      text: "Funciones"
    },
    {
      href: `/admin/tags`,
      icon: Tag,
      text: "Etiquetas"
    },
    {
      href: "divider", icon: User
    },
    // {
    //   href: `/admin/chat`,
    //   icon: MessageCircle,
    //   text: "Simulador"
    // },
    // {
    //   href: "divider", icon: User
    // },
    {
      href: `/admin/billing`,
      icon: Receipt,
      text: "Billing"
    },
    {
      href: "divider", icon: User
    },  
    {
      href: `/admin/providers`,
      icon: ScreenShare,
      text: "Proveedores LLM"
    },
    {
      href: `/admin/models`,
      icon: Bot, 
      text: "Modelos"
    },
    // {
    //   href: `/admin/repositories`,
    //   icon: Database, 
    //   text: "Repositorios"
    // },
    {
      href: "divider", icon: User
    },  
    {
      href: `/admin/product-feeds`,
      icon: FolderSync,
      text: "Sinc. Productos"
    },
    {
      href: `/admin/wap-connections`,
      icon: Network,
      text: "Wap Conn"
    },
    {
      href: `/admin/event-logs?last=7D`,
      icon: CloudCog,
      text: "Logs"
    },
    {
      href: "divider", icon: User
    },  
    ...(hasAccessToFCFee ? [
      {
        href: `/admin/fc-fee`,
        icon: Banknote,
        text: "FC Fee"
      }
    ] : []),
  ]

  const [firstClientId, setFirstClientId] = useState("")
  useEffect(() => {
    getLastClientIdAction().then((id) => setFirstClientId(id || ""))
  }, [])
  
  const path= usePathname()

  const commonClasses= "flex gap-2 items-center py-1 mx-2 rounded hover:bg-gray-200 dark:hover:text-black"
  const selectedClasses= "font-bold text-shock-color dark:border-r-white"

  return (
    <div className={cn("flex flex-col justify-between border-r border-r-shock-color/50 lg:pl-8")}>
      <section className="flex flex-col gap-3 py-4 mt-3 ">
        {data.map(({ href, icon: Icon, text }, index) => {
          if (href === "divider") return divider(index)

          if (href === "/admin/repositories" && user?.email !== "rapha.uy@rapha.uy") return null
          
          const selected= path.endsWith(href)
          const classes= cn(commonClasses, selected && selectedClasses)
          return (
            <Link href={href} key={href} className={classes}>
              <Icon size={23} />
              <p className={cn("hidden md:block md:w-36")}>{text}</p>                  
            </Link>
          )
        })}
        {/* <Link href="/admin/narvaez" className={cn(commonClasses, path.endsWith("narvaez") && selectedClasses)}>
          <Warehouse size={23} />
          <p className={cn("hidden md:block md:w-36")}>Narvaez</p>
        </Link> */}

      </section>
      <section className="mb-4">
        {divider()}
        
        <Link href={`/admin/config?clientId=${firstClientId}`} className={cn(commonClasses, path.endsWith("/admin/config") && selectedClasses)}>
          <Settings />
          <p className={cn("hidden md:block md:w-36")}>Configuración</p>                  
        </Link>
      </section>
    </div>
  );
}


function divider(key?: number) {
  return <div key={key} className="mx-2 my-5 border-b border-b-shock-color/50" />
}
