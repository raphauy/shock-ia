import { ClientFormValues } from "@/app/admin/clients/(crud)/clientForm";
import { prisma } from "@/lib/db";
import { FunctionDAO, getFunctionIdByFunctionName } from "./function-services";
import { InboxProvider } from "@/lib/generated/prisma";
import { WhatsappInstanceDAO } from "./wrc-sdk-types";
import { createDefaultStages, getFirstStageOfClient } from "./stage-services";
import { toZonedTime, formatInTimeZone } from 'date-fns-tz'
import { getDay, getHours, getMinutes } from 'date-fns'


export default async function getClients() {

  const found = await prisma.client.findMany({
    orderBy: {
      createdAt: 'desc'
    },
    include: {
      users: true,
      model: true,
      whatsappInstances: true
    }
  })

  return found;
}

export async function getClientsCount() {

  const found = await prisma.client.count()

  return found;
}

export async function getFirstClient() {
  
    const found = await prisma.client.findFirst({
      orderBy: {
        createdAt: 'asc',
      },
    })
  
    return found;
  
}

export async function getLastClient() {
    
    const found = await prisma.client.findFirst({
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        model: true
      }
    })
  
    return found;

}


export async function getClient(id: string) {
  // Verificar si el id está definido y no es una cadena vacía
  if (!id) {
    return null;
  }

  const found = await prisma.client.findUnique({
    where: {
      id
    },
  })

  return found
}

export async function getClientWithUsers(id: string) {
  const found = await prisma.client.findUnique({
    where: {
      id
    },
    include: {
      users: true
    }
  })

  return found
}

export async function getClientBySlug(slug: string) {

  const found = await prisma.client.findUnique({
    where: {
      slug
    },
    include: {
      users: true,
      model: true,
    }
  })

  return found
}

export async function createClient(data: ClientFormValues) {
  
  const slug= data.name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '')
  const created= await prisma.client.create({
    data: {
      ...data,
      slug
    }
  })

  return created
}

export async function editClient(id: string, data: ClientFormValues) {
  console.log(data);
  
  const updated= await prisma.client.update({
    where: {
      id
    },
    data
  })

  return updated
}

export async function deleteClient(id: string) {
  
  const deleted= await prisma.client.delete({
    where: {
      id
    },
  })

  return deleted
}

export async function setWhatsAppEndpoing(whatsappEndpoint: string, clientId: string) {
  const client= await prisma.client.update({
    where: {
      id: clientId
    },
    data: {
      whatsappEndpoint
    }
  })

  return client  

  
}

export async function setPrompt(prompt: string, clientId: string) {
  const client= await prisma.client.update({
    where: {
      id: clientId
    },
    data: {
      prompt
    }
  })

  return client   
}

export async function setWhatsAppNumbers(whatsappNumbers: string, clientId: string) {
  const client= await prisma.client.update({
    where: {
      id: clientId
    },
    data: {
      whatsappNumbers
    }
  })
  return client
}


export async function setTokensPrice(clientId: string, promptTokensPrice: number, completionTokensPrice: number) {
  console.log(clientId, promptTokensPrice, completionTokensPrice)
  
  const client= await prisma.client.update({
    where: {
      id: clientId
    },
    data: {
      promptTokensPrice,
      completionTokensPrice
    }
  })

  return client   
}

export type CountData = {
  clientName: string,
  clientSlug: string,
  documents: number,
  conversations: number,
  messages: number,
  users: number
}

