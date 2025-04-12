"use client"

import { Button } from "@/components/ui/button"
import { ReminderDAO } from "@/services/reminder-services"
import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown } from "lucide-react"
import { format } from "date-fns"
import { DeleteReminderDialog, ReminderDialog } from "./reminder-dialogs"
import { Badge } from "@/components/ui/badge"
import { formatMinutesDelay } from "@/lib/utils"
import { ReminderStatus } from "@/lib/generated/prisma"
import { ConversationLink } from "../campaigns/[campaignId]/conversation-link"
import { CancelReminderButton } from "./cancel-reminder-button"


export const columns: ColumnDef<ReminderDAO>[] = [
  {
    accessorKey: "status",
    header: ({ column }) => {
        return (
          <Button variant="ghost" className="w-full"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Evento
            <ArrowUpDown className="w-4 h-4 ml-1" />
          </Button>
    )},
    cell: ({ row }) => {
      const data= row.original
      const variant= data.status === "PENDIENTE" ? "statusPendiente" : 
      data.status === "ENVIADO" ? "statusEnviado" : 
      data.status === "ERROR" ? "statusError" : 
      data.status === "CANCELADO" ? "archived" : "default"
      const date= data.eventTime && format(new Date(data.eventTime), "yyyy-MM-dd HH:mm")
      return (
        <div className="flex flex-col items-center space-y-2">
          <Badge variant="outline">
            {date}
          </Badge>
          <Badge variant={variant}>
            {data.status}
          </Badge>
        </div>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
  },

  {
    accessorKey: "scheduledFor",
    header: ({ column }) => {
        return (
          <Button variant="ghost" className="w-full"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Recordatorio
            <ArrowUpDown className="w-4 h-4 ml-1" />
          </Button>
    )},
		cell: ({ row }) => {
      const data= row.original
      const date= data.scheduledFor && format(new Date(data.scheduledFor), "yyyy-MM-dd HH:mm")
      return (
        <div className="flex flex-col items-center space-y-2">
          <Badge variant="outline">
            {date}
          </Badge>
          <p className="text-xs text-muted-foreground">
            {formatMinutesDelay(
              data.reminderDefinition.minutesDelay, 
              data.reminderDefinition.past
            )}
          </p>
        </div>
      )
    }
  },

  {
    accessorKey: "message",
    header: ({ column }) => {
      return (
        <Button variant="ghost" className="pl-0 dark:text-white"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Mensaje
          <ArrowUpDown className="w-4 h-4 ml-1" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const data= row.original
      return (
        <div>
          <p className="text-foreground pb-2">{data.contact.name} {data.contact.phone}</p>
          <p className="text-muted-foreground">{data.message}</p>
        </div>
      )
    },
    filterFn: (row, id, value) => {
      const data = row.original
      const valueLower = value.toLowerCase()
      return !!(data.message?.toLowerCase().includes(valueLower) ||
        data.error?.toLowerCase().includes(valueLower))        
    },
  },
  
  {
    accessorKey: "sentAt",
    header: ({ column }) => {
        return (
          <Button variant="ghost" className="pl-0 dark:text-white"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Enviado
            <ArrowUpDown className="w-4 h-4 ml-1" />
          </Button>
    )},
		cell: ({ row }) => {
      const data= row.original
      const date= data.sentAt && format(new Date(data.sentAt), "yyyy-MM-dd HH:mm")
      return (
        <div className="">
          <p>{date}</p>
          <p className="text-red-500">{data.error}</p>
        </div>
      )
    }
  },

  {
    id: "actions",
    cell: ({ row }) => {
      const data= row.original

      const deleteDescription= `Do you want to delete Reminder ${data.id}?`
 
      return (
        <div className="flex items-center justify-end gap-2">

          {data.status === ReminderStatus.PROGRAMADO && <CancelReminderButton reminderId={data.id} />}
          {data.status === ReminderStatus.ENVIADO && data.conversationId && <ConversationLink conversationId={data.conversationId} />}
          {/* <DeleteReminderDialog description={deleteDescription} id={data.id} /> */}
        </div>

      )
    },
  },
]


