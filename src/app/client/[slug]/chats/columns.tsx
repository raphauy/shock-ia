"use client"

import { Button } from "@/components/ui/button"
import { getFormat } from "@/lib/utils"
import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown } from "lucide-react"
import Link from "next/link"
import { DataConversationShort } from "./actions"

export const columns: ColumnDef<DataConversationShort>[] = [
  {
    accessorKey: "createdAt",
    header: ({ column }) => {
      return (
        <Button variant="ghost" className="pl-0 dark:text-white"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Creado
          <ArrowUpDown className="w-4 h-4 ml-1" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const data= row.original
      return (
        <div className="flex items-center justify-start flex-1">
          {getFormat(data.createdAt)}
        </div>
      )
    }
  },
  {
    accessorKey: "phone",
    header: ({ column }) => {
        return (
          <Button variant="ghost" className="pl-0 dark:text-white"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Celular
            <ArrowUpDown className="w-4 h-4 ml-1" />
          </Button>
    )
    },
    cell: ({ row }) => {
      const data= row.original
 
      return (
        <div className="flex items-center justify-start flex-1">
          <Link href={`/client/${data.client.slug}/chats?id=${data.id}`} prefetch={false}>
              <Button variant="link" className="pl-0 dark:text-white">
                {data.phone.slice(0, 12)}
              </Button>
          </Link>
        </div>

      )
    },

  },
]
