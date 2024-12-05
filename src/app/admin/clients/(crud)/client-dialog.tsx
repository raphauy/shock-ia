"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Client } from "@prisma/client"
import { useEffect, useState } from "react"
import { ClientForm, ClientFormValues } from "./clientForm"
import { useRouter } from "next/navigation"
import { ArrowLeftRight, ChevronsLeft, ChevronsRight, Loader } from "lucide-react"
import { FunctionDAO } from "@/services/function-services"
import { getComplementaryFunctionsOfClientAction, getFunctionsOfClientAction, setFunctionsAction } from "./actions"
import { toast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"

const excludedFunctions= ["", "cancelarReserva", "reservarParaEvento", "obtenerReservas", "reservarParaEventoDeUnicaVez"]

interface Props{
  title: string
  trigger: React.ReactNode
  id?: string
  create: (json: ClientFormValues) => Promise<Client | null>
  update: (clientId: string, json: ClientFormValues) => Promise<Client | null>
}

export function ClientDialog({ title, trigger, id, create, update }: Props) {
  const [open, setOpen] = useState(false);
  const router= useRouter()

  function handleClose() {
    setOpen(false)
    router.push(`/admin/clients?refresh=${Date.now()}`)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <ClientForm create={create} update={update} closeDialog={handleClose} id={id} />
      </DialogContent>
    </Dialog>
  )
}

interface CollectionProps{
  id: string
  title: string
}

export function FunctionsDialog({ id, title }: CollectionProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <ArrowLeftRight className="hover:cursor-pointer" />
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <ClientFunctionsBox closeDialog={() => setOpen(false)} clientId={id} />
      </DialogContent>
    </Dialog>
  );
}      


type ClientFunctionBoxProps= {
  clientId: string
  closeDialog?: () => void
}

export function ClientFunctionsBox({ clientId, closeDialog }: ClientFunctionBoxProps) {

  const [loading, setLoading] = useState(false)
  const [functions, setFunctions] = useState<FunctionDAO[]>([])
  const [complementary, setComplementary] = useState<FunctionDAO[]>([])
  const [haveToSave, setHaveToSave] = useState(false)

  useEffect(() => {
    setLoading(true)
    getFunctionsOfClientAction(clientId)
    .then((data) => {
        if(!data) return null
        // filter and exclude event functions
        const eventFunctions= data.filter((f) => !excludedFunctions.includes(f.name))
        setFunctions(eventFunctions)
    })
    .catch((error) => {
        console.error(error)
    })
    
    getComplementaryFunctionsOfClientAction(clientId)
    .then((data) => {
        if(!data) return null
        // filter and exclude event functions
        const eventFunctions= data.filter((f) => !excludedFunctions.includes(f.name))
        setComplementary(eventFunctions)
    })
    .catch((error) => {
        console.error(error)
    })

    setLoading(false)
  }, [clientId])

  function complementaryIn(id: string) {
      const comp= complementary.find((c) => c.id === id)
      if(!comp) return
      const newComplementary= complementary.filter((c) => c.id !== id)
      setComplementary(newComplementary)
      setFunctions([...functions, comp])
      setHaveToSave(true)
  }

  function complementaryOut(id: string) {            
      const comp= functions.find((c) => c.id === id)
      if(!comp) return
      const newComplementary= functions.filter((c) => c.id !== id)
      setFunctions(newComplementary)
      setComplementary([...complementary, comp])
      setHaveToSave(true)
  }

  function allIn() {
      setFunctions([...functions, ...complementary])
      setComplementary([])
      setHaveToSave(true)
  }

  function allOut() {
      setComplementary([...complementary, ...functions])
      setFunctions([])
      setHaveToSave(true)
  }

  async function handleSave() {
      setLoading(true)
      setFunctionsAction(clientId, functions.map((u) => u.id))
      .then(() => {
          toast({ title: "Funciones Actualizadas" })
          setHaveToSave(false)
          closeDialog && closeDialog()
      })
      .catch((error) => {
          toast({ title: "Error al actualizar funciones", variant: "destructive"})
      })
      .finally(() => {
          setLoading(false)
      })
  }

  return (
      <div>
          <div className="flex justify-between">
            <p>👇🏼 Funciones aplicadas a este cliente</p>
            <p>👇🏼 Funciones a un click de ser aplicadas a este cliente</p>
          </div>
          <div className="grid grid-cols-2 gap-4 p-3 border rounded-md min-w-[400px] w-full">
            {
              loading ? <div className="flex items-center justify-center w-full h-full col-span-2"><Loader className="w-10 h-10 animate-spin" /></div> : 
              <>
              <ScrollArea className="h-[300px] border-r">
                <div className="flex flex-col">
                {
                    functions.map((item) => {
                      const haveRepository= item.repositories && item.repositories.length > 0
                      return (
                          <div key={item.id} className="flex items-center justify-between gap-2 mb-1 mr-5">
                              <p className="text-green-500 whitespace-nowrap">{item.name}</p>
                              <Button variant="secondary" className="h-7" onClick={() => complementaryOut(item.id)} disabled={haveRepository || item.name === "obtenerDisponibilidad"}>
                                <ChevronsRight />
                              </Button>
                          </div>
                      )})
                }
                        {/* <div className="flex items-end justify-between flex-1 gap-2 mb-1 mr-5">
                            <p>Todos</p>
                            <Button variant="secondary" className="h-7" onClick={() => allOut()}><ChevronsRight /></Button>
                        </div> */}
                </div>
              </ScrollArea>
              <ScrollArea className="h-[300px]">
                <div className="flex flex-col">
                {
                    complementary.map((item) => {
                      return (
                          <div key={item.id} className="flex items-center gap-2 mb-1">
                              <Button variant="secondary" className="h-7 x-7" onClick={() => complementaryIn(item.id)} disabled={item.name === "obtenerDisponibilidad"}>
                                  <ChevronsLeft />
                              </Button>
                              <p className="whitespace-nowrap">{item.name}</p>
                          </div>
                      )})
                }
                    <div className="flex items-end flex-1 gap-2 mb-1">
                        <Button variant="secondary" className="h-7" onClick={() => allIn()}><ChevronsLeft /></Button>
                        <p>Todos</p>
                    </div>
                </div>
              </ScrollArea>
              </>
            }
            </div>

          <div className="flex justify-end mt-4">
              <Button variant="outline" className={cn("w-32 ml-2", haveToSave && "text-white bg-red-500")} onClick={handleSave} disabled={!haveToSave} >
                {loading ? <Loader className="animate-spin" /> : <p>Guardar</p>}
              </Button>
          </div>
      </div>
  )
} 
  