export async function getCountData(clientId: string): Promise<CountData> {
  const startTime = performance.now();

  const results = await prisma.$transaction([
    // Obtener cliente con conteos de documentos, conversaciones y usuarios
    prisma.client.findUniqueOrThrow({
      where: { id: clientId },
      select: {
        name: true,
        slug: true,
        _count: {
          select: {
            documents: true,
            conversations: true,
            users: true,
          }
        }
      }
    }),
    // Obtener conteo de mensajes
    prisma.$queryRaw`
      SELECT COUNT(m.id) as message_count
      FROM "Message" m
      JOIN "Conversation" c ON c.id = m."conversationId"
      WHERE c."clientId" = ${clientId}
    `
  ]);

  const [client, messageCountResult] = results;
  const messageCount = (messageCountResult as Array<{ message_count: number }>)[0];
  
  const data = {
    clientName: client.name,
    clientSlug: client.slug,
    documents: client._count.documents,
    conversations: client._count.conversations,
    messages: Number(messageCount.message_count),
    users: client._count.users
  };

  const endTime = performance.now();
  const executionTime = endTime - startTime;
  console.log(`getCountData ejecutado en ${executionTime.toFixed(2)}ms`);

  return data;
}

export async function getCountDataOfAllClients(): Promise<CountData[]> {
  const startTime = performance.now();

  const results = await prisma.$transaction([
    // Obtener clientes con conteos de documentos, conversaciones y usuarios
    prisma.client.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        id: true,
        name: true,
        slug: true,
        _count: {
          select: {
            documents: true,
            conversations: true,
            users: true,
          }
        }
      }
    }),
    // Obtener conteo de mensajes agrupados por clientId
    prisma.$queryRaw`
      SELECT c."clientId", COUNT(m.id) as message_count
      FROM "Message" m
      JOIN "Conversation" c ON c.id = m."conversationId"
      GROUP BY c."clientId"
    `
  ]);

  const [clientsWithCounts, messagesCounts] = results;
  
  // Crear mapa de clientId -> conteo de mensajes
  const messageCountMap = new Map(
    (messagesCounts as { clientId: string, message_count: number }[])
      .map(mc => [mc.clientId, Number(mc.message_count)])
  );

  const data = clientsWithCounts.map(client => ({
    clientName: client.name,
    clientSlug: client.slug,
    documents: client._count.documents,
    conversations: client._count.conversations,
    messages: messageCountMap.get(client.id) || 0,
    users: client._count.users
  }));

  const endTime = performance.now();
  const executionTime = endTime - startTime;
  console.log(`getCountDataOfAllClients ejecutado en ${executionTime.toFixed(2)}ms`);

  return data;
}

// export async function getFunctionsOfClient(clientId: string) {
//   const client= await prisma.client.findUnique({
//     where: {
//       id: clientId
//     },
//     include: {
//       functions: true,      
//     }
//   })

//   if (!client) return []

//   const functionsIds= client.functions.map((f) => f.functionId)

//   const functions= await prisma.function.findMany({
//     where: {
//       id: {
//         in: functionsIds
//       }
//     },
//     include: {
//       repositories: true
//     },
//   })

//   return functions
// }

// get functions of client in one query
export async function getFunctionsOfClient(clientId: string) {
  const functions = await prisma.function.findMany({
    where: {
      clients: {
        some: {
          clientId
        }
      }
    },
    include: {
      repositories: true,
      clients: true
    }
  })

  return functions as FunctionDAO[]
}

// export async function getComplementaryFunctionsOfClient(clientId: string) {
//   const client= await prisma.client.findUnique({
//     where: {
//       id: clientId
//     },
//     include: {
//       functions: true
//     }
//   })

//   if (!client) return []

//   const clientFunctions= client.functions

//   const allFunctions= await prisma.function.findMany()

//   const complementary= allFunctions.filter((f) => !clientFunctions.find((cf) => cf.functionId === f.id))

//   return complementary
// }

export async function getComplementaryFunctionsOfClient(clientId: string) {
  const functions = await prisma.function.findMany({
    where: {
      clients: {
        none: {
          clientId
        }
      },
      repositories: {
        none: {}
      }
    }
  })

  return functions as FunctionDAO[]
}

// model Function {
//   id             String       @id @default(cuid())
//   name           String       @unique             // gennext: show.column
//   description    String?                          // gennext: show.column
//   definition     String?      @db.Text            // gennext: show.column
//   createdAt      DateTime     @default(now())     // gennext: skip.zod
//   updatedAt      DateTime     @updatedAt          // gennext: skip.zod

