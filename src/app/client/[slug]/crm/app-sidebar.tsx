"use client"

import { Button } from "@/components/ui/button";
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarRail, SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { Bell, BellRing, BookDashed, BookOpen, Bot, BriefcaseBusiness, Calendar, ChevronRightSquare, Clock, DatabaseZap, Kanban, LayoutDashboard, LogOut, Megaphone, MessageCircle, MessagesSquare, Phone, QrCode, RectangleEllipsis, Sparkles, Tag, User, Users } from "lucide-react";
import { useParams, usePathname } from "next/navigation";
import { useEffect, useState } from "react";

// Menu items.
const items = [
  {
    title: "Kanban",
    url: `crm?last=30D`,
    icon: Kanban,
    group: "kanban",
  },
  {
    title: "Simulador",
    url: `crm/simulator`,
    icon: Bot,
    group: "kanban",
  },
  {
    title: "Simulador Pro",
    url: `crm/simulator-v2`,
    icon: Sparkles,
    group: "kanban",
  },  
  {
    title: "Contactos",
    url: `crm/contacts?last=30D`,
    icon: User,
    group: "data",
  },
  {
    title: "Plantilllas",
    url: `crm/reminder-definitions`,
    icon: BookDashed,
    group: "reminders",
  },
  {
    title: "Recordatorios",
    url: `crm/reminders`,
    icon: Bell,
    group: "reminders",
  },
  {
    title: "Notificaciones",
    url: `crm/notifications`,
    icon: BellRing,
    group: "reminders",
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
    title: "Usuarios",
    url: `crm/users`,
    icon: Users,
    group: "configuracion",
  },
  {
    title: "Comerciales",
    url: `crm/comercials`,
    icon: BriefcaseBusiness,
    group: "configuracion",
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
    title: "Horarios de actividad",
    url: `crm/availability`,
    icon: Clock,
    group: "configuracion",
  },
  {
    title: "Campañas",
    url: `crm/campaigns`,
    icon: Megaphone,
    group: "campaigns",
  },
  {
    title: "Conectar con QR",
    url: `crm/whatsapp`,
    icon: QrCode,
    group: "whatsapp",
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
    id: "reminders",
    label: "Recordatorios y notificaciones"
  },
  {
    id: "campaigns",
    label: "Campañas"
  },
  {
    id: "configuracion",
    label: "Configuración"
  },
  {
    id: "whatsapp",
    label: "Whatsapp"
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
