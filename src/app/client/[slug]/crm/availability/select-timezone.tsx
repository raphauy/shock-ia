"use client"

import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { toast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"
import { Check, ChevronsUpDown, Globe, Loader, Search } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { setTimezoneAction } from "./actions"

type Props = {
  clientId: string
  initialValue: string
}

export function SelectTimezoneForm({ clientId, initialValue }: Props) {
  const [loading, setLoading] = useState(false)
  const [value, setValue] = useState(initialValue)
  const [open, setOpen] = useState(false)
  const [searchValue, setSearchValue] = useState("")

  useEffect(() => {
    setValue(initialValue)
  }, [initialValue])

  async function onChange(newValue: string) {
    setValue(newValue)
    setLoading(true)
    const ok = await setTimezoneAction(clientId, newValue)
    setLoading(false)
    if (ok) {
      toast({ title: `Zona horaria actualizada` })
    } else {
      toast({ title: `Error al actualizar la zona horaria`, variant: "destructive" })
    }
  }

  const timezones = getTimezones()
  
  const filteredTimezones = useMemo(() => {
    if (!searchValue) return timezones
    const lowerCaseSearchValue = searchValue.toLowerCase()
    return timezones.filter((tz) => 
      tz.toLowerCase().includes(lowerCaseSearchValue)
    )
  }, [timezones, searchValue])

  const customFilter = (searchValue: string, itemValue: string) => {      
    return itemValue.toLowerCase().includes(searchValue.toLowerCase()) ? searchValue.toLowerCase().length : 0
  }

  return (
    <div className="mt-6 border rounded-md p-4 w-full xl:max-w-2xl">
      <div className="">
        <div className="flex items-center gap-2 mb-2 font-bold border-b">
          <Globe className="w-5 h-5" />
          Zona horaria del cliente:
          {loading && <Loader className="animate-spin" />}
        </div>
        <div className="">
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="justify-between w-full"
              >
                {value || "Seleccionar zona horaria..."}
                {loading ? (
                  <Loader className="w-4 h-4 ml-2 animate-spin" />
                ) : (
                  <ChevronsUpDown className="w-4 h-4 ml-2 opacity-50 shrink-0" />
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0">
              <Command filter={customFilter}>
                <div className='flex items-center w-full gap-1 p-2 border border-gray-300 rounded-md shadow'>
                  <Search className="w-4 h-4 mx-1 opacity-50 shrink-0" />
                  <input 
                    placeholder="Buscar zona horaria..." 
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    className="w-full bg-transparent focus:outline-none"
                  />
                </div>
                <CommandEmpty>Zona horaria no encontrada</CommandEmpty>
                <CommandGroup className="max-h-[300px] overflow-auto">
                  {filteredTimezones.map((timezone) => (
                    <CommandItem
                      key={timezone}
                      onSelect={(currentValue) => {
                        onChange(timezone)
                        setSearchValue("")
                        setOpen(false)
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value === timezone ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {timezone}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  )
}

function getTimezones() {
  return Intl.supportedValuesOf("timeZone")
}