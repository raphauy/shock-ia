"use client"

import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarRail, SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { BookOpen, Bot, ChevronRightSquare, Kanban, LayoutDashboard, MessageCircle, MessagesSquare, Phone, RectangleEllipsis, Tag, User } from "lucide-react";
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
    url: `crm/contacts`,
    icon: User,
    group: "contactos",
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
]

export function AppSidebar() {

    const params = useParams()
    const slug= params.slug as string
    const path = usePathname()

    const { setOpen } = useSidebar()

    useEffect(() => {
        if (path.endsWith("/crm")) {
            setOpen(false)
        }
    }, [path, setOpen])

  
    return (
        <div>
            <Sidebar className="pt-[50px] z-0 h-full" collapsible="icon">
                <SidebarContent>
                    <SidebarGroup>
                        <div className="flex items-center justify-between">
                            <SidebarGroupLabel>Dashboard</SidebarGroupLabel>
                            <SidebarTrigger />
                        </div>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                {items.filter((item) => item.group === "kanban").map((item) => (
                                    <SidebarMenuItem key={item.title}>
                                        <SidebarMenuButton asChild isActive={path.endsWith(item.url)}>
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
                    <SidebarGroup>
                        <SidebarGroupLabel>Contactos</SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                {items.filter((item) => item.group === "contactos").map((item) => (
                                    <SidebarMenuItem key={item.title}>
                                        <SidebarMenuButton asChild isActive={path.endsWith(item.url)}>
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
                    <SidebarGroup>
                        <SidebarGroupLabel>Configuración</SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                {items.filter((item) => item.group === "configuracion").map((item) => (
                                    <SidebarMenuItem key={item.title}>
                                        <SidebarMenuButton asChild isActive={path.endsWith(item.url)} className="data-[active=true]:border">
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
                </SidebarContent>
                <SidebarFooter>
                    <div></div>
                </SidebarFooter>
                <SidebarRail />
            </Sidebar>
        </div>
    )
}


function parsePath(referer: string) {
    // referer:  /raphael/gabi-zimmer/leads
    const path = referer.split('/').filter(Boolean)
    return {
        agencySlug: path[0],
        clientSlug: path[1],
        channelPath: path.slice(2).join('/'),
    }
}