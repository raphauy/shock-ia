import { Metadata, Viewport } from "next"
import './globals.css'

import { Toaster } from "@/components/ui/toaster"

import { TailwindIndicator } from '@/components/shadcn/tailwind-indicator'
import { ThemeProvider } from '@/components/shadcn/theme-provider'
import getSession from '@/lib/auth'
//import { fontSans } from '@/lib/fonts'
import { cn } from "@/lib/utils"
import Header from '../components/header/header'
import Menu from "@/components/header/menu"
import SessionProvider from '@/components/SessionProvider'


export const metadata: Metadata = {
  title: "OsomGPT",
  description: "Osom Digital AI",
  icons: {
    icon: "/favicon.ico",
  },  
}

export const viewport: Viewport = {
  themeColor: "light",  
}

interface RootLayoutProps {  
  children: React.ReactNode
}

export default async function RootLayout({ children }: RootLayoutProps) {
  const session= await getSession()
  
  return (
    <>
      <html lang="en" suppressHydrationWarning>
        <head />
        <body className={cn("min-h-screen bg-background font-sans antialiased w-full")}>
        {/* <body className={cn("min-h-screen bg-background font-sans antialiased w-full", fontSans.variable)}> */}
            <SessionProvider session={session}>
          

            <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
              <div className="container relative flex flex-col min-w-full min-h-screen mt-1 text-muted-foreground w-fit">
                <Header><Menu /></Header> 

                <div className="flex flex-col items-center flex-1">
                  {children}
                  <Toaster />
                </div>
              </div>            
              <TailwindIndicator />
            </ThemeProvider>

            </SessionProvider>
        </body>
      </html>
    </>
  )
}
