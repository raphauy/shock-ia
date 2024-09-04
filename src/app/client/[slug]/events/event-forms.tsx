"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { toast } from "@/components/ui/use-toast"
import { useEffect, useState } from "react"
import { deleteEventAction, createOrUpdateEventAction, getEventDAOAction } from "./event-actions"
import { eventSchema, EventFormValues } from '@/services/event-services'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Loader } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { cn } from "@/lib/utils"
import { useParams } from "next/navigation"

type Props= {
  id?: string
  closeDialog: () => void
}

export function EventForm({ id, closeDialog }: Props) {
  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      name: "",
      slug: "",
      color: "",
      description: "",
      address: "",
      duration: "60",
      seatsPerTimeSlot: "1",
      price: "0",
      isArchived: false,
    },
    mode: "onChange",
  })
  const [loading, setLoading] = useState(false)

  const params= useParams()
  const clientSlug= params.slug as string

  const onSubmit = async (data: EventFormValues) => {
    setLoading(true)
    try {
      await createOrUpdateEventAction(clientSlug, id ? id : null, data)
      toast({ title: id ? "Event updated" : "Event created" })
      closeDialog()
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (id) {
      getEventDAOAction(id).then((data) => {
        if (data) {
          data.duration && form.setValue("duration", data.duration.toString())
          data.seatsPerTimeSlot && form.setValue("seatsPerTimeSlot", data.seatsPerTimeSlot.toString())
          data.price && form.setValue("price", data.price.toString())
          form.setValue("name", data.name)
          form.setValue("slug", data.slug)
          form.setValue("description", data.description)
          form.setValue("color", data.color)
          form.setValue("address", data.address)
          form.setValue("isArchived", data.isArchived)
        }
        Object.keys(form.getValues()).forEach((key: any) => {
          if (form.getValues(key) === null) {
            form.setValue(key, "")
          }
        })
      })
    }
  }, [form, id])

  return (
    <div className="p-4 bg-white rounded-md">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input placeholder="Event's name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
      
          <FormField
            control={form.control}
            name="slug"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Slug</FormLabel>
                <FormControl>
                  <Input placeholder="Event's slug" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
      
          <FormField
            control={form.control}
            name="duration"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Duration</FormLabel>
                <FormControl>
                  <Input placeholder="Event's duration" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
      
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Input placeholder="Event's description" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
      
          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Address</FormLabel>
                <FormControl>
                  <Input placeholder="Event's address" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
      
          <FormField
            control={form.control}
            name="seatsPerTimeSlot"
            render={({ field }) => (
              <FormItem>
                <FormLabel>SeatsPerTimeSlot</FormLabel>
                <FormControl>
                  <Input placeholder="Event's seatsPerTimeSlot" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
      
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Price</FormLabel>
                <FormControl>
                  <Input placeholder="Event's price" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
      
          <FormField
            control={form.control}
            name="isArchived"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center gap-2">
                  <FormLabel className="mt-1">Archivado</FormLabel>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </div>
                <FormDescription>Si está marcado, el el evento dejará de estar disponible para reservas</FormDescription> 
                <FormMessage />
              </FormItem>
            )}
          />

<FormField
          control={form.control}
          name="color"
          render={({ field }) => (
            <FormItem className="space-y-1">
              <FormLabel>Color</FormLabel>
              <FormMessage />
              <RadioGroup
                onValueChange={field.onChange}
                defaultValue={field.value}
                className="flex gap-2 pt-2"
              >
                <FormItem>
                  <FormLabel>
                    <FormControl>
                      <RadioGroupItem value="#bfe1ff" className="sr-only" />
                    </FormControl>
                    <div className={cn("flex gap-1 items-center rounded-md border-2 border-muted p-1 hover:border-accent cursor-pointer", field.value === "#bfe1ff" && "border-primary")}>
                      <div className="w-6 h-6 rounded-full bg-[#bfe1ff]" /> Azul
                    </div>
                  </FormLabel>
                </FormItem>
                <FormItem>
                  <FormLabel className="[&:has([data-state=checked])>div]:border-primary">
                    <FormControl>
                      <RadioGroupItem value="#d0f0c0" className="sr-only" />
                    </FormControl>
                    <div className={cn("flex gap-1 items-center rounded-md border-2 border-muted p-1 hover:border-accent cursor-pointer", field.value === "#d0f0c0" && "border-primary")}>
                      <div className="w-6 h-6 rounded-full bg-[#d0f0c0]" /> Verde
                    </div>
                  </FormLabel>
                </FormItem>

                <FormItem>
                  <FormLabel className="[&:has([data-state=checked])>div]:border-primary">
                    <FormControl>
                      <RadioGroupItem value="#ffd0d0" className="sr-only" />
                    </FormControl>
                    <div className={cn("flex gap-1 items-center rounded-md border-2 border-muted p-1 hover:border-accent cursor-pointer", field.value === "#ffd0d0" && "border-primary")}>
                      <div className="w-6 h-6 rounded-full bg-[#ffd0d0]" /> Rojo
                    </div>
                  </FormLabel>
                </FormItem>

                <FormItem>
                  <FormLabel className="[&:has([data-state=checked])>div]:border-primary">
                    <FormControl>
                      <RadioGroupItem value="#ffcc99" className="sr-only" />
                    </FormControl>
                    <div className={cn("flex gap-1 items-center rounded-md border-2 border-muted p-1 hover:border-accent cursor-pointer", field.value === "#ffcc99" && "border-primary")}>
                      <div className="w-6 h-6 rounded-full bg-[#ffcc99]" /> Naranja
                    </div>
                  </FormLabel>
                </FormItem>

                <FormItem>
                  <FormLabel className="[&:has([data-state=checked])>div]:border-primary">
                    <FormControl>
                      <RadioGroupItem value="#e8d0ff" className="sr-only" />
                    </FormControl>
                    <div className={cn("flex gap-1 items-center rounded-md border-2 border-muted p-1 hover:border-accent cursor-pointer", field.value === "#e8d0ff" && "border-primary")}>
                      <div className="w-6 h-6 rounded-full bg-[#e8d0ff]" /> Púrpura
                    </div>
                  </FormLabel>
                </FormItem>

              </RadioGroup>
            </FormItem>
          )}
        />  


        <div className="flex justify-end">
            <Button onClick={() => closeDialog()} type="button" variant={"secondary"} className="w-32">Cancel</Button>
            <Button type="submit" className="w-32 ml-2">
              {loading ? <Loader className="h-4 w-4 animate-spin" /> : <p>Save</p>}
            </Button>
          </div>
        </form>
      </Form>
    </div>     
  )
}

export function DeleteEventForm({ id, closeDialog }: Props) {
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    if (!id) return
    setLoading(true)
    deleteEventAction(id)
    .then(() => {
      toast({title: "Event deleted" })
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
      <Button onClick={() => closeDialog && closeDialog()} type="button" variant={"secondary"} className="w-32">Cancel</Button>
      <Button onClick={handleDelete} variant="destructive" className="w-32 ml-2 gap-1">
        { loading && <Loader className="h-4 w-4 animate-spin" /> }
        Delete  
      </Button>
    </div>
  )
}

