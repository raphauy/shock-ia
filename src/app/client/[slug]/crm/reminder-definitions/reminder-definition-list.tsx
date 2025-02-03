"use client"

import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { useState } from "react"
import { ReminderDefinitionDAO } from "@/services/reminder-definition-services"
import { ReminderDefinitionCard } from "./reminder-definition-card"

type Props = {
    reminderDefinitions: ReminderDefinitionDAO[]
}

export function ReminderDefinitionList({ reminderDefinitions }: Props) {
    const [searchTerm, setSearchTerm] = useState("")
    
    const filteredReminderDefinitions = reminderDefinitions.filter(reminderDefinition => 
        reminderDefinition.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reminderDefinition.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reminderDefinition.message?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="w-full max-w-5xl mx-auto py-6 space-y-6">
            <div className="w-full max-w-md mx-auto px-4 relative">
                <Search className="absolute left-7 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    type="search"
                    placeholder="Buscar vinos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10"
                />
            </div>
            
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 place-items-center">
                {filteredReminderDefinitions.map((reminderDefinition) => (
                    <ReminderDefinitionCard 
                        key={reminderDefinition.id} 
                        reminderDefinition={reminderDefinition} 
                    />
                ))}
            </div>
        </div>
    )
}