"use client"

import { Button } from "@/components/ui/button"
import { CarServiceDAO } from "@/services/carservice-services"
import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown } from "lucide-react"
import { format, formatDistanceToNow } from "date-fns"
import { DeleteCarServiceDialog, CarServiceDialog } from "./carservice-dialogs"
import { es } from "date-fns/locale"
import ConversationButton from "./conversation-button"


export const columns: ColumnDef<CarServiceDAO>[] = [
  
  {
    accessorKey: "nombreReserva",
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
        <div>
            <ConversationButton name={data.nombreReserva} conversationId={data.conversationId} />
            <p>{data.telefonoContacto}</p>
        </div>
      )
    },
  },

  {
    accessorKey: "localReserva",
    header: ({ column }) => {
        return (
          <Button variant="ghost" className="pl-0 dark:text-white"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Local
            <ArrowUpDown className="w-4 h-4 ml-1" />
          </Button>
    )},
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
  },

  {
    accessorKey: "fechaReserva",
    header: ({ column }) => {
        return (
          <Button variant="ghost" className="pl-0 dark:text-white"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Fecha
            <ArrowUpDown className="w-4 h-4 ml-1" />
          </Button>
    )},
  },

  {
    accessorKey: "marcaAuto",
    header: ({ column }) => {
        return (
          <Button variant="ghost" className="pl-0 dark:text-white"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Vehículo
            <ArrowUpDown className="w-4 h-4 ml-1" />
          </Button>
    )},
    cell: ({ row }) => {
      const data= row.original
      return (
        <div>
            <p className="whitespace-nowrap">{data.marcaAuto}</p>
            <p className="whitespace-nowrap">{data.modeloAuto}</p>
            <p>{data.matriculaAuto}</p>
        </div>
      )
    },
  },

  {
    accessorKey: "kilometraje",
    header: ({ column }) => {
        return (
          <Button variant="ghost" className="pl-0 dark:text-white"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Servicio
            <ArrowUpDown className="w-4 h-4 ml-1" />
          </Button>
    )},
  },

  {
    accessorKey: "UpdatedAt",
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
  {
    id: "actions",
    cell: ({ row }) => {
      const data= row.original

      const deleteDescription= `Do you want to delete CarService ${data.id}?`
 
      return (
        <div className="flex items-center justify-end gap-2">

          <CarServiceDialog id={data.id} />
          <DeleteCarServiceDialog description={deleteDescription} id={data.id} />
        </div>

      )
    },
  },
]


