import { BooleanForm } from "@/components/boolean-form";
import { ColorForm } from "@/components/color-form";
import { IconBadge } from "@/components/icon-badge";
import { LongTextForm } from "@/components/long-text-form";
import { SelectTimezoneForm } from "@/components/select-timezone";
import { ShortTextForm } from "@/components/short-text-form";
import { Badge } from "@/components/ui/badge";
import { cn, getEventTypeLabel } from "@/lib/utils";
import { getEventDAO, getFullEventDAO } from "@/services/event-services";
import { EventType } from "@prisma/client";
import { Archive, Globe, LayoutDashboard, Palette, Settings, Tag } from "lucide-react";
import { setEventBooleanFieldAction, setEventFieldAction } from "../../event-actions";
import EventFieldsBox from "./event-fields-box";
import FixedDateEdits from "./fixed-date-edits";
import SingleSlotEdits from "./single-slot-edits";
import { isAfter } from "date-fns";

type Props= {
    params: {
        slug: string;
        eventId: string;
    }
}
export default async function EditEventPage({ params }: Props) {
  const event= await getFullEventDAO(params.eventId)
  if (!event) return <div>Event not found</div>

  const isEnded= event.startDateTime && event.endDateTime && isAfter(new Date(), event.endDateTime)

  return (
    <div className=" mt-4 border rounded-lg w-full">
      <div style={{backgroundColor: event.color}} className="h-4 rounded-t-lg" />
      <div className="p-6">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <div className="min-w-96">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-x-2">
                      <IconBadge icon={LayoutDashboard} />
                      <h2 className="text-xl">
                          Información del evento
                      </h2>                      
                    </div>
                    <Badge className={cn(isEnded && "bg-orange-500")}>{isEnded ? "Finalizado" : getEventTypeLabel(event.type)}</Badge>
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
                  <ShortTextForm
                    label="Dirección"
                    initialValue={event.address || ""}
                    id={event.id}
                    fieldName="address"
                    update={setEventFieldAction}
                  />

                  <div className="flex items-center gap-x-2 mt-6">
                    <IconBadge icon={Settings} />
                    <h2 className="text-xl">
                      Otros
                    </h2>
                  </div>
                  <SelectTimezoneForm
                    id={event.id}
                    icon={<Globe className="w-5 h-5" />}
                    label="Zona horaria"
                    initialValue={event.timezone}
                    fieldName="timezone"
                    update={setEventFieldAction}
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
              <div className="min-w-96">
                <div className="flex items-center gap-x-2">
                  <IconBadge icon={Tag} />
                  <h2 className="text-xl">
                      Campos para la reserva
                  </h2>
                </div>

                <div className="mt-6 border bg-slate-100 rounded-md p-2 dark:bg-black">
                  <EventFieldsBox initialFields={event.fields} eventId={event.id} />
                </div>



                {
                  event.type === EventType.SINGLE_SLOT && <SingleSlotEdits event={event} />
                }
                {
                  event.type === EventType.FIXED_DATE && <FixedDateEdits event={event} />
                }
              </div>
          </div> 
      </div>
    </div>
  )
}

