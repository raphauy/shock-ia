import * as z from "zod"
import { prisma } from "@/lib/db"
import { tr } from "date-fns/locale"
import { ContactDAO, getContactsDAO, getMinOrderOfStage } from "./contact-services"

export type KanbanStageDAO = {
	id: string
	name: string
	description: string | undefined
	order: number
	isFinal: boolean
	color: string | undefined
	clientId: string
}
export type KanbanStageDAOWithContacts = KanbanStageDAO & {
  contacts: ContactDAO[]
}

export type StageDAO = {
	id: string
	name: string
	description: string | undefined
	order: number
	isFinal: boolean
	color: string | undefined
	clientId: string
	createdAt: Date
	updatedAt: Date
}

export const stageSchema = z.object({
	name: z.string().min(1, "name is required."),
	description: z.string().optional(),
	isFinal: z.boolean().optional(),
	color: z.string().optional(),
	clientId: z.string().min(1, "clientId is required."),
})

export type StageFormValues = z.infer<typeof stageSchema>


export async function getStagesDAO(clientId: string) {
  const found = await prisma.stage.findMany({
    where: {
      clientId
    },
    orderBy: {
      id: 'asc'
    },
  })
  return found as StageDAO[]
}

export async function getStageDAO(id: string) {
  const found = await prisma.stage.findUnique({
    where: {
      id
    },
  })
  return found as StageDAO
}
    
export async function createStage(data: StageFormValues) {
  const maxOrder= await getMaxOrderOfClient(data.clientId)
  const created = await prisma.stage.create({
    data: {
      ...data,
      order: maxOrder + 1
    }
  })
  return created
}

async function getMaxOrderOfClient(clientId: string) {
  const maxOrder= await prisma.stage.findFirst({
    where: {
      clientId
    },
    orderBy: {
      order: 'desc'
    }
  })
  return maxOrder?.order || 0
}

export async function updateStage(id: string, data: StageFormValues) {
  const updated = await prisma.stage.update({
    where: {
      id
    },
    data
  })
  return updated
}

export async function deleteStage(id: string) {
  const deleted = await prisma.stage.delete({
    where: {
      id
    },
  })
  return deleted
}


export async function getFullStagesDAO() {
  const found = await prisma.stage.findMany({
    orderBy: {
      id: 'asc'
    },
    include: {
			client: true,
		}
  })
  return found as StageDAO[]
}
  
export async function getFullStageDAO(id: string) {
  const found = await prisma.stage.findUnique({
    where: {
      id
    },
    include: {
			client: true,
		}
  })
  return found as StageDAO
}
    

export async function getFirstStageOfClient(clientId: string) {
  const found = await prisma.stage.findFirst({
    where: {
      clientId
    },
    orderBy: {
      order: 'asc'
    }
  })
  return found
}

export async function createDefaultStages(clientId: string) {
  const stages = await getStagesDAO(clientId)
  if (stages.length > 0) throw new Error('Stages already exist')

  return await prisma.$transaction(async (tx) => {
    const stagesData = [
      {
        name: 'Bot',
        description: 'Estado inicial de un contacto, respuestas con IA en función del prompt',
        order: 1,
        isFinal: false,
        color: '#D3D3D3',
        clientId
      },
      {
        name: 'Comercial',
        description: 'Contacto derivado a un comercial',
        order: 2,
        isFinal: false,
        color: '#D3D3D3',
        clientId
      },
      {
        name: 'Finalizado',
        description: 'Contacto ganado, este es un estado final',
        order: 3,
        isFinal: true,
        color: '#D3D3D3',
        clientId
      }
    ]

    await tx.stage.createMany({
      data: stagesData
    })

    return true
  })
}

export async function getKanbanStagesDAO(clientId: string) {
  const stages = await prisma.stage.findMany({
    where: {
      clientId
    },
    orderBy: {
      order: 'asc'
    },
    include: {
      contacts: {
        orderBy: {
          order: 'asc'
        }
      }
    }
  })
  return stages as KanbanStageDAOWithContacts[]
}

export async function updateKanbanStages(clientId: string, stages: KanbanStageDAO[]) {
  console.log("updateKanbanStages", stages)
  try {
    const transaction= stages.map((stage) => 
      prisma.stage.update({
        where: { 
          id: stage.id,
          clientId
        },
        data: {
          order: stage.order
        }
      })
    )
    const updated = await prisma.$transaction(transaction)
    return updated
  } catch (error) {
    console.error(error)
    throw "Error al reordenar los estados"
  }
}