import { prisma } from "@/lib/db";
import { z } from "zod";

export const messageSchema = z.object({
    conversationId: z.string(),
    role: z.string(),
    content: z.string(),
    parts: z.any().default([]),
    attachments: z.any().default([]),
    promptTokens: z.number().optional(),
    completionTokens: z.number().optional(),
})

export type MessageFormValues = z.infer<typeof messageSchema>

export async function saveMessage(message: MessageFormValues) {
  const created = await prisma.message.create({
    data: message,
  })
  return created
}

export async function saveMessages(messages: MessageFormValues[]) {
  const created = await prisma.message.createMany({
    data: messages,
  })
  return created
}

export async function getConversationIdFromMessageId(messageId: string) {
  const message= await prisma.message.findUnique({
    where: {
      id: messageId,
    },
    select: {
      conversationId: true,
    },
  })
  if (!message) {
    return null
  }
  return message.conversationId
}