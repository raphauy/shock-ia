"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CampaignContactDAO } from "@/services/campaign-services"
import { CampaignContactStatus } from "@/lib/generated/prisma"
import { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { ArrowUpDown } from "lucide-react"
import { DeleteScheduledCampaignContactButton } from "./delete-schedule-button"
import { ConversationLink } from "./conversation-link"
import { ProcessCampaignContactButton } from "./process-campaign-contact-button"

  

export const columns: ColumnDef<CampaignContactDAO>[] = [

  {
    accessorKey: "status",
    header: ({ column }) => {
        return (
          <Button variant="ghost" className="pl-0 dark:text-white"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Estado
            <ArrowUpDown className="w-4 h-4 ml-1" />
          </Button>
    )},
    cell: ({ row }) => {
      const data= row.original
      return (
        <div>
          <div className="flex items-center gap-2">
            <Badge 
              className="w-24"
              variant={          
                data.status === CampaignContactStatus.ENVIADO ? "statusEnviado" : 
                data.status === CampaignContactStatus.ERROR ? "statusError" : 
                data.status === CampaignContactStatus.PENDIENTE ? "statusPendiente" : 
                data.status === CampaignContactStatus.PROGRAMADO ? "statusProgramado" : 
                "statusPendiente"}>{data.status}
            </Badge>
            {data.status === CampaignContactStatus.PENDIENTE && <ProcessCampaignContactButton campaignContactId={data.id} />}
            {data.status === CampaignContactStatus.ENVIADO && data.conversationId && <ConversationLink conversationId={data.conversationId} />}
            {/* {data.status === CampaignContactStatus.PROGRAMADO && <DeleteScheduledCampaignContactButton campaignContactId={data.id} />} */}
          </div>
          <p className="text-xs text-gray-500 mt-1">
          {data.status === CampaignContactStatus.PROGRAMADO && data.scheduledTo ? format(data.scheduledTo, "yyyy/MM/dd HH:mm:ss") : ""}
          {data.status === CampaignContactStatus.ENVIADO && data.sentAt ? format(data.sentAt, "yyyy/MM/dd HH:mm:ss") : ""}
          </p>
        </div>
      )
    }
  },

  {
    accessorKey: "name",
    header: ({ column }) => {
        return (
          <Button variant="ghost" className="pl-0 dark:text-white"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Nombre
            <ArrowUpDown className="w-4 h-4 ml-1" />
          </Button>
    )},
    cell: ({ row }) => {
      const data= row.original.contact
      return (
        <div className="flex items-center gap-2 lg:min-w-[300px]">
          <Avatar>
            <AvatarImage src={data.imageUrl ?? ""} />
            <AvatarFallback>{data.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <p>{data.name}</p>
            <p>{data.phone}</p>
          </div>
        </div>
      )
    },
    filterFn: (row, id, value) => {
      const name = row.original.contact.name ?? ""
      const phone = row.original.contact.phone ?? ""
      return name.toLowerCase().includes(value.toLowerCase()) || phone.toLowerCase().includes(value.toLowerCase())
    },
  },

  {
    accessorKey: "contact.updatedAt",
    header: ({ column }) => {
        return (
          <Button variant="ghost" className="pl-0 dark:text-white"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Actualizado
            <ArrowUpDown className="w-4 h-4 ml-1" />
          </Button>
    )},
    cell: ({ row }) => {
      const data= row.original.contact
      return (
        <p>{format(data.updatedAt, "yyyy/MM/dd")}</p>
      )
    }
  },

  {
    accessorKey: "contact.stage.name",
    header: ({ column }) => {
        return (
          <Button variant="ghost" className="pl-0 dark:text-white"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Estado
            <ArrowUpDown className="w-4 h-4 ml-1" />
          </Button>
    )},
    cell: ({ row }) => {
      const data= row.original.contact
      return (
        <Badge variant="stage">{data.stage.name}</Badge>
      )
    }
  },

  {
    accessorKey: "contact.tags",
    header: ({ column }) => {
        return (
          <Button variant="ghost" className="pl-0 dark:text-white"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Etiquetas
            <ArrowUpDown className="w-4 h-4 ml-1" />
          </Button>
    )},
    cell: ({ row }) => {
      const data= row.original.contact
      return (
        <div className="flex items-center gap-2">
          {data.tags.map((tag, index) => (
            <Badge key={index}>{tag}</Badge>
          ))}
        </div>
      )
    },
    filterFn: (row, id, value) => {
      const tags= row.original.contact.tags.join(",")
      return tags.includes(value)
    },
  },

]


