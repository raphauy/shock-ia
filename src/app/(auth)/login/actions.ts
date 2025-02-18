"use server"

import { validateEmail } from "@/services/user-service"

export async function validateEmailAction(email: string): Promise<boolean> {
  const mailValid = await validateEmail(email)
  return mailValid
}