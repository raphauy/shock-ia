"use client"

import { Button } from "@/components/ui/button"
import { ProviderDAO } from "@/services/provider-services"
import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, Ban, CheckCircle } from "lucide-react"
import { format } from "date-fns"
import { DeleteProviderDialog, ProviderDialog } from "./provider-dialogs"


export const columns: ColumnDef<ProviderDAO>[] = [
  
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
  },

  {
    accessorKey: "baseUrl",
    header: ({ column }) => {
        return (
          <Button variant="ghost" className="pl-0 dark:text-white"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            BaseUrl
            <ArrowUpDown className="w-4 h-4 ml-1" />
          </Button>
    )},
  },

  {
    accessorKey: "streaming",
    header: ({ column }) => {
        return (
          <Button variant="ghost" className="pl-0 dark:text-white"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Streaming
            <ArrowUpDown className="w-4 h-4 ml-1" />
          </Button>
    )},
    cell: ({ row }) => {
      const data= row.original
      return (
        <div className="flex items-center gap-2">
          {
            data.streaming ? <CheckCircle className="w-5 h-5 text-green-500" /> : <Ban className="w-5 h-5 text-red-500" />
          }
        </div>
      )
    },
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

      const deleteDescription= `Do you want to delete Provider ${data.id}?`
 
      return (
        <div className="flex items-center justify-end gap-2">

          <ProviderDialog id={data.id} />
          <DeleteProviderDialog description={deleteDescription} id={data.id} />
        </div>

      )
    },
  },
]


