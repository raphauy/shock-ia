"use client"

import { Button } from "@/components/ui/button"
import { FunctionDAO } from "@/services/function-services"
import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown } from "lucide-react"
import { format } from "date-fns"
import { DeleteFunctionDialog, FunctionDialog } from "./function-dialogs"


export const columns: ColumnDef<FunctionDAO>[] = [
  
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
    accessorKey: "definition",
    header: ({ column }) => {
        return (
          <Button variant="ghost" className="pl-0 dark:text-white"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Definición
            <ArrowUpDown className="w-4 h-4 ml-1" />
          </Button>
    )},
    cell: ({ row }) => {
      const data= row.original
      return (
        <p className="text-sm whitespace-pre-wrap">{data.definition}</p>
      )
    }
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const data= row.original

      const deleteDescription= `Do you want to delete Function ${data.id}?`
 
      return (
        <div className="flex items-center justify-end gap-2">

          <FunctionDialog id={data.id} />
          <DeleteFunctionDialog description={deleteDescription} id={data.id} />
        </div>

      )
    },
  },
]


