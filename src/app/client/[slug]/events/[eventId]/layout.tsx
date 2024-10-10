import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Bot, PlusCircle } from "lucide-react";
import { getFullEventsDAO } from "@/services/event-services";
import { EventCard } from "../event-card";
import { EventDialog } from "../event-dialogs";
import { EventCreator } from "@/app/client/[slug]/events/event-creator";

type Props = {
  params: {
    slug: string;
  }
  children: React.ReactNode;
}

export default async function EventLayout({ params, children }: Props) {
  const slug = params.slug

  const data= await getFullEventsDAO(slug)
  const nowInMinutes= (new Date().getTime() / 60000).toFixed(0)

  return (
    <div className="flex flex-grow p-1 w-full gap-2">
      <div className="mt-4 border-r pr-4 border-gray-300 mr-2">
        <EventCreator />
        <Link href={`/client/${slug}/events/id/simulator`}>
          <Button variant="outline" className="w-full mt-2">
            <Bot className="w-5 h-5 mr-2 mb-1" />
            <p>Simulador</p>
          </Button>
        </Link>
        <div className="mt-4 flex flex-col gap-4 min-w-[250px]">
          {data.map((event) => (
            <Link key={event.id} href={`/client/${slug}/events/${event.id}?r=${nowInMinutes}`}>
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
