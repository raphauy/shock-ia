import * as z from "zod"
import { prisma } from "@/lib/db"
import { ContactDAO } from "./contact-services"
import { StageDAO } from "./stage-services"

export type StageHistoryDAO = {
	id: string
	startDate: Date
	endDate: Date | undefined
	durationHours: number
	contact: ContactDAO
	contactId: string
	stage: StageDAO
	stageId: string
	createdAt: Date
	updatedAt: Date
}

export const stageHistorySchema = z.object({
	startDate: z.date({required_error: "startDate is required."}),
	endDate: z.date().optional(),
	durationHours: z.number({required_error: "durationHours is required."}),
	contactId: z.string().min(1, "contactId is required."),
	stageId: z.string().min(1, "stageId is required."),
})

export type StageHistoryFormValues = z.infer<typeof stageHistorySchema>


export async function getStageHistorysDAO() {
  const found = await prisma.stageHistory.findMany({
    orderBy: {
      id: 'asc'
    },
  })
  return found as StageHistoryDAO[]
}

export async function getStageHistoryDAO(id: string) {
  const found = await prisma.stageHistory.findUnique({
    where: {
      id
    },
  })
  return found as StageHistoryDAO
}
    
export async function createStageHistory(data: StageHistoryFormValues) {
  // TODO: implement createStageHistory
  const created = await prisma.stageHistory.create({
    data
  })
  return created
}

export async function updateStageHistory(id: string, data: StageHistoryFormValues) {
  const updated = await prisma.stageHistory.update({
    where: {
      id
    },
    data
  })
  return updated
}

export async function deleteStageHistory(id: string) {
  const deleted = await prisma.stageHistory.delete({
    where: {
      id
    },
  })
  return deleted
}


export async function getFullStageHistorysDAO() {
  const found = await prisma.stageHistory.findMany({
    orderBy: {
      id: 'asc'
    },
    include: {
			contact: true,
			stage: true,
		}
  })
  return found
}
  
export async function getFullStageHistoryDAO(id: string) {
  const found = await prisma.stageHistory.findUnique({
    where: {
      id
    },
    include: {
			contact: true,
			stage: true,
		}
  })
  return found
}
    