//   clients        ClientFunction[]                 // gennext: skip.list
// 	@@map("Function")                               // gennext: skip.list
// }

// model ClientFunction {
//   client   Client @relation(fields: [clientId], references: [id])
//   clientId String

//   function  Function @relation(fields: [functionId], references: [id])
//   functionId String
  
//   @@id([clientId, functionId])
// 	@@map("ClientFunction")
// }


// disconnect existing functions and connect new ones
export async function setFunctions(clientId: string, functionIs: string[]) {
  const client= await prisma.client.findUnique({
    where: {
      id: clientId
    },
    include: {
      functions: true
    }
  })

  if (!client) throw new Error('Client not found')

  const clientFunctions= client.functions

  const toDisconnect= clientFunctions.filter((cf) => !functionIs.includes(cf.functionId))
  const toConnect= functionIs.filter((fi) => !clientFunctions.find((cf) => cf.functionId === fi))

  await Promise.all(toDisconnect.map((cf) => prisma.clientFunction.delete({
    where: {
      clientId_functionId: {
        clientId,
        functionId: cf.functionId
      }
    }
  })))

  await Promise.all(toConnect.map((fi) => prisma.clientFunction.create({
    data: {
      clientId,
      functionId: fi
    }
  })))

  return true
}

export async function addFunctionToClient(clientId: string, functionId: string) {
  await prisma.clientFunction.create({
    data: {
      clientId,
      functionId
    }
  })
}

export async function removeFunctionFromClient(clientId: string, functionId: string) {
  await prisma.clientFunction.delete({
    where: {
      clientId_functionId: {
        clientId,
        functionId
      }
    }
  })
}

export async function getComplementaryClients(clientsIds: string[]) {
  const clients = await prisma.client.findMany({
    where: {
      id: {
        notIn: clientsIds
      }
    },
  })
  return clients
}

export async function clientHaveEvents(slug: string) {
  const client= await prisma.client.findUnique({
    where: {
      slug
    },
  })
  if (!client) return false

  return client.haveEvents
}

export async function setHaveEvents(clientId: string, haveEvents: boolean) {
  const client= await prisma.client.update({
    where: {
      id: clientId
    },
    data: {
      haveEvents
    }
  })

  if (haveEvents) {
    await addEventFunctionsToClient(clientId)
  } else {
    await removeEventFunctionsFromClient(clientId)
  }

  return client
}

async function addEventFunctionsToClient(clientId: string) {
  const eventFunctions = [
    "obtenerDisponibilidad",
    "reservarParaEvento", 
    "obtenerReservas",
    "cancelarReserva",
    "reservarParaEventoDeUnicaVez"
  ];

  const results = await Promise.all(
    eventFunctions.map(async (functionName) => {
      try {
        const functionId = await getFunctionIdByFunctionName(functionName);
        if (!functionId) {
          console.warn(`Función ${functionName} no encontrada`);
          return false;
        }
        await addFunctionToClient(clientId, functionId);
        return true;
      } catch (error) {
        console.error(`Error al agregar función ${functionName}:`, error);
        return false;
      }
    })
  );

  return results.some(result => result); // retorna true si al menos una función se agregó exitosamente
}

async function removeEventFunctionsFromClient(clientId: string) {
  const eventFunctions = [
    "obtenerDisponibilidad",
    "reservarParaEvento", 
    "obtenerReservas",
    "cancelarReserva",
    "reservarParaEventoDeUnicaVez"
  ];

  const results = await Promise.all(
    eventFunctions.map(async (functionName) => {
      try {
        const functionId = await getFunctionIdByFunctionName(functionName);
        if (!functionId) {
          console.warn(`Función ${functionName} no encontrada`);
          return false;
        }
        await removeFunctionFromClient(clientId, functionId);
        return true;
      } catch (error) {
        console.error(`Error al remover función ${functionName}:`, error);
        return false;
      }
    })
  );

  return results.some(result => result); // retorna true si al menos una función se removió exitosamente
}


