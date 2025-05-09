import { getClientBySlug } from "@/services/clientService";
import ClientAvailabilitySelector from "./client-availability-selector";
import { notFound } from "next/navigation";
import { SelectTimezoneForm } from "./select-timezone";
import { Globe } from "lucide-react";
import { setTimezoneAction } from "./actions";

type Props = {
  params: Promise<{
    slug: string
  }>
}

export default async function AvailabilityPage(props: Props) {
  const params = await props.params;
  const slug= params.slug
  const client= await getClientBySlug(slug)
  if (!client) return notFound()

  const clientId= client.id
  const initialAvailability= client.availability
  const initialTimezone= client.timezone

  return (
    <div className="flex flex-col gap-2 p-4">
        <p className="text-3xl font-bold">Horarios de actividad</p>
        <p className="text-sm text-muted-foreground">Selecciona los días y horarios en los que el bot responderá mensajes de los usuarios.</p>
        <p className="text-sm text-muted-foreground">Fuera de estos horarios, el bot ignorará los mensajes recibidos.</p>
        
        <ClientAvailabilitySelector clientId={clientId} initialAvailability={initialAvailability} />
        <SelectTimezoneForm clientId={clientId} initialValue={initialTimezone} />
    </div>
  )
}
