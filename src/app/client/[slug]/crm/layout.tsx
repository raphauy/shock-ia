import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "./app-sidebar"

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
      <SidebarProvider className="w-full min-h-full">
        <AppSidebar />
        <div className="h-full w-full -z-10">
          {children}
        </div>
      </SidebarProvider>
  )
}