export async function setWhatsappInstance(whatsappInstanceData: WhatsappInstanceDAO) {
  const whatsappInstance = await prisma.whatsappInstance.findFirst({
    where: {
      clientId: whatsappInstanceData.clientId
    }
  })

  if (!whatsappInstance) {
    const newWhatsappInstance = await prisma.whatsappInstance.create({
      data: {
        ...whatsappInstanceData,
        clientId: whatsappInstanceData.clientId
      }
    })
    return newWhatsappInstance
  } else {
    const updatedWhatsappInstance = await prisma.whatsappInstance.update({
      where: {
        id: whatsappInstance.id
      },
      data: whatsappInstanceData
    })
    return updatedWhatsappInstance
  }  

}

export async function deleteWhatsappInstance(instanceName: string) {
  const instance = await prisma.whatsappInstance.findFirst({
    where: {
      name: instanceName
    }
  })
  if (!instance) {
    return null
  }
  const deletedInstance = await prisma.whatsappInstance.delete({
    where: {
      id: instance.id
    }
  })
  return deletedInstance
}

export async function setInboxProvider(clientId: string, inboxProvider: InboxProvider) {
  const client = await prisma.client.update({
    where: {
      id: clientId
    },
    data: {
      inboxProvider
    }
  })
  return client
}

export async function getWhatsappInstance(clientId: string) {
  const client = await prisma.client.findUnique({
    where: {
      id: clientId
    },
    select: {
      whatsappInstances: true
    }
  })
  if (!client) return null
  if (client.whatsappInstances.length === 0) return null

  return client.whatsappInstances[0]
}

export async function setChatwootData(clientId: string, chatwootAccountId: string, chatwootAccessToken: string, chatwootUrl: string, whatsappInboxId: string) {
  const whatsappInstance = await prisma.whatsappInstance.findFirst({
    where: {
      clientId
    }
  })

  if (!whatsappInstance) {
    throw new Error('Whatsapp instance not found')
  }

  const updatedInstance = await prisma.whatsappInstance.update({
    where: {
      id: whatsappInstance.id
    },
    data: {
      chatwootAccountId,
      chatwootAccessToken,
      chatwootUrl,
      whatsappInboxId
    }
  })

  return updatedInstance
}

export async function setWhatsappInboxId(clientId: string, whatsappInboxId: string) {
  const whatsappInstance = await prisma.whatsappInstance.findFirst({
    where: {
      clientId
    }
  })
  if (!whatsappInstance) {
    throw new Error('Whatsapp instance not found')
  }
  const updatedInstance = await prisma.whatsappInstance.update({
    where: {
      id: whatsappInstance.id
    },
    data: {
      whatsappInboxId
    }
  })
  return updatedInstance
}

export async function getClientIdsWithChatwootData() {
  const clients = await prisma.whatsappInstance.findMany({
    where: {
      chatwootAccountId: {
        not: null
      }
    },
    select: {
      clientId: true
    }
  })

  return clients.map((c) => c.clientId)
}

export async function getChatwootAccountId(clientId: string) {
  const client = await prisma.whatsappInstance.findFirst({
    where: {
      clientId
    },
    select: {
      chatwootAccountId: true
    }
  })

  if (!client) return null

  return client.chatwootAccountId
} 

export async function getClientIdByChatwootAccountId(chatwootAccountId: string) {
  const client= await prisma.whatsappInstance.findFirst({
    where: {
      chatwootAccountId
    },
    select: {
      clientId: true
    }
  })

  if (!client) return null

  return client.clientId
}

export async function setHaveAgents(clientId: string, haveAgents: boolean) {
  const client= await prisma.client.update({
    where: {
      id: clientId
    },
    data: {
      haveAgents
    }
  })

  return client
}

