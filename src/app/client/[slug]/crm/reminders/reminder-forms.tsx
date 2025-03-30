"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { toast } from "@/hooks/use-toast"
import { useEffect, useState, useMemo } from "react"
import { deleteReminderAction, createOrUpdateReminderAction, getReminderDAOAction } from "./reminder-actions"
import { ReminderSchema, ReminderFormValues } from '@/services/reminder-services'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Loader, Search, Check, ChevronsUpDown } from "lucide-react"
import { DatePicker } from "@/components/date-picker"
import { ReminderStatus } from "@prisma/client"
import { ContactDAO } from "@/services/contact-services"
import { ReminderDefinitionDAO } from "@/services/reminder-definition-services"
import { Command, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"



type Props = {
  id?: string
  contacts: ContactDAO[]
  reminderDefinitions: ReminderDefinitionDAO[]
  closeDialog: () => void
}

export function ReminderForm({ id, contacts, reminderDefinitions, closeDialog }: Props) {
  const form = useForm<ReminderFormValues>({
    resolver: zodResolver(ReminderSchema),
    defaultValues: {},
    mode: "onChange",
  })
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [searchValue, setSearchValue] = useState("")
  const [openDefinition, setOpenDefinition] = useState(false)
  const [searchDefinitionValue, setSearchDefinitionValue] = useState("")


  const onSubmit = async (data: ReminderFormValues) => {
    setLoading(true)
    try {
      await createOrUpdateReminderAction(id ? id : null, data)
      toast({ title: id ? "Reminder updated" : "Reminder created" })
      closeDialog()
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (id) {
      getReminderDAOAction(id).then((data) => {
        if (data) {
          const formData = {
            ...data,
            bookingId: data.bookingId || undefined,
            abandonedOrderId: data.abandonedOrderId || undefined
          }
          form.reset(formData)
        }
        Object.keys(form.getValues()).forEach((key: any) => {
          if (form.getValues(key) === null) {
            form.setValue(key, "")
          }
        })
      })
    }
  }, [form, id])

  const filteredContacts = useMemo(() => {
    if (!searchValue) return contacts
    const lowerCaseSearchValue = searchValue.toLowerCase();
    return contacts.filter((contact) => 
      contact.name.toLowerCase().includes(lowerCaseSearchValue) ||
      contact.phone?.toLowerCase().includes(lowerCaseSearchValue)
    )
  }, [contacts, searchValue])

  const customFilter = (searchValue: string, itemValue: string) => {      
    return itemValue.toLowerCase().includes(searchValue.toLowerCase()) ? searchValue.toLowerCase().length : 0
  }      
    
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value)
  }

  const filteredDefinitions = useMemo(() => {
    if (!searchDefinitionValue) return reminderDefinitions
    const lowerCaseSearchValue = searchDefinitionValue.toLowerCase();
    return reminderDefinitions.filter((definition) => 
      definition.name.toLowerCase().includes(lowerCaseSearchValue) ||
      definition.description?.toLowerCase().includes(lowerCaseSearchValue)
    )
  }, [reminderDefinitions, searchDefinitionValue])

  const handleDefinitionInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchDefinitionValue(e.target.value)
  }

  return (
    <div className="rounded-md">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

          <FormField
            control={form.control}
            name="eventTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fecha y hora del evento a simular</FormLabel>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <DatePicker 
                      date={field.value} 
                      setDate={(date) => {
                        if (date && field.value) {
                          // Mantener la hora actual al cambiar la fecha
                          const currentHours = field.value.getHours()
                          const currentMinutes = field.value.getMinutes()
                          date.setHours(currentHours)
                          date.setMinutes(currentMinutes)
                        }
                        field.onChange(date)
                      }} 
                      label="Fecha" 
                    />
                  </div>
                  <div className="flex gap-2">
                    <Select
                      value={field.value ? field.value.getHours().toString().padStart(2, '0') : undefined}
                      onValueChange={(hour) => {
                        const newDate = field.value ? new Date(field.value) : new Date()
                        newDate.setHours(parseInt(hour))
                        field.onChange(newDate)
                      }}
                    >
                      <SelectTrigger className="w-[100px]">
                        <SelectValue placeholder="Hora" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 24 }, (_, i) => (
                          <SelectItem key={i} value={i.toString().padStart(2, '0')}>
                            {i.toString().padStart(2, '0')}:00
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select
                      value={field.value ? field.value.getMinutes().toString().padStart(2, '0') : undefined}
                      onValueChange={(minute) => {
                        const newDate = field.value ? new Date(field.value) : new Date()
                        newDate.setMinutes(parseInt(minute))
                        field.onChange(newDate)
                      }}
                    >
                      <SelectTrigger className="w-[100px]">
                        <SelectValue placeholder="Minutos" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 12 }, (_, i) => i * 5).map((minute) => (
                          <SelectItem key={minute} value={minute.toString().padStart(2, '0')}>
                            {minute.toString().padStart(2, '0')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {field.value && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {format(field.value, "EEEE d 'de' MMMM 'de' yyyy 'a las' HH:mm", { locale: es })}
                  </p>
                )}
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="reminderDefinitionId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Plantilla</FormLabel>
                <FormControl>
                  <Popover open={openDefinition} onOpenChange={setOpenDefinition}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={openDefinition}
                        className="justify-between w-full"
                      >
                        {field.value
                          ? (() => {
                              const definition = reminderDefinitions.find(d => d.id === field.value)
                              return definition ? `${definition.name}` : "Selecciona un tipo"
                            })()
                          : "Selecciona un tipo"}
                        <ChevronsUpDown className="w-4 h-4 ml-2 opacity-50 shrink-0" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command filter={customFilter}>
                        <div className='flex items-center w-full gap-1 p-2 border border-gray-300 rounded-md shadow'>
                          <Search className="w-4 h-4 mx-1 opacity-50 shrink-0" />
                          <input 
                            placeholder="Buscar tipo..." 
                            onInput={handleDefinitionInputChange} 
                            value={searchDefinitionValue} 
                            className="w-full bg-transparent focus:outline-none"
                          />
                        </div>
                        <CommandEmpty>Tipo no encontrado</CommandEmpty>
                        <CommandGroup>
                          {filteredDefinitions.map((definition) => (
                            <CommandItem
                              key={definition.id}
                              onSelect={() => {
                                field.onChange(definition.id)
                                setSearchDefinitionValue("")
                                setOpenDefinition(false)
                              }}
                            >
                              <Check className={cn(
                                "mr-2 h-4 w-4",
                                field.value === definition.id ? "opacity-100" : "opacity-0"
                              )}/>
                              {definition.name}
                              {definition.description && (
                                <span className="ml-2 text-sm text-muted-foreground">
                                  ({definition.description})
                                </span>
                              )}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de recordatorio</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value || "GENERIC"}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecciona un tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GENERIC">Genérico</SelectItem>
                    <SelectItem value="BOOKING">Reserva</SelectItem>
                    <SelectItem value="ABANDONED_ORDER">Orden abandonada</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="contactId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contacto</FormLabel>
                <FormControl>
                  <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="justify-between w-full"
                      >
                        {field.value
                          ? (() => {
                              const contact = contacts.find(c => c.id === field.value)
                              return contact ? `${contact.name} (${contact.phone})` : "Selecciona un contacto"
                            })()
                          : "Selecciona un contacto"}
                        <ChevronsUpDown className="w-4 h-4 ml-2 opacity-50 shrink-0" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command filter={customFilter}>
                        <div className='flex items-center w-full gap-1 p-2 border border-gray-300 rounded-md shadow'>
                          <Search className="w-4 h-4 mx-1 opacity-50 shrink-0" />
                          <input 
                            placeholder="Buscar contacto..." 
                            onInput={handleInputChange} 
                            value={searchValue} 
                            className="w-full bg-transparent focus:outline-none"
                          />
                        </div>
                        <CommandEmpty>Contacto no encontrado</CommandEmpty>
                        <CommandGroup>
                          {filteredContacts.map((contact) => (
                            <CommandItem
                              key={contact.id}
                              onSelect={() => {
                                field.onChange(contact.id)
                                setSearchValue("")
                                setOpen(false)
                              }}
                            >
                              <Check className={cn(
                                "mr-2 h-4 w-4",
                                field.value === contact.id ? "opacity-100" : "opacity-0"
                              )}/>
                              {contact.name} ({contact.phone})
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex justify-end">
            <Button onClick={() => closeDialog()} type="button" variant={"secondary"} className="w-32">Cancelar</Button>
            <Button type="submit" className="w-32 ml-2">
              {loading ? <Loader className="h-4 w-4 animate-spin" /> : <p>Guardar</p>}
            </Button>
          </div>
        </form>
      </Form>
    </div>     
  )
}

type DeleteProps= {
  id: string
  closeDialog: () => void
}

export function DeleteReminderForm({ id, closeDialog }: DeleteProps) {
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    if (!id) return
    setLoading(true)
    deleteReminderAction(id)
    .then(() => {
      toast({title: "Reminder deleted" })
    })
    .catch((error) => {
      toast({title: "Error", description: error.message, variant: "destructive"})
    })
    .finally(() => {
      setLoading(false)
      closeDialog && closeDialog()
    })
  }
  
  return (
    <div>
      <Button onClick={() => closeDialog && closeDialog()} type="button" variant={"secondary"} className="w-32">Cancelar</Button>
      <Button onClick={handleDelete} variant="destructive" className="w-32 ml-2 gap-1">
        { loading && <Loader className="h-4 w-4 animate-spin" /> }
        Eliminar  
      </Button>
    </div>
  )
}
