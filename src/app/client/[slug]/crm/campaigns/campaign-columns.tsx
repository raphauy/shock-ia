"use client"

import { Button } from "@/components/ui/button"
import { CampaignDAO } from "@/services/campaign-services"
import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown } from "lucide-react"
import { format } from "date-fns"
import { DeleteCampaignDialog, CampaignDialog } from "./campaign-dialogs"
import Link from "next/link"
import { CampaignLink } from "./campaign-link"
import { cn, formatWhatsAppStyle } from "@/lib/utils"
import { CampaignStatus } from "@prisma/client"


export const columns: ColumnDef<CampaignDAO>[] = [
  
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
      const data= row.original
      return (
        <CampaignLink id={data.id} name={data.name} />
      )
    }
  },
  {
    accessorKey: "type",
    header: ({ column }) => {
        return (
          <Button variant="ghost" className="pl-0 dark:text-white"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Tipo
            <ArrowUpDown className="w-4 h-4 ml-1" />
          </Button>
    )},
  },

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
        <p className={cn("font-bold", data.status === CampaignStatus.CREADA && "text-yellow-500",
          data.status === CampaignStatus.EN_PROCESO && "text-blue-500",
          data.status === CampaignStatus.COMPLETADA && "text-green-500",
          data.status === CampaignStatus.EN_PAUSA && "text-red-500",
          data.status === CampaignStatus.CANCELADA && "text-gray-500")}>
          {data.status}
        </p>
      )
    }
  },

  {
    accessorKey: "createdAt",
    header: ({ column }) => {
      return (
        <Button variant="ghost" className="pl-0 dark:text-white"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Fecha
          <ArrowUpDown className="w-4 h-4 ml-1" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const data= row.original
      return (
        <p>{formatWhatsAppStyle(data.createdAt)}</p>
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
  {
    id: "actions",
    cell: ({ row }) => {
      const data= row.original

      const deleteDescription= `Seguro que quieres eliminar la campaña ${data.name}?`
 
      return (
        <div className="flex items-center justify-end gap-2">

          <CampaignLink id={data.id} />

          <CampaignDialog id={data.id} clientId={data.clientId} />
          <DeleteCampaignDialog description={deleteDescription} id={data.id} />
        </div>

      )
    },
  },
]


