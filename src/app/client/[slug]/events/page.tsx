import { cn } from "@/lib/utils"
import { getFullBookingsDAO, getFullBookingsDAOBySlug } from "@/services/booking-services"
import { getFullEventsDAO } from "@/services/event-services"
import Link from "next/link"
import { columns } from "../bookings/booking-columns"
import { DataTable } from "../bookings/booking-table"
import { CalendarEvent } from "./big-calendar"
import { EventCard } from "./event-card"
import { EventDialog } from "./event-dialogs"
import { EventCreator } from "@/app/client/[slug]/events/event-creator"
import { EventType } from "@prisma/client"

type Props = {
  params: {
    slug: string
  }
  searchParams: {
    id: string
  }
}
export default async function EventPage({ params, searchParams }: Props) {
  const slug = params.slug
  const id = searchParams.id
  const data= await getFullEventsDAO(slug)
  const bookings= await getFullBookingsDAOBySlug(slug)

  return (
    <div className="w-full">      

        <div className="flex justify-center">
          <div className={cn(
            "flex flex-col mt-10 gap-6",
            data.length === 2 && "sm:flex-row",
            data.length === 3 && "lg:flex-row",
            data.length >= 4 && "grid grid-cols-2"
            )}>
          {
          data.map((event) => (
            <Link key={event.id}  href={`/client/${slug}/events/${event.id}`}>
              <EventCard event={event} />
            </Link>
          ))
          }
          </div>
        </div>

        <div className="flex justify-center mt-20">
          <div className="w-64">
            <EventCreator />
          </div>
        </div>

    </div>
  )
}

