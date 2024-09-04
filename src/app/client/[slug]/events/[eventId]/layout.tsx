import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { getFullEventsDAO } from "@/services/event-services";
import { EventCard } from "../event-card";

type Props = {
  params: {
    slug: string;
  }
  children: React.ReactNode;
}

export default async function EventLayout({ params, children }: Props) {
  const slug = params.slug

  const data= await getFullEventsDAO(slug)

  return (
    <div className="flex flex-grow p-1 w-full gap-2">
      <div className="mt-4 border-r pr-4 border-gray-300 mr-2">
        <Link href={`/client/${slug}/events/edit`} >
          <Button className="gap-2 w-full">
            <PlusCircle className="h-5 w-5" /> Crear Evento
          </Button>
        </Link>
        <div className="mt-4 flex flex-col gap-4 min-w-[250px]">
          {data.map((event) => (
            <Link key={event.id} href={`/client/${slug}/events/${event.id}`}>
              <EventCard event={event} />
            </Link>
          ))}
        </div>
      </div>
      <div className="w-full flex-grow">
        {children}
      </div>
    </div>
  )
}
