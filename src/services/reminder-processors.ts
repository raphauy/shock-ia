import { prisma } from "@/lib/db"
import { AbandonedOrderStatus, ReminderStatus, ReminderType } from "@prisma/client"
import { ReminderDAO } from "./reminder-services";
import { sendMessageToContact } from "./campaign-services"
import { getOrderStatus } from "./fenicio-services"
import { getAbandonedOrderById, markAbandonedOrderAsExpired, markAbandonedOrderAsReminderSent, markAbandonedOrderAsError } from "./abandoned-orders-service"

// Interfaz para los procesadores de recordatorios
export interface ReminderProcessor {
  canProcess(reminder: ReminderDAO): boolean;
  process(reminder: ReminderDAO): Promise<ReminderDAO>;
}

// Procesador genérico (comportamiento predeterminado)
export class GenericReminderProcessor implements ReminderProcessor {
  canProcess(reminder: ReminderDAO): boolean {
    return reminder.type === ReminderType.GENERIC || 
           (reminder.type === ReminderType.BOOKING && reminder.booking !== null);
  }

  async process(reminder: ReminderDAO): Promise<ReminderDAO> {
    console.log(`🔄 Procesando recordatorio genérico: ${reminder.id}`);
    
    const contact = reminder.contact;
    const message = reminder.message;
    
    try {
      const conversationId = await sendMessageToContact(
        contact.clientId, 
        contact, 
        message, 
        [], 
        null, 
        ""
      );
      
      // Crear un objeto con los campos de inclusión permitidos
      const updatedReminder = await prisma.reminder.update({
        where: { id: reminder.id },
        data: {
          status: ReminderStatus.ENVIADO,
          sentAt: new Date(),
          conversationId
        },
        include: {
          contact: true,
          reminderDefinition: true,
          booking: true,
        }
      });
      
      console.log(`✅ Recordatorio genérico enviado con éxito: ${reminder.id}`);
      
      // Reconstruir el objeto ReminderDAO con todos los campos necesarios
      return {
        ...updatedReminder,
        type: reminder.type, // Mantener el tipo original
        abandonedOrder: reminder.abandonedOrder, // Mantener la orden abandonada original si existe
      } as unknown as ReminderDAO;
    } catch (error: any) {
      console.error(`❌ Error al enviar recordatorio genérico: ${error.message}`);
      const updatedReminder = await prisma.reminder.update({
        where: { id: reminder.id },
        data: {
          status: ReminderStatus.ERROR,
          error: `Error al enviar mensaje: ${error.message}`
        },
        include: {
          contact: true,
          reminderDefinition: true,
          booking: true,
        }
      });
      
      return {
        ...updatedReminder,
        type: reminder.type,
        abandonedOrder: reminder.abandonedOrder,
      } as unknown as ReminderDAO;
    }
  }
}

// Procesador para recordatorios de órdenes abandonadas
export class AbandonedOrderReminderProcessor implements ReminderProcessor {
  canProcess(reminder: ReminderDAO): boolean {
    return reminder.type === ReminderType.ABANDONED_ORDER && reminder.abandonedOrder !== null;
  }

