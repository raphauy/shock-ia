import { IconBadge } from "@/components/icon-badge";
import { NumberForm } from "@/components/number-form";
import { EventDAO } from "@/services/event-services";
import { Calendar, PersonStanding } from "lucide-react";
import { updateseatsPerTimeSlotAction } from "../../event-actions";
import EventDateTimeSelector from "./event-date-time";

type Props = {
    event: EventDAO;
}
export default function FixedDateEdits({ event }: Props) {
  return (
    <div>
        <div className="flex items-center gap-x-2 mt-6">
            <IconBadge icon={Calendar} />
            <h2 className="text-xl">
                Fecha y hora del evento
            </h2>
        </div>
        <div className="mt-6">
            <EventDateTimeSelector event={event} />
        </div>
        <NumberForm
            id={event.id}
            icon={<PersonStanding className="w-6 h-6" />}
            label="Cupos"
            initialValue={event.seatsPerTimeSlot || 1}
            fieldName="seatsPerTimeSlot"
            update={updateseatsPerTimeSlotAction}
        />

    </div>
  )
}