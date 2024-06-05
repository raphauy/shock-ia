import * as z from "zod"
import { prisma } from "@/lib/db"

export type CarServiceDAO = {
	id: string
	nombreReserva: string
	telefonoContacto: string
	fechaReserva: string
	localReserva: string
	marcaAuto: string
	modeloAuto: string
	matriculaAuto: string
	kilometraje: string
	createdAt: Date
	updatedAt: Date
	conversationId: string
}

export const carServiceSchema = z.object({
	nombreReserva: z.string().min(1, "nombreReserva is required."),
	telefonoContacto: z.string().min(1, "telefonoContacto is required."),
	fechaReserva: z.string().min(1, "fechaReserva is required."),
	localReserva: z.string().min(1, "localReserva is required."),
	marcaAuto: z.string().min(1, "marcaAuto is required."),
	modeloAuto: z.string().min(1, "modeloAuto is required."),
	matriculaAuto: z.string().min(1, "matriculaAuto is required."),
	kilometraje: z.string().min(1, "kilometraje is required."),
	conversationId: z.string().min(1, "conversationId is required."),
})

export type CarServiceFormValues = z.infer<typeof carServiceSchema>


export async function getCarServicesDAO() {
  const found = await prisma.carService.findMany({
    orderBy: {
      id: 'asc'
    },
  })
  return found as CarServiceDAO[]
}

export async function getCarServiceDAO(id: string) {
  const found = await prisma.carService.findUnique({
    where: {
      id
    },
  })
  return found as CarServiceDAO
}
    
export async function createCarService(data: CarServiceFormValues) {
  // TODO: implement createCarService
  const created = await prisma.carService.create({
    data
  })
  return created
}

export async function updateCarService(id: string, data: CarServiceFormValues) {
  const updated = await prisma.carService.update({
    where: {
      id
    },
    data
  })
  return updated
}

export async function deleteCarService(id: string) {
  const deleted = await prisma.carService.delete({
    where: {
      id
    },
  })
  return deleted
}


export async function getFullCarServicesDAO() {
  const found = await prisma.carService.findMany({
    orderBy: {
      id: 'asc'
    },
    include: {
			conversation: true,
		}
  })
  return found as CarServiceDAO[]
}
  
export async function getFullCarServiceDAO(id: string) {
  const found = await prisma.carService.findUnique({
    where: {
      id
    },
    include: {
			conversation: true,
		}
  })
  return found as CarServiceDAO
}
    
export async function getCarServicesDAOByClientId(clientId: string) {
  const found = await prisma.carService.findMany({
    where: {
      conversation: {
        clientId
      }
    },
    orderBy: {
      createdAt: 'asc'
    },
  })
  return found as CarServiceDAO[]
}

export async function getServiceNameByConversationId(conversationId: string) {
  const found = await prisma.carService.findUnique({
    where: {
      conversationId
    },
  })
  return found?.nombreReserva
}


export async function getCarServiceEntry(clientId: string, phone: string){
  console.log("clientId: ", clientId)
  console.log("phone: ", phone)
  
  const found = await prisma.carService.findFirst({
    where: {
      conversation: {
        clientId,
        phone
      }
    },
    orderBy: {
      updatedAt: 'desc'
    }
  })

  return found
}
