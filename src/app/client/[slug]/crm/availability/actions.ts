"use server"

import { setAvailability, setTimezone } from "@/services/clientService"

export async function setAvailabilityAction(clientId: string, availability: string[]) {
  const client= await setAvailability(clientId, availability)
  return client
}

export async function setTimezoneAction(clientId: string, timezone: string): Promise<boolean> {
  const ok= await setTimezone(clientId, timezone)
  return ok
}