"use client"

import { getV2EnabledActionBySlug } from "@/app/admin/config/(crud)/actions";
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarRail, SidebarTrigger } from "@/components/ui/sidebar";
import { Bell, BellRing, BookDashed, Bot, BriefcaseBusiness, Clock, DatabaseZap, Kanban, Megaphone, MessageCircle, QrCode, RectangleEllipsis, Sparkles, Tag, User, Users } from "lucide-react";
import { useParams, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

// Elementos básicos del menú que siempre aparecen, independiente de la configuración V2
const baseItems = [
  {
    title: "Kanban",
    url: `crm?last=30D`,
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
];

// Elementos que solo aparecen con V2 desactivado
const nonV2Items = [
  {
    title: "Simulador",
    url: `crm/simulator`,
    icon: Bot,
    group: "kanban",
  }
];

// Elementos que solo aparecen con V2 activado
const v2Items = [
  {
    title: "Simulador Pro",
    url: `crm/simulator-pro`,
    icon: Sparkles,
    group: "kanban",
  },
  {
    title: "Conversaciones Pro",
    url: `crm/conversations-pro`,
    icon: MessageCircle,
    group: "kanban",
  }
];

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

// Usamos un objeto global para cachear la configuración V2 entre navegaciones
// Esto evita que tengamos que volver a llamar a la API cada vez
const v2StatusCache = {
  status: null as boolean | null,
  slug: null as string | null
};

export function AppSidebar() {
  const params = useParams();
  const slug = params.slug as string;
  const path = usePathname();
  
  // Inicializamos el estado con los items correctos si ya tenemos la configuración en caché
  const initialItems = v2StatusCache.slug === slug && v2StatusCache.status !== null 
    ? v2StatusCache.status 
      ? [...baseItems, ...v2Items]
      : [...baseItems, ...nonV2Items]
    : baseItems;
  
  const [menuItems, setMenuItems] = useState(initialItems);
  
  // Usamos un solo useEffect que se ejecuta una vez al montar
  useEffect(() => {
    // Si ya tenemos la configuración en caché para este slug, no hacemos nada más
    if (v2StatusCache.slug === slug && v2StatusCache.status !== null) {
      return;
    }
    
    // Si no tenemos la configuración, la cargamos
    const fetchV2Status = async () => {
      try {
        const v2Enabled = await getV2EnabledActionBySlug(slug);
        
        // Actualizamos la caché
        v2StatusCache.slug = slug;
        v2StatusCache.status = v2Enabled;
        
        // Actualizamos el estado solo si es necesario
        if (v2Enabled) {
          setMenuItems([...baseItems, ...v2Items]);
        } else {
          setMenuItems([...baseItems, ...nonV2Items]);
        }
      } catch (error) {
        console.error("Error cargando la configuración V2:", error);
      }
    };
    
    fetchV2Status();
  }, [slug]); // Solo depende del slug
  
  // Usamos el mismo renderizado independientemente de si estamos montados o no
  return (
    <div>
      <Sidebar className="relative z-0 h-full" collapsible="icon">
        <SidebarContent className="h-full min-h-[calc(100vh-100px)]">
          {groups.map((group) => {
            // Filtramos los items para este grupo
            const groupItems = menuItems.filter(item => item.group === group.id);
            
            if (groupItems.length === 0) return null;
            
            return (
              <SidebarGroup key={group.id}>
                <div className="flex items-center justify-between">
                  <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
                  {group.id === "kanban" && <SidebarTrigger />}
                </div>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {groupItems.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton 
                          asChild 
                          isActive={path.endsWith(item.url)}
                          className={group.id === "configuracion" ? "data-[active=true]:border" : ""}
                        >
                          <Link href={`/client/${slug}/${item.url}`}>
                            <item.icon />
                            <span>{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            );
          })}
        </SidebarContent>
        <SidebarFooter>
          <div></div>
        </SidebarFooter>
        {!path.endsWith("/crm") && <SidebarRail className="[[data-side=left]_&]:cursor-pointer [[data-side=left][data-state=collapsed]_&]:cursor-pointer"/>}
      </Sidebar>
    </div>
  );
}
