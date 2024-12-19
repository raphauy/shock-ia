"use client"

import { Button } from "@/components/ui/button";
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarRail, SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { BookOpen, Bot, ChevronRightSquare, DatabaseZap, Kanban, LayoutDashboard, LogOut, Megaphone, MessageCircle, MessagesSquare, Phone, RectangleEllipsis, Tag, User, Users } from "lucide-react";
import { useParams, usePathname } from "next/navigation";
import { useEffect, useState } from "react";

// Menu items.
const items = [
  {
    title: "Kanban",
    url: `crm`,
    icon: Kanban,
    group: "kanban",
  },
  {
    title: "Contactos",
    url: `crm/contacts?last=30D`,
    icon: User,
    group: "data",
  },
  {
    title: "Importación",
    url: `crm/imported-contacts`,
    icon: Users,
    group: "data",
  },
  {
    title: "Registros",
    url: `crm/registros`,
    icon: DatabaseZap,
    group: "data",
  },
  {
    title: "Etiquetas",
    url: `crm/tags`,
    icon: Tag,
    group: "configuracion",
  },
  {
    title: "Campos personalizados",
    url: `crm/custom-fields`,
    icon: RectangleEllipsis,
    group: "configuracion",
  },
  {
    title: "Campañas",
    url: `crm/campaigns`,
    icon: Megaphone,
    group: "campaigns",
  }
]

const groups = [
  {
    id: "kanban",
    label: "Dashboard"
  },
  {
    id: "data",
    label: "Contactos"
  },
  {
    id: "configuracion",
    label: "Configuración"
  },
  {
    id: "campaigns",
    label: "Campañas"
  }
];

export function AppSidebar() {

    const params = useParams()
    const slug= params.slug as string
    const path = usePathname()

    const { open, setOpen } = useSidebar()

    // useEffect(() => {
    //     if (open && path.endsWith("/crm")) {
    //         setOpen(false)
    //     }
    // }, [open, path, setOpen])

  
    return (
        <div>
            <Sidebar className="relative z-0 h-full" collapsible="icon">
                <SidebarContent className="h-full min-h-[calc(100vh-100px)]">
                    {groups.map((group) => (
                        <SidebarGroup key={group.id}>
                            <div className="flex items-center justify-between">
                                <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
                                {group.id === "kanban" && <SidebarTrigger />}
                            </div>
                            <SidebarGroupContent>
                                <SidebarMenu>
                                    {items
                                        .filter((item) => item.group === group.id)
                                        .map((item) => (
                                            <SidebarMenuItem key={item.title}>
                                                <SidebarMenuButton 
                                                    asChild 
                                                    isActive={path.endsWith(item.url)}
                                                    className={group.id === "configuracion" ? "data-[active=true]:border" : ""}
                                                >
                                                    <a href={`/client/${slug}/${item.url}`}>
                                                        <item.icon />
                                                        <span>{item.title}</span>
                                                    </a>
                                                </SidebarMenuButton>
                                            </SidebarMenuItem>
                                        ))}
                                </SidebarMenu>
                            </SidebarGroupContent>
                        </SidebarGroup>
                    ))}
                </SidebarContent>
                <SidebarFooter>
                    <div>
                    </div>
                </SidebarFooter>
                { !path.endsWith("/crm") && <SidebarRail className="[[data-side=left]_&]:cursor-pointer [[data-side=left][data-state=collapsed]_&]:cursor-pointer"/> } 
            </Sidebar>
        </div>
    )
}
