"use client"

import { cn } from "@/lib/utils";
import { BookOpen, Bot, Car, ChevronRightSquare, Columns4, DatabaseZap, LayoutDashboard, MessageCircle, Receipt, Ticket, User, Users, Warehouse } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface Props {
  slug: string
}
export default function CRMSideBar({ slug }: Props) {

  const data= [
    {
      href: `/client/${slug}/crm`,
      icon: LayoutDashboard,
      text: "Dashboard"
    },
    {
      href: "divider", icon: User
    },
    {
      href: `/client/${slug}/crm/stages`,
      icon: Columns4,
      text: "Estados"
    },
    {
      href: `/client/${slug}/crm/contacts`,
      icon: Users,
      text: "Contactos"
    },
  ]

  const path= usePathname()

  const isCRMPage= path.startsWith(`/client/${slug}/crm`)
  if (!isCRMPage) return null

  const commonClasses= "flex gap-2 items-center py-1 mx-2 rounded hover:bg-gray-200 dark:hover:text-black"
  const selectedClasses= "font-bold text-shock-color dark:border-r-white"

  const isStagePage= path.startsWith(`/client/${slug}/crm`)
  return (
    <div className={cn("flex flex-col justify-between border-r border-r-shock-color/50", !isStagePage && "lg:pl-8")}>
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
              <p className={cn("hidden", !isStagePage && "md:block md:w-36")}>{text}</p>                  
            </Link>
          )
        })}

        {divider()}
      </section>
    </div>
  );
}


function divider(key?: number) {
  return <div key={key} className="mx-2 my-5 border-b border-b-shock-color/50" />
}
