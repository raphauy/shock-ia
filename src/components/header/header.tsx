import { ReactNode } from "react"
import Logo from "./logo"
import Logged from "./logged"
import getSession from "@/lib/auth"
import { ThemeToggle } from "../shadcn/theme-toggle"
import { Badge } from "../ui/badge"

interface Props {  
    children: ReactNode
}
  
export default async function Header({ children }: Props) {
    const session= await getSession()
    const environment = process.env.VERCEL_ENV || "development"

    let env

    if (environment === 'preview') {
      env= "PREVIEW"
    } else if (environment === 'development') {
      env= "DEVELOPMENT"
    }

    return (
        <div className="flex items-center gap-2 pb-1 border-b border-shock-color/50 z-10 bg-background">
            <div>
                <Logo />
            </div>
            <div className="flex-1">                                
                {session && children}
            </div>
            
            { env && <Badge className="font-bold">{env}</Badge> }
            <div>
                <ThemeToggle />
            </div>
            <div>
                <Logged />
            </div>
        </div>
    )
}
