"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { InboxProvider } from "@/lib/generated/prisma"
import { useEffect, useState } from "react"
import { DataClient } from "../../clients/(crud)/actions"
import { setInboxProvidersAction } from "./actions"
import { toast } from "@/components/ui/use-toast"
import { useSession } from "next-auth/react"

type Props = {
    client: DataClient
}
export default function ProviderSelector({client}: Props) {
  const [loading, setLoading] = useState(false)
  const [provider, setProvider] = useState<InboxProvider>(client.inboxProvider)

  const currentUser = useSession().data?.user

  const providers= Object.values(InboxProvider)

  useEffect(() => {
    setProvider(client.inboxProvider)
  }, [client.inboxProvider])

  function handleChange(value: InboxProvider) {
    setProvider(value)
    setInboxProvidersAction(client.id, value)
    .then(() => {
        toast({
            title: "Proveedor actualizado, procesando..." })
    })
    .catch((error) => {
        toast({
            title: "Error",
            description: "Hubo un error al actualizar el proveedor",
            variant: "destructive"
        })
    })
    .finally(() => {
        setLoading(false)
    })
  }

  return (
    <div className="min-w-[200px]">
        <Select onValueChange={handleChange} value={provider}>
            <SelectTrigger>
                <SelectValue placeholder="Selecciona un proveedor" />
            </SelectTrigger>
            <SelectContent>
                {providers.map((provider) => (
                    <SelectItem key={provider} value={provider} disabled={currentUser?.email !== "rapha.uy@rapha.uy" && provider === InboxProvider.CHATWOOT}>
                        {provider === InboxProvider.OSOM ? "SHOCK_IA" : provider}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>

    </div>
  )
}