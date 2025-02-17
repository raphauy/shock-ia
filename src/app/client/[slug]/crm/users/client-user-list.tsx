"use client"

import { Input } from "@/components/ui/input"
import { ComercialDAO } from "@/services/comercial-services"
import { Search } from "lucide-react"
import { useState } from "react"
import UserCard from "./client-user-card"
import { UserDAO } from "@/services/user-service"

type Props = {
    users: UserDAO[]
}

export default function ClientUserList({ users }: Props) {
    const [searchTerm, setSearchTerm] = useState("")

    const filteredUsers = users.filter(user => 
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="w-full max-w-5xl mx-auto py-6 space-y-6">
            <div className="w-full max-w-md mx-auto px-4 relative">
                <Search className="absolute left-7 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    type="search"
                    placeholder="Buscar usuarios..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10"
                />
            </div>
            
            <div className="grid grid-cols-1 gap-4 place-items-center">
                {filteredUsers.map((user) => (
                    <UserCard 
                        key={user.id} 
                        user={user} 
                    />
                ))}
            </div>
        </div>
    )
}