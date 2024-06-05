"use client"

import { useEffect, useState } from "react";
import { ArrowLeftRight, ChevronsLeft, ChevronsRight, Loader, Pencil, PlusCircle, Trash2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { SectionDAO } from "@/services/section-services";
import { getSectionDAOAction } from "@/app/client/[slug]/sections/section-actions";
import { ScrollArea } from "@/components/ui/scroll-area";

type Props= {
  id: string
}

export function SectionDialog({ id }: Props) {
  const [open, setOpen] = useState(false);
  const [section, setSection] = useState<SectionDAO>()

  useEffect(() => {
    if (id) {
      getSectionDAOAction(id)
      .then(section => {
        if (section) setSection(section)
      })
      .catch(error => console.log(error))
    }    
  }
  , [id])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="">
          Parte {section?.secuence} de {section?.document?.name}
        </Button>
      </DialogTrigger>
      <DialogContent className="mx-5 my-10 max-w-7xl">
        <DialogHeader>
          <DialogTitle>Datos de la sección</DialogTitle>
        </DialogHeader>
        <DialogDescription className="w-full">
          {
            !section ? <Loader className="animate-spin" /> :
                <div className="">
                  <div className="max-h-full space-y-2 ">
                    <div className="grid grid-cols-[100px_minmax(0,_1fr)] gap-4 grid-tem">
                      <p>Documento:</p>
                      <p>{section.document?.name}</p>
                      <p>Parte:</p>
                      <p>{section.secuence} de {section.document?.sectionsCount}</p>
                      <p>Texto:</p>
                    </div>
                    <ScrollArea className="p-2 border rounded-md ">
                      <p className="max-h-[600px] whitespace-pre-line">{section.text}</p>
                    </ScrollArea>          
                  </div>
                </div>
          }
        </DialogDescription>
      </DialogContent>
    </Dialog>
  )
}
  
