import { prisma } from "@/lib/db"
import * as z from "zod"


export type ConversationInfo = {
  id: string
  phone: string
  messagesCount: number
}

export type NarvaezDAO = {
	id: string
	idTrackeo: string | null
	urlPropiedad: string | null
	idPropiedad: string | null
	resumenPedido: string | null
	clasificacion: string | null
  consulta: string | null

  nombre: string | null
  telefono: string | null
  email: string | null
  horarioContacto: string | null
  consultaAdicional: string | null

	createdAt: Date
	updatedAt: Date
	conversation: ConversationInfo
	conversationId: string
}

export const narvaezSchema = z.object({
	idTrackeo: z.string().optional(),
	urlPropiedad: z.string().optional(),
	idPropiedad: z.string().optional(),
	resumenPedido: z.string().optional(),
	clasificacion: z.string().optional(),
  consulta: z.string().optional(),
  
  nombre: z.string().optional(),
  telefono: z.string().optional(),
  email: z.string().optional(),
  horarioContacto: z.string().optional(),
  consultaAdicional: z.string().optional(),

	conversationId: z.string({required_error: "conversationId is required."}),
})

export type NarvaezFormValues = z.infer<typeof narvaezSchema>


// export async function getNarvaezsDAO() {
//   const found = await prisma.narvaez.findMany({
//     orderBy: {
//       id: 'asc'
//     },
//   })
//   return found as NarvaezDAO[]
// }

// export async function getNarvaezDAO(id: string) {
//   const found = await prisma.narvaez.findUnique({
//     where: {
//       id
//     },
//   })
//   return found as NarvaezDAO
// }
    
export async function createOrUpdateNarvaez(data: NarvaezFormValues) {
  const found = await prisma.narvaez.findUnique({
    where: {
      conversationId: data.conversationId
    }
  })

  if (found) {
    //return await getFullNarvaezDAO(found.id) as NarvaezDAO
    const updated = await prisma.narvaez.update({
      where: {
        id: found.id
      },
      data
    })
    return updated
  } else {
    const created = await prisma.narvaez.create({
      data
    })
    return await getFullNarvaezDAO(created.id) as NarvaezDAO
  }
}

export async function updateNarvaez(id: string, data: NarvaezFormValues) {
  const updated = await prisma.narvaez.update({
    where: {
      id
    },
    data
  })

  const res: NarvaezDAO = {
    ...updated,
    conversation: {
      id: updated.conversationId,
      phone: updated.telefono || "",
      messagesCount: 0
    }
  }
  return res
}

export async function deleteNarvaez(id: string) {
  const deleted = await prisma.narvaez.delete({
    where: {
      id
    },
  })

  const res: NarvaezDAO = {
    ...deleted,
    conversation: {
      id: deleted.conversationId,
      phone: deleted.telefono || "",
      messagesCount: 0
    }
  }

  return res
}


export async function getFullNarvaezsDAO() {
  const found = await prisma.narvaez.findMany({
    orderBy: {
      createdAt: 'desc'
    },
    include: {
			conversation: {
        include: {
          messages: true
        }      
      }
		}
  })

  const res: NarvaezDAO[] = found.map((narvaez) => {
    return {
      ...narvaez,
      conversation: {
        id: narvaez.conversation.id,
        phone: narvaez.conversation.phone,
        messagesCount: narvaez.conversation.messages.length
      }
    }
  })
  
  return res
}

export async function getFullNarvaezsDAOByClient(clientId: string) {
  const found = await prisma.narvaez.findMany({
    where: {
      conversation: {
        clientId
      }
    },
    orderBy: {
      createdAt: 'desc'
    },
    include: {
      conversation: {
        include: {
          messages: true
        }      
      }
    }
  })

  const res: NarvaezDAO[] = found.map((narvaez) => {
    return {
      ...narvaez,
      conversation: {
        id: narvaez.conversation.id,
        phone: narvaez.conversation.phone,
        messagesCount: narvaez.conversation.messages.length
      }
    }
  })
  
  return res

}
  
export async function getFullNarvaezDAO(id: string) {
  const found = await prisma.narvaez.findUnique({
    where: {
      id
    },
    include: {
			conversation: {
        include: {
          messages: true
        }      
      }
    }
  })

  if (!found) {
    return null
  }

  const res: NarvaezDAO = {
    ...found,
    conversation: {
      id: found.conversation.id,
      phone: found.conversation.phone,
      messagesCount: found.conversation.messages.length
    }
  }

  return res
}

export async function getNarvaezEntry(clientId: string, phone: string){
  console.log("clientId: ", clientId)
  console.log("phone: ", phone)
  
  const found = await prisma.narvaez.findFirst({
    where: {
      conversation: {
        phone
      }
    },
    orderBy: {
      updatedAt: 'desc'
    }
  })

  return found
}
