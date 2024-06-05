"use client"

import { Button } from "@/components/ui/button"
import { SummitDAO } from "@/services/summit-services"
import { ColumnDef } from "@tanstack/react-table"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"
import { ArrowUpDown } from "lucide-react"
import { DeleteSummitDialog, SummitDialog } from "./summit-dialogs"
import Link from "next/link"


export const columns: ColumnDef<SummitDAO>[] = [
  
  {
    accessorKey: "nombreReserva",
    header: ({ column }) => {
        return (
          <Button variant="ghost" className="pl-0 dark:text-white"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Cliente
            <ArrowUpDown className="w-4 h-4 ml-1" />
          </Button>
    )},
		cell: ({ row }) => {
      const data= row.original
      
      return (
        <Link href={`/client/summit/chats?id=${data.conversationId}`}>
          <div className="flex flex-col justify-between p-2 border rounded-md shadow-md min-h-[130px]">
            <p className="text-base font-bold whitespace-nowrap">{data.nombreReserva}</p>
            <p>{data.email}</p>
          </div>
        </Link>
      )
    }
  },

  {
    accessorKey: "email",
    header: ({ column }) => {
        return (
          <Button variant="ghost" className="pl-0 dark:text-white"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Cumpleaños
            <ArrowUpDown className="w-4 h-4 ml-1" />
          </Button>
    )},
		cell: ({ row }) => {
      const data= row.original
      return (
        <div className="flex flex-col justify-between p-2 border rounded-md shadow-md min-h-[130px] min-w-[200px]">
          <p>Cumpleañero: {data.nombreCumpleanero}</p>
          <p>{data.cantidadInvitados} Invitados</p>
          <p>Fecha: {data.fechaReserva}</p>
        </div>
      )
    }
  },

  {
    accessorKey: "id",
    header: ({ column }) => {
        return (
          <Button variant="ghost" className="pl-0 dark:text-white"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Resumen
            <ArrowUpDown className="w-4 h-4 ml-1" />
          </Button>
    )},
		cell: ({ row }) => {
      const data= row.original
      return (
        <div className="">
          <p>{data.resumenConversacion}</p>
        </div>
      )
    }
  },


  {
    accessorKey: "updatedAt",
    header: ({ column }) => {
        return (
          <Button variant="ghost" className="pl-0 dark:text-white"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Reservado
            <ArrowUpDown className="w-4 h-4 ml-1" />
          </Button>
    )},
		cell: ({ row }) => {
      const data= row.original
      return (<p>{formatDistanceToNow(data.createdAt, {locale: es})}</p>)
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

      const deleteDescription= `Do you want to delete Summit ${data.id}?`
 
      return (
        <div className="flex items-center justify-end gap-2">

          <DeleteSummitDialog description={deleteDescription} id={data.id} />
        </div>

      )
    },
  },
]


