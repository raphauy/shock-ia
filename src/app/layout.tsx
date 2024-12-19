import { Metadata, Viewport } from "next"
import React from "react"
import './globals.css'
import { Toaster } from "@/components/ui/toaster"
import { TailwindIndicator } from '@/components/shadcn/tailwind-indicator'
import { ThemeProvider } from '@/components/shadcn/theme-provider'
import getSession from '@/lib/auth'
import Menu from "@/components/header/menu"
import SessionProvider from '@/components/SessionProvider'
import { cn } from "@/lib/utils"
import Header from '../components/header/header'


export const metadata: Metadata = {
  title: "ShockIA",
  description: "Potenciá tu negocio con chatbots con IA",
  openGraph: {
    title: "ShockIA",
    description: "Potenciá tu negocio con chatbots con IA",
    type: "website",
    url: "https://shock.uy",
    images: [
      {
        url: "https://ia.shock.uy/logo.png",
        width: 611,
        height: 134,
        alt: "ShockIA",
      },
    ],
},
  metadataBase: new URL("https://shock.uy"),
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
              <div className="container relative flex flex-col min-w-full min-h-screen text-muted-foreground w-fit">
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
