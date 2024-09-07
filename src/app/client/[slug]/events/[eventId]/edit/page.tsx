import { IconBadge } from "@/components/icon-badge";
import { LongTextForm } from "@/components/long-text-form";
import { ShortTextForm } from "@/components/short-text-form";
import { SlugForm } from "@/components/slug-form";
import { getEventDAO } from "@/services/event-services";
import { Archive, Calendar, Clock, Globe, LayoutDashboard, Palette, PersonStanding, Settings } from "lucide-react";
import { seEventNumberFieldAction, setEventBooleanFieldAction, setEventFieldAction } from "../../event-actions";
import AvailabilitySelector from "../availability-selector";
import { NumberForm } from "@/components/number-form";
import { BooleanForm } from "@/components/boolean-form";
import { SelectTextForm } from "@/components/select-text-form";
import { EventType } from "@prisma/client";
import { ColorForm } from "@/components/color-form";
import { SelectTypeForm } from "@/components/select-form-type";
import { SelectNumberForm } from "@/components/select-number-form";
import { SelectTimezoneForm } from "@/components/select-timezone";

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
    <div className="bg-white dark:bg-black mt-4 border rounded-lg w-full">
      <div style={{backgroundColor: event.color}} className="h-4 rounded-t-lg" />
      <div className="p-6">
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
                  <SelectTypeForm
                      label="Tipo de evento"
                      description={selectDescription}
                      initialValue={event.type}
                      id={event.id}
                      fieldName="type"
                      options={Object.values(EventType)}
                      update={setEventFieldAction}
                      disabled={true}
                  />
                  <ShortTextForm
                    label="Dirección"
                    initialValue={event.address || ""}
                    id={event.id}
                    fieldName="address"
                    update={setEventFieldAction}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <SelectNumberForm
                        label="Duración"
                        initialValue={event.duration}
                        id={event.id}
                        fieldName="duration"
                        options={[30, 60, 120, 180, 240, 300]}
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
                <SelectTimezoneForm
                  id={event.id}
                  icon={<Globe className="w-5 h-5" />}
                  label="Zona horaria"
                  initialValue={event.timezone}
                  fieldName="timezone"
                  update={setEventFieldAction}
                />
                <div className="flex items-center gap-x-2 mt-6">
                  <IconBadge icon={Settings} />
                  <h2 className="text-xl">
                      Otros
                  </h2>
                </div>
                <ColorForm
                  id={event.id}
                  icon={<Palette className="w-5 h-5" />}
                  label="Color"
                  initialValue={event.color}
                  fieldName="color"
                  colors={["#bfe1ff", "#d0f0c0", "#ffd0d0", "#ffcc99", "#e8d0ff", "#c9cfd4"]}
                  update={setEventFieldAction}
                />
                <BooleanForm
                  id={event.id}
                  icon={<Archive className="w-5 h-5" />}
                  label="Archivado"
                  description="Si está marcado, el evento dejará de estar disponible para reservas"
                  initialValue={event.isArchived}
                  fieldName="isArchived"
                  update={setEventBooleanFieldAction}
                />
              </div>
          </div> 
      </div>
    </div>
  )
}

