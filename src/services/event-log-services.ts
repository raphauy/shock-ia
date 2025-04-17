import { prisma } from '@/lib/db';

/**
 * Tipos de eventos del sistema
 */
export enum EventType {
  SET_CONVERSATION_AS_PENDING = 'SET_CONVERSATION_AS_PENDING',
}

/**
 * Tipo para representar un log de evento
 */
export type EventLogDAO = {
  id: string;
  eventType: string;
  metadata: string;
  clientId: string;
  clientName: string;
  createdAt: Date;
};

/**
 * Interface para la creación de un log de evento
 */
export interface CreateEventLogParams {
  eventType: EventType;
  metadata: any;
  clientId: string;
  clientName: string;
}

/**
 * Crea un nuevo registro de log de evento en la base de datos
 * @param params Parámetros para crear el log
 * @returns El log creado
 */
export async function createEventLog(params: CreateEventLogParams): Promise<EventLogDAO> {
  const { eventType, metadata, clientId, clientName } = params;
  
  const metadataString = typeof metadata === 'string' 
    ? metadata 
    : JSON.stringify(metadata);
  
  const eventLog = await prisma.eventLog.create({
    data: {
      eventType,
      metadata: metadataString,
      clientId,
      clientName
    }
  });
  
  return eventLog;
}

/**
 * Obtiene logs de eventos por cliente y opcionalmente filtra por tipo
 * @param clientId ID del cliente
 * @param eventType Tipo de evento (opcional)
 * @param limit Número máximo de registros a devolver (opcional, por defecto 50)
 * @param offset Desplazamiento para paginación (opcional, por defecto 0)
 * @returns Array de logs de eventos
 */
export async function getEventLogsByClient(
  clientId: string,
  eventType?: string,
  limit: number = 50,
  offset: number = 0
): Promise<EventLogDAO[]> {
  const whereClause = eventType
    ? { clientId, eventType }
    : { clientId };
    
  const eventLogs = await prisma.eventLog.findMany({
    where: whereClause,
    orderBy: {
      createdAt: 'desc'
    },
    take: limit,
    skip: offset
  });
  
  return eventLogs;
}

/**
 * Cuenta el número total de logs por cliente y opcionalmente por tipo
 * @param clientId ID del cliente
 * @param eventType Tipo de evento (opcional)
 * @returns Número total de logs
 */
export async function countEventLogs(
  clientId: string,
  eventType?: string
): Promise<number> {
  const whereClause = eventType
    ? { clientId, eventType }
    : { clientId };
    
  const count = await prisma.eventLog.count({
    where: whereClause
  });
  
  return count;
}

/**
 * Obtiene logs de eventos con filtros avanzados
 * @param params Parámetros de filtrado
 * @returns Array de logs de eventos y conteo total
 */
export async function getFilteredEventLogs({
  clientId,
  eventType,
  clientName,
  metadataSearch,
  from,
  to,
  limit = 50,
  offset = 0
}: {
  clientId?: string;
  eventType?: string;
  clientName?: string;
  metadataSearch?: string;
  from?: Date;
  to?: Date;
  limit?: number;
  offset?: number;
}): Promise<{ eventLogs: EventLogDAO[]; total: number }> {
  // Construir la cláusula where basada en los filtros proporcionados
  let whereClause: any = {};
  
  if (clientId) {
    whereClause.clientId = clientId;
  }
  
  if (eventType) {
    whereClause.eventType = eventType;
  }
  
  if (clientName) {
    whereClause.clientName = {
      contains: clientName,
      mode: 'insensitive'
    };
  }
  
  // Filtro por fecha
  if (from || to) {
    whereClause.createdAt = {};
    
    if (from) {
      whereClause.createdAt.gte = from;
    }
    
    if (to) {
      whereClause.createdAt.lte = to;
    }
  }
  
  // Búsqueda en metadata 
  if (metadataSearch) {
    console.log('🔍 Buscando en metadata el texto:', metadataSearch);
    whereClause.metadata = {
      contains: metadataSearch,
      mode: 'insensitive'
    };
  }
  
  // Ejecutar una única consulta para obtener los logs y el conteo
  const [eventLogs, total] = await Promise.all([
    prisma.eventLog.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'desc'
      },
      take: limit,
      skip: offset
    }),
    prisma.eventLog.count({
      where: whereClause
    })
  ]);
  
  // Procesar los logs para parsear el metadata como JSON si es posible
  const processedLogs = eventLogs.map(log => {
    try {
      // Intentamos parsear, pero mantenemos como string si falla
      const parsedLog = {
        ...log,
        metadata: JSON.parse(log.metadata)
      };
      return parsedLog;
    } catch (e) {
      // Si no se puede parsear, devolvemos el log sin cambios
      return log;
    }
  });
  
  return { eventLogs: processedLogs, total };
}

/**
 * Obtiene todos los tipos de eventos únicos disponibles en el sistema
 * @returns Array de tipos de eventos únicos
 */
export async function getAllEventTypes(): Promise<string[]> {
  // Convertir el enum EventType a un array de strings
  return Object.values(EventType);
}

/**
 * Obtiene todos los nombres de cliente únicos disponibles en los logs
 * @returns Array de nombres de cliente únicos
 */
export async function getAllClientNames(): Promise<string[]> {
  const results = await prisma.eventLog.groupBy({
    by: ['clientName'],
    orderBy: {
      clientName: 'asc'
    }
  });
  
  return results.map(r => r.clientName);
}

