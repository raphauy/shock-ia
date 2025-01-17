"use client"

import { Button } from "@/components/ui/button"
import { FieldValueDAO } from "@/services/fieldvalue-services"
import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown } from "lucide-react"
import { format } from "date-fns"
import { DeleteFieldValueDialog, FieldValueDialog } from "./fieldvalue-dialogs"


export const columns: ColumnDef<FieldValueDAO>[] = [
  {
    accessorKey: "value",
    header: ({ column }) => {
      return (
        <Button variant="ghost" className="pl-0 dark:text-white"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Value
          <ArrowUpDown className="w-4 h-4 ml-1" />
        </Button>
      )
    },
    filterFn: (row, id, value) => {
      const data = row.original
      const valueLower = value.toLowerCase()
      return !!(data.value?.toLowerCase().includes(valueLower) ||
        data.contactId?.toLowerCase().includes(valueLower) ||
        data.customFieldId?.toLowerCase().includes(valueLower))
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

      const deleteDescription= `Do you want to delete FieldValue ${data.id}?`
 
      return (
        <div className="flex items-center justify-end gap-2">

          <FieldValueDialog id={data.id} customFieldType={data.customField.type} contactId={data.contactId} customFieldId={data.customFieldId} customFieldName={data.customField.name} update={() => {}} />
          <DeleteFieldValueDialog description={deleteDescription} id={data.id} />
        </div>

      )
    },
  },
]


