"use client"

import { Button } from "@/components/ui/button"
import { ModelDAO } from "@/services/model-services"
import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, Ban, CheckCircle } from "lucide-react"
import { format } from "date-fns"
import { DeleteModelDialog, ModelDialog } from "./model-dialogs"
import { formatCurrency } from "@/lib/utils"


export const columns: ColumnDef<ModelDAO>[] = [
  
  {
    accessorKey: "name",
    header: ({ column }) => {
        return (
          <Button variant="ghost" className="pl-0 dark:text-white"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Modelo
          </Button>
    )},
    cell: ({ row }) => {
      const data= row.original
      return <div className="font-bold whitespace-nowrap">{data.name}</div>
    },
  },

  {
    accessorKey: "providerName",
    header: ({ column }) => {
        return (
          <Button variant="ghost" className="pl-0 dark:text-white"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Proveedor
          </Button>
    )},
  },
  
  {
    accessorKey: "inputPrice",
    header: ({ column }) => {
        return (
          <Button variant="ghost" className="pl-0 dark:text-white"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Precio 1M PT (input)
          </Button>
    )},
    cell: ({ row }) => {
      const data= row.original
      return <div className="pr-10 text-right">{formatCurrency(data.inputPrice)}</div>
    },
  },

  {
    accessorKey: "outputPrice",
    header: ({ column }) => {
        return (
          <Button variant="ghost" className="pl-0 dark:text-white"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Precio 1M CT (output)
          </Button>
    )},
    cell: ({ row }) => {
      const data= row.original
      return <div className="pr-10 text-right">{formatCurrency(data.outputPrice)}</div>
    },
  },

  {
    accessorKey: "contextSize",
    header: ({ column }) => {
        return (
          <Button variant="ghost" className="pl-0 dark:text-white"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Contexto (tokens)
          </Button>
    )},
    cell: ({ row }) => {
      const data= row.original
      return <div className="pr-10 text-right">{data.contextSize}</div>
    },  
  },

  {
    accessorKey: "streaming",
    header: ({ column }) => {
        return (
          <Button variant="ghost" className="pl-0 dark:text-white"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Streaming
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

  {
    id: "actions",
    cell: ({ row }) => {
      const data= row.original

      const deleteDescription= `Do you want to delete Model ${data.id}?`
 
      return (
        <div className="flex items-center justify-end gap-2">

          <ModelDialog id={data.id} />
          <DeleteModelDialog description={deleteDescription} id={data.id} />
        </div>

      )
    },
  },
]


