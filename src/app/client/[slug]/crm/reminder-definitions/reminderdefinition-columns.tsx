"use client"

import { Button } from "@/components/ui/button"
import { ReminderDefinitionDAO } from "@/services/reminder-definition-services"
import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown } from "lucide-react"
import { format } from "date-fns"
import { DeleteReminderDefinitionDialog, ReminderDefinitionDialog } from "./reminderdefinition-dialogs"
import { formatMinutesDelay } from "@/lib/utils"


export const columns: ColumnDef<ReminderDefinitionDAO>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <Button variant="ghost" className="pl-0 dark:text-white"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Nombre
          <ArrowUpDown className="w-4 h-4 ml-1" />
        </Button>
      )
    },
    filterFn: (row, id, value) => {
      const data = row.original
      const valueLower = value.toLowerCase()
      return !!(data.name?.toLowerCase().includes(valueLower) ||
        data.message?.toLowerCase().includes(valueLower) ||
        data.clientId?.toLowerCase().includes(valueLower))
    },
  },
  
  {
    accessorKey: "description",
    header: ({ column }) => {
        return (
          <Button variant="ghost" className="pl-0 dark:text-white"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Descripción
            <ArrowUpDown className="w-4 h-4 ml-1" />
          </Button>
    )},
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
    accessorKey: "minutesDelay",
    header: ({ column }) => {
        return (
          <Button variant="ghost" className="pl-0 dark:text-white"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Tiempo
            <ArrowUpDown className="w-4 h-4 ml-1" />
          </Button>
    )},
    cell: ({ row }) => {
      const data = row.original;
      return <span>{formatMinutesDelay(data.minutesDelay, data.past)}</span>
    }
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const data = row.original;

      const deleteDescription = `¿Estás seguro que deseas eliminar la plantilla "${data.name}"?`;
 
      return (
        <div className="flex items-center justify-end gap-2">
          <ReminderDefinitionDialog id={data.id} clientId={data.clientId} past={data.past} />
          <DeleteReminderDefinitionDialog description={deleteDescription} id={data.id} />
        </div>
      )
    },
  },
]


