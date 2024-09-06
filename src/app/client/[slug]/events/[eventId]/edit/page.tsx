import { IconBadge } from "@/components/icon-badge";
import { LongTextForm } from "@/components/long-text-form";
import { ShortTextForm } from "@/components/short-text-form";
import { SlugForm } from "@/components/slug-form";
import { getEventDAO } from "@/services/event-services";
import { Archive, Calendar, Clock, LayoutDashboard, Palette, PersonStanding } from "lucide-react";
import { seEventNumberFieldAction, setEventBooleanFieldAction, setEventFieldAction } from "../../event-actions";
import AvailabilitySelector from "../availability-selector";
import { NumberForm } from "@/components/number-form";
import { BooleanForm } from "@/components/boolean-form";
import { SelectForm } from "@/components/select-form";
import { EventType } from "@prisma/client";
import { ColorForm } from "@/components/color-form";

type Props= {
    params: {
        slug: string;
        eventId: string;
    }
}
export default async function EditEventPage({ params }: Props) {
  const event= await getEventDAO(params.eventId)
  if (!event) return <div>Event not found</div>

  const selectDescription= `
Duración fija: todas las reservas tienen la misma duración, ej: 1 hora \n
Duración variable: el usuario puede reservar tiempo variable, la duración marca el mínimo reservable, ej: media hora pero puede reservar 1 hora y media por ejemplo`
  return (
      <>
          <div className="p-6 bg-white dark:bg-black mt-4 border rounded-lg w-full">
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  <div className="min-w-96">
                      <div className="flex items-center gap-x-2">
                      <IconBadge icon={LayoutDashboard} />
                        <h2 className="text-xl">
                            Información del evento
                        </h2>
                      </div>
                      <ShortTextForm
                          label="Nombre"
                          initialValue={event.name}
                          id={event.id}
                          fieldName="name"
                          update={setEventFieldAction}
                      />
                      <LongTextForm
                          label="Descripción"
                          initialValue={event.description || ""}
                          id={event.id}
                          fieldName="description"
                          update={setEventFieldAction}
                      />
                      <SelectForm
                          label="Tipo de evento"
                          description={selectDescription}
                          initialValue={event.type}
                          id={event.id}
                          fieldName="type"
                          options={Object.values(EventType)}
                          update={setEventFieldAction}
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <NumberForm
                          id={event.id}
                          icon={<Clock className="w-5 h-5" />}
                          label="Duración"
                          initialValue={event.duration}
                          fieldName="duration"
                          update={seEventNumberFieldAction}
                        />
                        <NumberForm
                          id={event.id}
                          icon={<PersonStanding className="w-6 h-6" />}
                          label="Cupos"
                          initialValue={event.seatsPerTimeSlot || 1}
                          fieldName="seatsPerTimeSlot"
                          update={seEventNumberFieldAction}
                        />
                      </div>
                  </div>
                  <div className="min-w-96">
                    <div className="flex items-center gap-x-2">
                      <IconBadge icon={Calendar} />
                      <h2 className="text-xl">
                          Disponibilidad
                      </h2>
                    </div>
                    <AvailabilitySelector eventId={event.id} initialAvailability={event.availability} />
                    <BooleanForm
                      id={event.id}
                      icon={<Archive className="w-5 h-5" />}
                      label="Archivado"
                      description="Si está marcado, el evento dejará de estar disponible para reservas"
                      initialValue={event.isArchived}
                      fieldName="isArchived"
                      update={setEventBooleanFieldAction}
                    />
                    <ColorForm
                      id={event.id}
                      icon={<Palette className="w-5 h-5" />}
                      label="Color"
                      initialValue={event.color}
                      fieldName="color"
                      colors={["#bfe1ff", "#d0f0c0", "#ffd0d0", "#ffcc99", "#e8d0ff", "#c9cfd4"]}
                      update={setEventFieldAction}
                    />
                  </div>
              </div> 
          </div>
      </>
  )
}





{/* <FormField
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
 */}
