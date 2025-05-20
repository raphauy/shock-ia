"use server";

import { getPaginatedConversations } from "@/services/conversation-v2-services";

export type ConversationPreview = {
  id: string;
  contactName: string;
  phone: string;
  lastUpdateTime: Date;
  imageUrl?: string | null;
};

/**
 * Formatea un error de Prisma para obtener un mensaje más amigable
 */
function formatPrismaError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  
  if (message.includes("Can't reach database server")) {
    return "No se puede conectar al servidor de base de datos. Por favor, verifica la conexión.";
  }
  
  if (message.includes("P1001")) {
    return "Error de conexión a la base de datos. Verifica que el servidor esté activo.";
  }
  
  if (message.includes("P2025")) {
    return "No se encontró el registro solicitado en la base de datos.";
  }
  
  return message;
}

/**
 * Obtiene las conversaciones paginadas para mostrar en el listado
 */
export async function getConversationsAction(
  clientId: string, 
  page: number = 1, 
  pageSize: number = 10,
  searchQuery?: string
) {
  try {
    // En el futuro implementaremos búsqueda con searchQuery
    const result = await getPaginatedConversations(clientId, page, pageSize, searchQuery);
    
    // Transformar datos para la UI
    const conversationPreviews: ConversationPreview[] = result.data.map(conversation => {
      return {
        id: conversation.id,
        contactName: conversation.contact?.name || conversation.phone || 'Sin nombre',
        phone: conversation.phone || conversation.contact?.phone || 'Sin teléfono',
        lastUpdateTime: conversation.updatedAt || conversation.createdAt,
        imageUrl: conversation.contact?.imageUrl
      };
    });
    
    return {
      success: true,
      data: conversationPreviews,
      meta: result.meta
    };
  } catch (error) {
    console.error('Error al obtener conversaciones:', error);
    return {
      success: false,
      error: formatPrismaError(error),
      meta: {
        currentPage: page,
        pageSize,
        totalCount: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false
      }
    };
  }
}

/**
 * Obtiene una conversación específica por su ID
 */
export async function getConversationAction(conversationId: string) {
  try {
    // Por ahora retornamos un mock
    return {
      success: true,
      data: {
        id: conversationId,
        // Otros datos se implementarán después
      }
    };
  } catch (error) {
    console.error('Error al obtener conversación:', error);
    return {
      success: false,
      error: formatPrismaError(error)
    };
  }
} 