export async function clientHaveCRM(slug: string) {
  const client= await prisma.client.findUnique({
    where: {
      slug
    },
    select: {
      haveCRM: true
    }
  })

  return client?.haveCRM || false
}

export async function setHaveCRM(clientId: string, haveCRM: boolean) {
  const firstStage= await getFirstStageOfClient(clientId)
  if (!firstStage) {
    console.log('No first stage found, creating default stages')
    await createDefaultStages(clientId)
  }

  const updated= await prisma.client.update({
    where: {
      id: clientId
    },
    data: {
      haveCRM
    }
  })

  return updated
}

export async function clientHaveProducts(slug: string) {
  const client= await prisma.client.findUnique({
    where: {
      slug
    },
    select: {
      haveProducts: true
    }
  })
  return client?.haveProducts || false
}

export async function getClientHaveCRM(clientId: string) {
  const client= await prisma.client.findUnique({
    where: {
      id: clientId
    },
    select: {
      haveCRM: true
    }
  })
  return client?.haveCRM || false
}

export async function getClientHaveCRMBySlug(slug: string) {
  const client= await prisma.client.findUnique({
    where: {
      slug
    },
    select: {
      haveCRM: true
    }
  })
  return client?.haveCRM || false
}

export async function addTag(clientId: string, tag: string) {
  const updated= await prisma.client.update({
    where: {
      id: clientId
    },
    data: {
      tags: {
        push: tag
      }
    }
  })

  return updated
}

export async function removeTag(clientId: string, tag: string) {
  const client= await prisma.client.findUnique({
    where: {
      id: clientId
    }
  })
  if (!client) throw new Error('Client not found')

  const updated= await prisma.client.update({
    where: {
      id: clientId
    },
    data: {
      tags: {
        set: client.tags.filter((t) => t !== tag)
      }
    }
  })

  return updated
}

export async function getAllTags(clientId: string) {
  const res= []
  const client= await prisma.client.findUnique({
    where: {
      id: clientId
    },
    include: {
      functions: true
    }
  })

  if (!client) throw new Error('Client not found')

  res.push(...client.tags)

  if (client.functions) {
    res.push(...client.functions.map((f) => f.tags).flat())
  }

  return res
}

export async function getClientName(clientId: string) {
  const client= await prisma.client.findUnique({
    where: {
      id: clientId
    }
  })
  return client?.name || ''
}

export async function setWapSendFrequency(clientId: string, wapSendFrequency: number) {
  const client= await prisma.client.update({
    where: {
      id: clientId
    },
    data: {
      wapSendFrequency
    }
  })
  return client
}

export async function getClientOfCampaign(campaignId: string) {
  const client= await prisma.client.findFirst({
    where: {
      campaigns: {
        some: {
          id: campaignId
        }
      }
    }
  })
  return client
}

export async function getClientIdBySlug(slug: string) {
  const client= await prisma.client.findUnique({
    where: {
      slug
    }
  })
  return client?.id || null
}

export async function getLastClientId() {
  const client= await prisma.client.findFirst({
    orderBy: {
      createdAt: 'desc'
    }
  })
  return client?.id || null
}

export async function getClientAndCustomFieldsBySlug(slug: string) {
  const client= await prisma.client.findUnique({
    where: {
      slug
    },
    include: {
      customFields: {
        orderBy: {
          order: 'asc'
        }
      }
    }
  })
  return client
}

export async function setHaveAudioResponse(clientId: string, haveAudioResponse: boolean) {
  const client= await prisma.client.update({
    where: {
      id: clientId
    },
    data: {
      haveAudioResponse
    }
  })
  return client
}

export async function setHaveProducts(clientId: string, haveProducts: boolean) {
  const client = await prisma.client.update({
    where: { id: clientId },
    data: {
      haveProducts
    }
  })

  if (haveProducts) {
    await addProductFunctionsToClient(clientId)
  } else {
    await removeProductFunctionsFromClient(clientId)
  }

  return client
}

