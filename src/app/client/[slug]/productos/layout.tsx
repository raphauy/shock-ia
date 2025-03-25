import { SidebarProvider  } from "@/components/ui/sidebar"
import { AppSidebar } from "./app-sidebar"

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex w-full">
      <SidebarProvider>
        <AppSidebar />
        <main className="flex-1 ml-1">
          {children}
        </main>
      </SidebarProvider>
    </div>
  )
}