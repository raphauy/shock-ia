import { BooleanForm } from "@/components/boolean-form";
import { ColorForm } from "@/components/color-form";
import { IconBadge } from "@/components/icon-badge";
import { LongTextForm } from "@/components/long-text-form";
import { PhonesForm } from "@/components/phones-form";
import { SelectTimezoneForm } from "@/components/select-timezone";
import { ShortTextForm } from "@/components/short-text-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn, getEventTypeLabel } from "@/lib/utils";
import { getClientCustomFields } from "@/services/customfield-services";
import { getFullEventDAO } from "@/services/event-services";
import { getReminderDefinitionsDAO } from "@/services/reminder-definition-services";
import { getStagesDAO } from "@/services/stage-services";
import { EventType } from "@prisma/client";
import { isAfter } from "date-fns";
import { Archive, Bell, CalendarCheck, ExternalLink, Globe, LayoutDashboard, ListChecks, ListCollapse, Palette, Settings, Tag } from "lucide-react";
import Link from "next/link";
import { setEventBooleanFieldAction, setEventFieldAction, setEventNotifyPhonesAction } from "../../event-actions";
import EventFieldsBox from "./event-fields-box";
import { EventTaggerComponent } from "./event-tagger";
import FixedDateEdits from "./fixed-date-edits";
import ReminderDefinitionSelector from "./reminder-definition-selector";
import SelectEventStage from "./select-stage";
import SingleSlotEdits from "./single-slot-edits";

type Props= {
    params: {
        slug: string;
        eventId: string;
    }
}
export default async function EditEventPage({ params }: Props) {
  const { slug, eventId } = params
  const event= await getFullEventDAO(eventId)
  if (!event) return <div>Event not found</div>

  const clientHaveCRM= event.clientHaveCRM

  const stages= await getStagesDAO(event.clientId)

  const isEnded= event.startDateTime && event.endDateTime && isAfter(new Date(), event.endDateTime)

  const clientCustomFields= await getClientCustomFields(event.clientId)

  const allReminderDefinitions= await getReminderDefinitionsDAO(event.clientId)

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
                    <IconBadge icon={Tag} />
                    <h2 className="text-xl">
                          Etiquetas y Estados
                      </h2>                      
                    </div>
                    <EventTaggerComponent event={event} />
                    <div className="p-4 bg-muted border rounded-md mt-6">
                      <p className="font-medium border-b pb-2">Cambiar estado:</p>
                      <SelectEventStage event={event} stages={stages} />
                    </div>


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

                  <div className="flex items-center justify-between mt-6">
                    <div className="flex items-center gap-x-2">
                      <IconBadge icon={Settings} />
                      <h2 className="text-xl">
                        Recordatorios
                      </h2>
                    </div>
                    {clientHaveCRM && (
                      <Link href={`/client/${slug}/crm/reminder-definitions`} target="_blank">
                        <Button variant="link" className="gap-2">Plantillas<ExternalLink className="w-4 h-4" /></Button>
                      </Link>
                    )}
                  </div>
                  {clientHaveCRM ? (
                    <ReminderDefinitionSelector eventId={event.id} eventReminderDefinitions={event.reminderDefinitions} allReminderDefinitions={allReminderDefinitions} />
                  ) : (
                    <p className="text-sm text-muted-foreground p-4 border-dashed border rounded-md mt-6">El cliente no tiene CRM, por lo que no se pueden configurar recordatorios.</p>
                  )}

              </div>
              <div className="min-w-96">
                <div className="flex items-center gap-x-2">
                  <IconBadge icon={ListCollapse} />
                  <h2 className="text-xl">
                      Campos para la reserva
                  </h2>
                </div>

                <div className="mt-6 border bg-slate-100 rounded-md p-2 dark:bg-black">
                  <EventFieldsBox initialFields={event.fields} eventId={event.id} customFields={clientCustomFields} />
                </div>

                <BooleanForm
                  id={event.id}
                  icon={<ListChecks className="w-5 h-5" />}
                  label="Preguntar en secuencia"
                  description="Si está marcado, se le instruirá al LLM que espere la respuesta de cada campo antes de continuar con el siguiente"
                  initialValue={event.askInSequence}
                  fieldName="askInSequence"
                  update={setEventBooleanFieldAction}
                />

                <div className="flex items-center gap-x-2 mt-6">
                  <IconBadge icon={Bell} />
                  <h2 className="text-xl">
                      Notificaciones
                  </h2>
                </div>

                <ShortTextForm
                    label="Webhook"
                    initialValue={event.webHookUrl || ""}
                    id={event.id}
                    fieldName="webHookUrl"
                    update={setEventFieldAction}
                />

                <PhonesForm
                  eventId={event.id}
                  label="Teléfonos a notificaciones cuando se realiza una reserva"
                  initialValue={event.notifyPhones?.join(",") || ""}
                  update={setEventNotifyPhonesAction}
                />

                <div className="flex items-center gap-x-2 mt-6">
                  <IconBadge icon={CalendarCheck} />
                  <h2 className="text-xl">
                      Confirmación de reserva
                  </h2>
                </div>

                <LongTextForm
                    label="Plantilla para confirmación"
                    initialValue={event.confirmationTemplate || ""}
                    id={event.id}
                    fieldName="confirmationTemplate"
                    update={setEventFieldAction}
                />
                <div className="text-sm text-muted-foreground p-4 border-dashed border rounded-md mt-2">
                  <p>Variables disponibles para la plantilla:</p>
                  <p>- {`{nombre}`} para referirte al nombre del contacto.</p>
                  <p>- {`{fecha}`} para referirte a la fecha de la reserva.</p>
                  <p>- {`{hora}`} para referirte a la hora de la reserva.</p>
                  <p>- {`{fecha_y_hora}`} para referirte a la fecha y hora de la reserva.</p>
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