async function addProductFunctionsToClient(clientId: string) {
  const productFunctions = [
    "buscarProducto"
  ];

  const results = await Promise.all(
    productFunctions.map(async (functionName) => {
      try {
        const functionId = await getFunctionIdByFunctionName(functionName);
        if (!functionId) {
          console.warn(`Función ${functionName} no encontrada`);
          return false;
        }
        await addFunctionToClient(clientId, functionId);
        return true;
      } catch (error) {
        console.error(`Error al agregar función ${functionName}:`, error);
        return false;
      }
    })
  );

  return results.some(result => result); // retorna true si al menos una función se agregó exitosamente  
}

async function removeProductFunctionsFromClient(clientId: string) {
  const productFunctions = [
    "buscarProducto"
  ];
 
  const results = await Promise.all(
    productFunctions.map(async (functionName) => {
      try {
        const functionId = await getFunctionIdByFunctionName(functionName);
        if (!functionId) {
          console.warn(`Función ${functionName} no encontrada`);
          return false;
        }
        await removeFunctionFromClient(clientId, functionId);
        return true;
      } catch (error) {
        console.error(`Error al eliminar función ${functionName}:`, error);
        return false;
      }
    })
  );

  return results.some(result => result); // retorna true si al menos una función se eliminó exitosamente
}

export async function setHaveOrderFunction(clientId: string, haveOrderFunction: boolean) {
  // No necesitamos actualizar ningún campo en la tabla de clientes específicamente
  // para esta funcionalidad, solo agregamos o quitamos la función

  if (haveOrderFunction) {
    await addOrderFunctionToClient(clientId)
  } else {
    await removeOrderFunctionFromClient(clientId)
  }

  return true
}

async function addOrderFunctionToClient(clientId: string) {
  const orderFunctions = [
    "buscarOrden"
  ];

  const results = await Promise.all(
    orderFunctions.map(async (functionName) => {
      try {
        const functionId = await getFunctionIdByFunctionName(functionName);
        if (!functionId) {
          console.warn(`Función ${functionName} no encontrada`);
          return false;
        }
        await addFunctionToClient(clientId, functionId);
        return true;
      } catch (error) {
        console.error(`Error al agregar función ${functionName}:`, error);
        return false;
      }
    })
  );

  return results.some(result => result); // retorna true si al menos una función se agregó exitosamente  
}

async function removeOrderFunctionFromClient(clientId: string) {
  const orderFunctions = [
    "buscarOrden"
  ];
 
  const results = await Promise.all(
    orderFunctions.map(async (functionName) => {
      try {
        const functionId = await getFunctionIdByFunctionName(functionName);
        if (!functionId) {
          console.warn(`Función ${functionName} no encontrada`);
          return false;
        }
        await removeFunctionFromClient(clientId, functionId);
        return true;
      } catch (error) {
        console.error(`Error al eliminar función ${functionName}:`, error);
        return false;
      }
    })
  );

  return results.some(result => result); // retorna true si al menos una función se eliminó exitosamente
}

/**
 * Verifica si un cliente tiene la función buscarOrden asociada
 * @param clientId ID del cliente a verificar
 * @returns true si el cliente tiene la función buscarOrden asociada
 * @note Esta función debe ser llamada solo desde Server Components o Server Actions.
 */
export async function clientHasOrderFunction(clientId: string): Promise<boolean> {
  try {
    // Verificamos si existe una relación entre el cliente y la función buscarOrden
    const functionName = "buscarOrden";
    const functionId = await getFunctionIdByFunctionName(functionName);
    
    if (!functionId) {
      console.warn(`Función ${functionName} no encontrada`);
      return false;
    }
    
    const clientFunction = await prisma.clientFunction.findFirst({
      where: {
        clientId,
        functionId
      }
    });
    
    return !!clientFunction;
  } catch (error) {
    console.error("Error al verificar función de órdenes:", error);
    return false;
  }
}

