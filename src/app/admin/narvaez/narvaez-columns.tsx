"use client"

import { Button } from "@/components/ui/button"
import { NarvaezDAO } from "@/services/narvaez-services"
import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown } from "lucide-react"
import { format, formatDistanceToNow } from "date-fns"
import { DeleteNarvaezDialog, NarvaezDialog } from "./narvaez-dialogs"
import Link from "next/link"
import { es } from "date-fns/locale"


export const columns: ColumnDef<NarvaezDAO>[] = [
  
  {
    accessorKey: "conversation",
    header: ({ column }) => {
      return (<p>Conversación</p>)
    },
    cell: ({ row }) => {
      const data= row.original

      return (
        <div>
          <Link href={`/client/narvaez/chats?id=${data.conversationId}`}>
            <Button variant="link" className="px-0">{data.conversation.phone}</Button>            
          </Link>
          <p>{data.nombre}</p>
          {data.email && <p>{data.email}</p>}
        </div>
      )
    },
  },
  
  {
    accessorKey: "clasificacion",
    header: ({ column }) => {
        return (
          <Button variant="ghost" className="pl-0 dark:text-white"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Clasificación
            <ArrowUpDown className="w-4 h-4 ml-1" />
          </Button>
    )},
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
  },

  {
    accessorKey: "idTrackeo",
    header: ({ column }) => {
      return (<p>Datos</p>)
    },
    cell: ({ row }) => {
      const data= row.original

      return (
        <div className="grid grid-cols-2">
          <p>Id.Trackeo:</p>
          <p>{data.idTrackeo}</p>
          <p>Id.Propiedad:</p>
          <p>{data.idPropiedad}</p>
          <p>URL:</p>
          <div>

            {
              data.urlPropiedad &&
              <Link href={data.urlPropiedad} target="_blank">
                <Button variant="link" className="h-5 p-0">URL</Button>
              </Link>
            }
           </div>
        </div>
      )
    },
  },

  {
    accessorKey: "resumenPedido",
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
        <div>
          <p>{data.resumenPedido}</p>
          {data.consulta && <p className="mt-5">Consulta: {data.consulta}</p>}
          <p className="mt-5">Consulta adicional: {data.consultaAdicional}</p>
          <p className="mt-5">Horario de contacto: {data.horarioContacto}</p>
        </div>
      )
    }
  },

  {
    id: "actions",
    cell: ({ row }) => {
      const data= row.original

      const deleteDescription= `Do you want to delete Narvaez ${data.id}?`
 
      return (
        <div className="flex items-center justify-end gap-2">
          <p className="">
            {formatDistanceToNow(data.createdAt, {locale: es})}
          </p>
          <DeleteNarvaezDialog description={deleteDescription} id={data.id} />
        </div>
      )
    },
  },
]


