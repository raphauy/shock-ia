"use client"

import { Button } from "@/components/ui/button";
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarRail, SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { Bell, BellRing, BookDashed, BookOpen, Bot, BriefcaseBusiness, Calendar, ChevronRightSquare, Clock, DatabaseZap, Kanban, LayoutDashboard, List, LogOut, Megaphone, MessageCircle, MessagesSquare, Phone, QrCode, RectangleEllipsis, Search, ShoppingCart, Tag, User, Users } from "lucide-react";
import { useParams, usePathname } from "next/navigation";
import { useEffect, useState } from "react";

// Menu items.
const items = [
  {
    title: "Dashboard",
    url: `productos`,
    icon: LayoutDashboard,
    group: "dashboard",
  },
  {
    title: "Simulador",
    url: `productos/simulator`,
    icon: Bot,
    group: "dashboard",
  },
  {
    title: "Todos los productos",
    url: `productos/text-search`,
    icon: ShoppingCart,
    group: "productos",
  },
  {
    title: "Búsqueda Semántica",
    url: `productos/semantic-search`,
    icon: Search,
    group: "productos",
  },
  {
    title: "Listar y filtrar",
    url: `productos/ordenes`,
    icon: List,
    group: "ordenes",
  },
  {
    title: "Buscar Orden",
    url: `productos/buscar-orden`,
    icon: Search,
    group: "ordenes",
  },
]

const groups = [
  {
    id: "dashboard",
    label: "Dashboard"
  },
  {
    id: "productos",
    label: "Productos"
  },
  {
    id: "ordenes",
    label: "Ordenes"
  },
];

export function AppSidebar() {

    const params = useParams()
    const slug= params.slug as string
    const path = usePathname()

    const { open, setOpen } = useSidebar()

    return (
        <div>
            <Sidebar className="relative z-0 h-full" collapsible="icon">
                <SidebarContent className="h-full min-h-[calc(100vh-100px)]">
                    {groups.map((group) => (
                        <SidebarGroup key={group.id}>
                            <div className="flex items-center justify-between">
                                <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
                                {group.id === "dashboard" && <SidebarTrigger />}
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
                                                    className={group.id === "productos" ? "data-[active=true]:border" : ""}
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
                { !path.endsWith("/productos") && <SidebarRail className="[[data-side=left]_&]:cursor-pointer [[data-side=left][data-state=collapsed]_&]:cursor-pointer"/> } 
            </Sidebar>
        </div>
    )
}