export async function getApiKey(clientId: string) {
  const client= await prisma.client.findUnique({
    where: {
      id: clientId
    },
    select: {
      apiKey: true
    }
  })
  if (!client) return null
  
  return client.apiKey
}

export async function setAvailability(clientId: string, availability: string[]) {
  const client= await prisma.client.update({
    where: {
      id: clientId
    },
    data: {
      availability
    }
  })
  return client
}

export async function setTimezone(clientId: string, timezone: string): Promise<boolean> {
  const client= await prisma.client.update({
    where: {
      id: clientId
    },
    data: {
      timezone
    }
  })
  if (!client) return false
  return true
}

export async function checkWorkingHoursNow(clientId: string): Promise<boolean> {
  
  const client = await prisma.client.findUnique({
    where: {
      id: clientId
    }
  })
  if (!client) throw new Error('Client not found')

  console.log('⏰ Verificando horario de atención para cliente:', client.name)

  const availability = client.availability
  const timezone = client.timezone || 'America/Montevideo'
  
  // Si no hay disponibilidad configurada o todos los días están vacíos, asumimos disponibilidad 24/7
  if (!availability || availability.length === 0 || availability.every(slot => !slot)) {
    console.log('📅 Sin horarios configurados - asumiendo disponibilidad 24/7')
    return true
  }
  
  console.log('📅 Disponibilidad configurada:', availability)
  console.log('🌍 Timezone:', timezone)
  
  // Obtener la fecha actual en la zona horaria del cliente usando date-fns-tz
  const now = new Date()
  const clientTime = toZonedTime(now, timezone)
  
  console.log('🕐 Hora actual UTC:', formatInTimeZone(now, 'UTC', 'yyyy-MM-dd HH:mm:ss zzz'))
  console.log('🕐 Hora en timezone del cliente:', formatInTimeZone(now, timezone, 'yyyy-MM-dd HH:mm:ss zzz'))
  
  // Obtener el día de la semana (1 = lunes, ..., 7 = domingo)
  let dayOfWeek = getDay(clientTime)
  // Convertir a formato donde 0 = lunes, ..., 6 = domingo
  dayOfWeek = dayOfWeek === 0 ? 6 : dayOfWeek - 1
  
  console.log('📆 Día de la semana (0=lunes, 6=domingo):', dayOfWeek)
  
  // Obtener los rangos horarios para el día actual
  const todayRanges = availability[dayOfWeek]
  console.log('⏰ Rangos horarios para hoy:', todayRanges || 'Sin horarios definidos')
  
  if (!todayRanges) return false
  
  // Obtener la hora actual en formato de minutos desde medianoche usando date-fns
  const currentMinutes = getHours(clientTime) * 60 + getMinutes(clientTime)
  //console.log('⏱️ Minutos transcurridos desde medianoche:', currentMinutes)
  
  // Dividir los rangos si hay múltiples (separados por coma)
  const ranges = todayRanges.split(',')
  
  // Verificar cada rango
  for (const range of ranges) {
    if (!range) continue
    
    const [start, end] = range.split('-')
    if (!start || !end) continue
    
    // Convertir las horas de inicio y fin a minutos
    const [startHour, startMinute] = start.split(':').map(Number)
    const [endHour, endMinute] = end.split(':').map(Number)
    
    const startMinutes = startHour * 60 + startMinute
    const endMinutes = endHour * 60 + endMinute
    
    console.log('🔍 Verificando rango:', range)
    // console.log('   ├─ Inicio (minutos):', startMinutes)
    // console.log('   ├─ Actual (minutos):', currentMinutes)
    // console.log('   └─ Fin (minutos):', endMinutes)
    
    // Verificar si la hora actual está dentro del rango
    if (currentMinutes >= startMinutes && currentMinutes <= endMinutes) {
      console.log('✅ Dentro del horario de atención')
      return true
    }
  }
  
  console.log('❌ Fuera del horario de atención')
  return false
}