  async process(reminder: ReminderDAO): Promise<ReminderDAO> {
    console.log(`🔄 Procesando recordatorio de orden abandonada: ${reminder.id}`);
    
    // 1. Verificar si la orden sigue abandonada en Fenicio
    const abandonedOrder = reminder.abandonedOrder;
    
    try {
      // Verificar si la orden sigue en estado ABANDONADA en Fenicio
      const orderStatus = await getOrderStatus(abandonedOrder.clientId, abandonedOrder.externalId);
      
      // Si la orden ya no está abandonada (fue completada o cancelada)
      if (orderStatus.status !== "ABANDONADA") {
        console.log(`ℹ️ La orden ${abandonedOrder.externalId} ya no está abandonada en Fenicio (Estado: ${orderStatus.status}). Cancelando recordatorio.`);
        
        // Actualizar la orden abandonada en nuestra BD a EXPIRADA utilizando el servicio
        const updatedAbandonedOrder = await markAbandonedOrderAsExpired(abandonedOrder.id);
        
        // Cancelar el recordatorio
        const updatedReminder = await prisma.reminder.update({
          where: { id: reminder.id },
          data: {
            status: ReminderStatus.CANCELADO,
            error: `La orden ya no está abandonada en Fenicio (Estado: ${orderStatus.status})`
          },
          include: {
            contact: true,
            reminderDefinition: true,
            booking: true,
          }
        });
        
        return {
          ...updatedReminder,
          type: reminder.type,
          abandonedOrder: updatedAbandonedOrder,
        } as unknown as ReminderDAO;
      }
      
      // 2. Si sigue abandonada, enviar el recordatorio
      const contact = reminder.contact;
      let message = reminder.message;
      
      // Asegurarse de que {productosCantidad} está hidratada en el mensaje
      if (message.includes('{productosCantidad}') && abandonedOrder.productos) {
        const productosCount = abandonedOrder.productos.length;
        message = message.replace('{productosCantidad}', productosCount.toString());
      } else if (message.includes('{productosCantidad}')) {
        // Si no hay productos, usar "0"
        message = message.replace('{productosCantidad}', "0");
      }
      
      const conversationId = await sendMessageToContact(
        contact.clientId, 
        contact, 
        message, 
        [], 
        null, 
        ""
      );
      
      // 3. Actualizar el estado del recordatorio
      const updatedReminder = await prisma.reminder.update({
        where: { id: reminder.id },
        data: {
          status: ReminderStatus.ENVIADO,
          sentAt: new Date(),
          conversationId
        },
        include: {
          contact: true,
          reminderDefinition: true,
          booking: true,
        }
      });
      
      // 4. Actualizar el estado de la orden abandonada utilizando el servicio
      const updatedAbandonedOrder = await markAbandonedOrderAsReminderSent(abandonedOrder.id);
      
      console.log(`✅ Recordatorio de orden abandonada enviado con éxito: ${reminder.id}`);
      
      return {
        ...updatedReminder,
        type: reminder.type,
        abandonedOrder: updatedAbandonedOrder,
      } as unknown as ReminderDAO;
      
    } catch (error: any) {
      // Mejorar el log de errores con más detalles
      console.error(`❌ Error al procesar recordatorio de orden abandonada: ${reminder.id}`);
      console.error(`Detalles del error: ${error.message}`);
      
      // Registrar el stack trace si está disponible
      if (error.stack) {
        console.error(`Stack trace: ${error.stack}`);
      }
      
      // Registrar detalles adicionales si existen
      if (error.status) console.error(`Status code: ${error.status}`);
      if (error.body) console.error(`Error body: ${JSON.stringify(error.body)}`);
      
      // Mensaje de error detallado para guardar en la BD
      const errorMessage = `Error al procesar recordatorio: ${error.message}${error.status ? ` (Status: ${error.status})` : ''}`;
      
      try {
        // Marcar la orden como ERROR utilizando el servicio
        if (abandonedOrder && abandonedOrder.id) {
          await markAbandonedOrderAsError(abandonedOrder.id, errorMessage);
          console.log(`✅ Orden abandonada ${abandonedOrder.id} marcada como ERROR`);
        }
        
        // Marcar el recordatorio como error
        const updatedReminder = await prisma.reminder.update({
          where: { id: reminder.id },
          data: {
            status: ReminderStatus.ERROR,
            error: errorMessage
          },
          include: {
            contact: true,
            reminderDefinition: true,
            booking: true,
          }
        });
        
        console.log(`✅ Recordatorio ${reminder.id} marcado como ERROR`);
        
        return {
          ...updatedReminder,
          type: reminder.type,
          abandonedOrder: abandonedOrder,
        } as unknown as ReminderDAO;
      } catch (secondaryError: any) {
        // Capturar errores que puedan ocurrir al actualizar el estado
        console.error(`❌ Error secundario al actualizar estados: ${secondaryError.message}`);
        
        // Aún así devolver un objeto con estado de ERROR
        return {
          ...reminder,
          status: ReminderStatus.ERROR,
          error: errorMessage,
        } as unknown as ReminderDAO;
      }
    }
  }
}

// Función para obtener todos los procesadores disponibles
export function getAvailableProcessors(): ReminderProcessor[] {
  return [
    new AbandonedOrderReminderProcessor(),
    new GenericReminderProcessor() // Este debe ser el último, ya que puede procesar cualquier tipo
  ];
} 