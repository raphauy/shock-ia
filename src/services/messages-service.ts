import { prisma } from "@/lib/db";
import { z } from "zod";


// model Message {
//     id                String      @id @default(cuid())
//     createdAt         DateTime    @default(now())
//     updatedAt         DateTime    @updatedAt
//     role              String
//     content           String      @db.Text
//     parts             Json @default("[]")
//     attachments       Json @default("[]")
  
//     gptData           String?     @db.Text
//     conversationId    String
//     conversation      Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
//     promptTokens      Int       @default(0)
//     completionTokens  Int       @default(0)
//   }
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