export async function getClientSlug(clientId: string) {
  const client= await prisma.client.findUnique({
    where: {
      id: clientId
    },
    select: {
      slug: true
    }
  })
  return client?.slug || null
}

export async function getClientsByFCImplementation() {
  const clients = await prisma.client.findMany({
    orderBy: {
      createdAt: 'desc'
    },
    include: {
      users: true,
      model: true,
      whatsappInstances: true,
      functions: {
        include: {
          function: {
            include: {
              repositories: true
            }
          }
        },
        orderBy: {
          function: {
            createdAt: 'desc'
          }
        }
      }
    }
  });

  // Procesamos los clientes para añadir información sobre funciones y repositorios
  const processedClients = clients.map(client => {
    // Calculamos la cantidad de funciones
    const fcCount = client.functions.length;
    
    // Calculamos la cantidad total de repositorios asociados a las funciones del cliente
    const repoCount = client.functions.reduce((total, cf) => {
      return total + (cf.function.repositories?.length || 0);
    }, 0);
    
    // Obtenemos la fecha de la última función si existe Y tiene repositorios
    // Solo asignamos una fecha si realmente hay repositorios
    let lastFunctionDate = null;
    if (repoCount > 0 && fcCount > 0) {
      // Buscamos la función más reciente que tenga al menos un repositorio
      for (const cf of client.functions) {
        if (cf.function.repositories && cf.function.repositories.length > 0) {
          lastFunctionDate = cf.function.createdAt;
          break; // Tomamos la primera función que tiene repositorios (ya están ordenadas por fecha)
        }
      }
    }
    
    // Creamos un nuevo objeto cliente con propiedades adicionales
    return {
      ...client,
      fcCount,
      repoCount,
      lastFunctionDate
    };
  });

  // Función para ordenar por fecha de última función (null al final)
  const sortByLastFunctionDate = (a: any, b: any) => {
    if (a.lastFunctionDate === null) return 1;
    if (b.lastFunctionDate === null) return -1;
    return new Date(b.lastFunctionDate).getTime() - new Date(a.lastFunctionDate).getTime();
  };

  // Ordenamos ambas listas por fecha de última función
  const implementedClients = processedClients
    .filter(client => client.fcImplemented)
    .sort(sortByLastFunctionDate);
    
  const nonImplementedClients = processedClients
    .filter(client => !client.fcImplemented)
    .sort(sortByLastFunctionDate);

  return {
    implementedClients,
    nonImplementedClients
  };
}

export async function setFCImplementation(clientId: string, fcImplemented: boolean) {
  const updated = await prisma.client.update({
    where: {
      id: clientId
    },
    data: {
      fcImplemented
    }
  });

  return updated;
}

export async function setAutoUpdateInactiveConversations(clientId: string, autoUpdateInactiveConversations: boolean) {
  const whatsappInstance = await prisma.whatsappInstance.findFirst({
    where: {
      clientId
    }
  });
  
  if (!whatsappInstance) {
    throw new Error('Whatsapp instance not found');
  }
  
  const updatedInstance = await prisma.whatsappInstance.update({
    where: {
      id: whatsappInstance.id
    },
    data: {
      autoUpdateInactiveConversations
    }
  });
  
  return updatedInstance;
}

export async function setChatwootWidgetToken(clientId: string, chatwootWidgetToken: string) {
  const whatsappInstance = await prisma.whatsappInstance.findFirst({
    where: {
      clientId
    }
  });
  
  if (!whatsappInstance) {
    throw new Error('Whatsapp instance not found');
  }
  
  const updatedInstance = await prisma.whatsappInstance.update({
    where: {
      id: whatsappInstance.id
    },
    data: {
      chatwootWidgetToken
    }
  });
  
  return updatedInstance;
}

export async function getClientsWithAbandonedOrders() {
  const clients = await prisma.client.findMany({
    where: {
      abandonedOrders: {
        some: {}
      }
    }
  });

  return clients;
}

