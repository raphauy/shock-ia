"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { ReminderDefinitionDAO } from "@/services/reminder-definition-services"
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { AlertCircle, Bell, Clock, MessageSquare, Timer, TimerOff } from "lucide-react"
import { ReminderDefinitionDialog, DeleteReminderDefinitionDialog } from "./reminderdefinition-dialogs"
import { formatMinutesDelay } from "@/lib/utils"

type Props = {
  reminderDefinition: ReminderDefinitionDAO
}

export function ReminderDefinitionCard({ reminderDefinition }: Props) {
  const { past, minutesDelay } = reminderDefinition;
  
  return (
    <Card className="hover:shadow-lg transition-shadow duration-200 w-full h-full flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-2xl flex items-center gap-2">
            <Bell className="h-6 w-6 text-primary" />
            <p>{reminderDefinition.name}</p>
          </CardTitle>
          
          <Badge className="ml-2">{past ? "Previo" : "Posterior"}</Badge>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col flex-1">
        <div className="flex items-center gap-2 text-muted-foreground mb-3">
          {past ? (
            <Timer className="h-4 w-4" />
          ) : (
            <TimerOff className="h-4 w-4" />
          )}
          <span className="text-sm">
            {formatMinutesDelay(minutesDelay, past)}
            {past ? "" : " del abandono"}
          </span>
        </div>
        
        <div className="space-y-3 flex-1">
          {reminderDefinition.description && (
            <div className="flex items-center gap-2">
              <div><AlertCircle className="h-4 w-4 text-muted-foreground mt-1" /></div>
              <span className="text-sm text-muted-foreground pt-1.5">{reminderDefinition.description}</span>
            </div>
          )}

          <div className="flex items-start gap-2">
            <div><MessageSquare className="h-4 w-4 text-muted-foreground mt-1" /></div>
            <span className="text-sm whitespace-pre-wrap pt-0.5">{reminderDefinition.message}</span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex justify-between items-center">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span className="text-xs">
            Actualizado {formatDistanceToNow(new Date(reminderDefinition.updatedAt), { addSuffix: true, locale: es })}
          </span>
        </div>
        
        <div className="flex items-center gap-1">
          <ReminderDefinitionDialog 
            id={reminderDefinition.id}
            clientId={reminderDefinition.clientId}
            past={reminderDefinition.past}
          />
          <DeleteReminderDefinitionDialog
            id={reminderDefinition.id}
            description={`¿Estás seguro que deseas eliminar la plantilla "${reminderDefinition.name}"?`}
          />
        </div>
      </CardFooter>
    </Card>
  )
}