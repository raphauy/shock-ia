import { IconBadge } from "@/components/icon-badge";
import { SelectNumberForm } from "@/components/select-number-form";
import { cn } from "@/lib/utils";
import { EventDAO } from "@/services/event-services";
import { EventType } from "@prisma/client";
import { Calendar } from "lucide-react";
import { seEventNumberFieldAction } from "../../event-actions";
import AvailabilitySelector from "../availability-selector";

type Props = {
    event: EventDAO;
}
export default function SingleSlotEdits({ event }: Props) {
  return (
    <div>
        <div className="flex items-center gap-x-2 mt-6">
            <IconBadge icon={Calendar} />
            <h2 className="text-xl">
                Disponibilidad y duración
            </h2>
        </div>
        <AvailabilitySelector eventId={event.id} initialAvailability={event.availability} />
        <div className={cn("grid grid-cols-2 gap-2", event.type !== EventType.MULTIPLE_SLOTS && "hidden")}>
            <SelectNumberForm
                label="Duración mínima"
                initialValue={event.minDuration!}
                id={event.id}
                fieldName="minDuration"
                options={[30, 60, 120, 180, 240, 300]}
                update={seEventNumberFieldAction}
            />
            <SelectNumberForm
                label="Duración máxima"
                initialValue={event.maxDuration!}
                id={event.id}
                fieldName="maxDuration"
                options={[30, 60, 120, 180, 240, 300]}
                update={seEventNumberFieldAction}
            />
        </div>
        <div className="grid grid-cols-2 gap-2">
            <div className="col-span-2">
                <SelectNumberForm
                    label="Duración"
                    initialValue={event.maxDuration!}
                    id={event.id}
                    fieldName="duration"
                    options={[30, 60, 120, 180, 240, 300]}
                    update={seEventNumberFieldAction}
                />
            </div>
            {/* <div>
                <NumberForm
                    disabled={true}
                    id={event.id}
                    icon={<PersonStanding className="w-6 h-6" />}
                    label="Cupos"
                    initialValue={event.seatsPerTimeSlot || 1}
                    fieldName="seatsPerTimeSlot"
                    update={seEventNumberFieldAction}
                />
            </div> */}
        </div>
    </div>
  )
}