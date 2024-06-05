"use client"

import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { Ban, Check, ChevronsRight, ChevronsUpDown, LayoutDashboard, PlusCircle, Search } from "lucide-react"
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation"
import { Separator } from "../ui/separator"
import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import { useSession } from "next-auth/react"

export type SelectorData={
    slug: string,
    name: string
}

interface Props{
    selectors: SelectorData[]
}
export function ModelSelector({ selectors }: Props) {
  const params= useParams()
  const slug= params.slug
  
  const searchParams= useSearchParams()
  const model= searchParams.get("model")

  const [value, setValue] = useState(model || "")

  const [open, setOpen] = useState(false)
  const [searchValue, setSearchValue] = useState("")
  // const [search, setSearch] = useState("")
  const router= useRouter()
  const path= usePathname()

  const user= useSession()?.data?.user
  const isAdmin= user?.role === "admin"
  
  useEffect(() => {
    
    const itemName= selectors.find(selector => selector.slug === model)?.name
    itemName ? setValue(itemName) : setValue("")

  }, [path, selectors, searchParams, model])
  

  const filteredValues = useMemo(() => {
    if (!searchValue) return selectors
    const lowerCaseSearchValue = searchValue.toLowerCase();
    return selectors.filter((line) => 
    line.name.toLowerCase().includes(lowerCaseSearchValue)
    )
  }, [selectors, searchValue])

  const customFilter = (searchValue: string, itemValue: string) => {      
    return itemValue.toLowerCase().includes(searchValue.toLowerCase()) ? searchValue.toLowerCase().length : 0
  }      
    
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value)
  }

  if (!isAdmin) return null

  return (
    <div className="w-full px-1 ">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            role="combobox"
            aria-expanded={open}
            className="justify-between w-full text-lg whitespace-nowrap bg-intraprop-color min-w-[230px]"
          >
            {value
              ? selectors.find(selector => selector.name.toLowerCase() === value.toLowerCase())?.name
              : "Seleccionar modelo"}
            <ChevronsUpDown className="w-4 h-4 ml-2 opacity-50 shrink-0" />
          </Button>
        </PopoverTrigger>

        <PopoverContent className="min-w-[230px] p-0">
          <Command filter={customFilter} >
            <div className='flex items-center w-full gap-1 p-2 border border-gray-300 rounded-md shadow'>
                <Search className="w-4 h-4 mx-1 opacity-50 shrink-0" />
                <input placeholder="Buscar cliente..." onInput={handleInputChange} value={searchValue} className="w-full bg-transparent focus:outline-none"/>
            </div>
            
            <CommandEmpty>modelo no encontrado</CommandEmpty>
            <CommandGroup>
              {filteredValues.map((item, index) => {
                if (index >= 10) return null
                return (
                  <CommandItem
                    key={item.slug}
                    onSelect={(currentValue) => {
                      if (currentValue === value) {
                        setValue("")
                      } else {
                        setValue(currentValue)
                        router.push(`/client/${slug}/simulator?model=${item.slug}`)
                      }
                      setSearchValue("")
                      setOpen(false)
                    }}
                  >
                    <Check className={cn("mr-2 h-4 w-4", value.toLowerCase() === item.name.toLowerCase() ? "opacity-100" : "opacity-0")}/>
                    <Image src={getImage(item.name)} alt={item.name} width={20} height={20} className="w-4 h-4 ml-2 mr-2" />
                    {item.name}
                  </CommandItem>
              )})}

              {filteredValues.length - 10 > 0 &&
                <div className="flex items-center mt-5 font-bold">
                  <ChevronsRight className="w-5 h-5 ml-1 mr-2"/>
                  <p className="text-sm">Hay {filteredValues.length - 10} clientes más</p>
                </div>
              }

            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
    </div>

  )
}
  
function getImage(name: string) {
  if (name.includes("gpt")) 
    return "/openai.svg"
  else if (name.includes("llama"))
    return "/meta.svg"
  else if (name.includes("gemini"))
    return "/google.svg"
  else if (name.includes("mixtral"))
    return "/mistral.svg"
  else return "/openai.svg"
  
}