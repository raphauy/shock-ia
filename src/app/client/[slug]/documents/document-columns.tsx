"use client"

import { Button } from "@/components/ui/button"
import { DocumentDAO } from "@/services/document-services"
import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, FileStack, Pencil, WholeWord } from "lucide-react"
import { format } from "date-fns"
import { DeleteDocumentDialog, DocumentDialog } from "./document-dialogs"
import Link from "next/link"


export const columns: ColumnDef<DocumentDAO>[] = [
  
  {
    accessorKey: "name",
    header: ({ column }) => {
        return (
          <Button variant="ghost" className="pl-0 dark:text-white"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Name
            <ArrowUpDown className="w-4 h-4 ml-1" />
          </Button>
    )},
    cell: ({ row }) => {
      const data= row.original
      return (
        <div className="w-44">
          <Link href={`/client/${data.clientSlug}/documents/${data.id}`}>
            <Button variant="link" className="text-left">{data.name}</Button>
          </Link>
        </div>
      )
    }
  },

  {
    accessorKey: "wordsCount",
    header: ({ column }) => {
        return (
          <Button variant="ghost" className="pl-0 dark:text-white"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Info
            <ArrowUpDown className="w-4 h-4 ml-1" />
          </Button>
    )},
    cell: ({ row }) => {
      const data= row.original
      const dateStr= data.updatedAt && format(new Date(data.updatedAt), "dd MMM HH:mm")
      return (        
        <div className="flex flex-col justify-between h-24">
          <div className="w-40 text-base font-bold">
            <div className="flex items-center gap-2">
              <WholeWord /><p>{data.wordsCount} palabras</p>
            </div>
            <div className="flex items-center gap-2">
              <FileStack /><p>{data.sectionsCount === 1 ? "1 sección" : data.sectionsCount > 1 ? data.sectionsCount + " secciones" : ""}</p>
            </div>
          </div>
          <p>Act.: {dateStr}</p>
        </div>
      )
    }
  },

  {
    accessorKey: "description",
    header: ({ column }) => {
        return (
          <Button variant="ghost" className="pl-0 dark:text-white"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Description
            <ArrowUpDown className="w-4 h-4 ml-1" />
          </Button>
    )},
    cell: ({ row }) => {
      const data= row.original
      return (
        <p className="line-clamp-4">{data.description}</p>
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

      const deleteDescription= `Do you want to delete Document ${data.id}?`
 
      return (
        <div className="flex items-center justify-end gap-2">

          <DeleteDocumentDialog description={deleteDescription} id={data.id} />
        </div>

      )
    },
  },
]


