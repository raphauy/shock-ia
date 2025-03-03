"use client"

import { Button } from "@/components/ui/button"
import { NotificationDAO } from "@/services/notification-services"
import { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { ArrowUpDown } from "lucide-react"
import { DeleteNotificationDialog } from "./notification-dialogs"


export const columns: ColumnDef<NotificationDAO>[] = [
  {
    accessorKey: "phone",
    header: ({ column }) => {
      return (
        <Button variant="ghost" className="pl-0 dark:text-white"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Teléfono
          <ArrowUpDown className="w-4 h-4 ml-1" />
        </Button>
      )
    },
    filterFn: (row, id, value) => {
      const data = row.original
      const valueLower = value.toLowerCase()
      return !!(data.phone?.toLowerCase().includes(valueLower) ||
        data.message?.toLowerCase().includes(valueLower) ||
        data.clientId?.toLowerCase().includes(valueLower))
    },
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
    )},
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
        <div className="flex items-center gap-2">
          <p className="whitespace-nowrap">{date}</p>
          {data.error && (
            <p className="text-red-500">{data.error}</p>
          )}
        </div>
      )
    }
  },

  // {
  //   accessorKey: "role",
  //   header: ({ column }) => {
  //     return (
  //       <Button variant="ghost" className="pl-0 dark:text-white"
  //         onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
  //         Rol
  //         <ArrowUpDown className="w-4 h-4 ml-1" />
  //       </Button>
  //     )
  //   },
  //   filterFn: (row, id, value) => {
  //     return value.includes(row.getValue(id))
  //   },
  // },
  // {
  //   id: "actions",
  //   cell: ({ row }) => {
  //     const data= row.original

  //     const deleteDescription= `Do you want to delete Notification ${data.id}?`
 
  //     return (
  //       <div className="flex items-center justify-end gap-2">

  //         <DeleteNotificationDialog description={deleteDescription} id={data.id} />
  //       </div>

  //     )
  //   },
  // },
]


