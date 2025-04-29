import { prisma } from '@/lib/db';
import { setInactiveOpenConversationsAsPending } from './chatwoot';
import { getValue, setValue } from './config-services';
import { createEventLog, CreateEventLogParams, EventType } from './event-log-services';
import { getCurrentTimeInMontevideo } from '@/lib/utils';

const PROCESSING_FLAG_KEY = 'CHATWOOT_CONVERSATION_UPDATER_PROCESSING';
const LAST_RUN_KEY = 'CHATWOOT_CONVERSATION_UPDATER_LAST_RUN';

// Configuración de rango horario permitido
const START_HOUR = 7;
const END_HOUR = 22;


/**
 * Verifica si la hora actual está dentro del rango horario permitido
 * @returns true si la hora actual está dentro del rango permitido
 */
function isWithinAllowedTimeRange(): boolean {
  const currentTime = getCurrentTimeInMontevideo();
  return currentTime.hour >= START_HOUR && currentTime.hour < END_HOUR;
}

/**
 * Ejecuta la actualización de conversaciones inactivas en todas las instancias de WhatsApp configuradas
 * @returns Objeto con estadísticas de la ejecución
 */
export async function updateInactiveConversations(): Promise<{
  totalInstances: number;
  processedInstances: number;
  totalConversationsUpdated: number;
  totalExecutionTime: number;
  errors: string[];
  instanceResults: Array<{
    instanceName: string;
    clientName: string;
    accountId: string;
    conversationsUpdated: number;
    executionTime: number;
    error?: string;
  }>;
}> {
  // Verificar si estamos dentro del rango horario permitido
  if (!isWithinAllowedTimeRange()) {
    const currentTime = getCurrentTimeInMontevideo();
    console.log(`Hora actual (${currentTime.formatted}) fuera del rango permitido (${START_HOUR}:00 - ${END_HOUR}:00). Finalizando...`);
    return {
      totalInstances: 0,
      processedInstances: 0,
      totalConversationsUpdated: 0,
      totalExecutionTime: 0,
      errors: ['Hora fuera del rango permitido'],
      instanceResults: []
    };
  }

  const startTime = Date.now();
  const errors: string[] = [];
  const instanceResults: Array<{
    instanceName: string;
    clientName: string;
    accountId: string;
    conversationsUpdated: number;
    executionTime: number;
    error?: string;
  }> = [];
  
  console.log(`Configuración:
    - Rango horario permitido: ${START_HOUR}:00 - ${END_HOUR}:00 (Montevideo})`);
  
  // Verificar si ya hay una instancia en ejecución
  const isProcessing = await getValue(PROCESSING_FLAG_KEY);
  if (isProcessing === 'true') {
    console.log('Ya hay una instancia del updater en ejecución. Finalizando...');
    return {
      totalInstances: 0,
      processedInstances: 0,
      totalConversationsUpdated: 0,
      totalExecutionTime: 0,
      errors: ['Ya hay una instancia en ejecución'],
      instanceResults: []
    };
  }

  try {
    // Marcar que estamos procesando
    await setValue(PROCESSING_FLAG_KEY, 'true');
    
    // Obtener todas las instancias de WhatsApp que tienen autoUpdateInactiveConversations = true
    const instances = await prisma.whatsappInstance.findMany({
      where: {
        autoUpdateInactiveConversations: true,
        chatwootAccountId: {
          not: null,
        }
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    });
    
    console.log(`Iniciando actualización de conversaciones inactivas para ${instances.length} instancias...`);
    
    let processedInstances = 0;
    let totalConversationsUpdated = 0;
    
    // Procesar cada instancia
    for (const instance of instances) {
      const instanceStartTime = Date.now();
      console.log(`\nProcesando instancia: ${instance.name} (cliente: ${instance.client.name})`);
      
      try {
        if (!instance.chatwootAccountId) {
          throw new Error('La instancia no tiene un ID de cuenta de Chatwoot configurado');
        }
        
        const accountId = parseInt(instance.chatwootAccountId, 10);
        if (isNaN(accountId)) {
          throw new Error(`ID de cuenta de Chatwoot inválido: ${instance.chatwootAccountId}`);
        }
        
        // Actualizar conversaciones inactivas
        console.log(`Actualizando conversaciones inactivas para cuenta ${accountId}...`);
        const updatedConversations = await setInactiveOpenConversationsAsPending(accountId);
        totalConversationsUpdated += updatedConversations.length;
        
        // Mostrar información detallada de las conversaciones actualizadas
        if (updatedConversations.length > 0) {
          console.log("Detalle de conversaciones actualizadas:");
          updatedConversations.forEach(conv => {
            console.log(`  - Conversación ${conv.conversationId}: ${conv.contactName} (${conv.contactPhone})`);
          });
          
          // Registrar en el log de eventos
          try {
            const clientId = instance.client.id;
            const clientName = instance.client.name;

            const eventLogParams: CreateEventLogParams = {
              eventType: EventType.SET_CONVERSATION_AS_PENDING,
              metadata: updatedConversations,
              clientId,
              clientName
            };
            await createEventLog(eventLogParams);
            console.log(`  ✓ Evento registrado en el log para cliente ${clientName}`);

            
          } catch (logError) {
            console.error(`  ✗ Error al registrar en el log: ${logError instanceof Error ? logError.message : String(logError)}`);
          }
        }
        
        console.log(`Actualización completada para ${instance.name}:
          - Conversaciones actualizadas: ${updatedConversations.length}`);
        
        processedInstances++;
        
        const instanceExecutionTime = (Date.now() - instanceStartTime) / 1000;
        instanceResults.push({
          instanceName: instance.name,
          clientName: instance.client.name,
          accountId: instance.chatwootAccountId,
          conversationsUpdated: updatedConversations.length,
          executionTime: instanceExecutionTime,
        });
        
        console.log(`Instancia procesada en ${formatTime(instanceExecutionTime)}`);
      } catch (error) {
        const errorMessage = `Error procesando instancia ${instance.name} (cliente: ${instance.client.name}): ${error instanceof Error ? error.message : String(error)}`;
        console.error(errorMessage);
        errors.push(errorMessage);
        instanceResults.push({
          instanceName: instance.name,
          clientName: instance.client.name,
          accountId: instance.chatwootAccountId || 'N/A',
          conversationsUpdated: 0,
          executionTime: 0,
          error: errorMessage
        });
        // Continuar con la siguiente instancia
        continue;
      }
    }
    
    const totalExecutionTime = (Date.now() - startTime) / 1000;
    
    console.log(`\nResumen de la ejecución:
      - Instancias procesadas: ${processedInstances}/${instances.length}
      - Conversaciones actualizadas: ${totalConversationsUpdated}
      - Tiempo total de ejecución: ${formatTime(totalExecutionTime)}
      - Errores encontrados: ${errors.length}`);
    
    return {
      totalInstances: instances.length,
      processedInstances,
      totalConversationsUpdated,
      totalExecutionTime,
      errors,
      instanceResults
    };
    
  } catch (error) {
    const errorMessage = `Error general en el updater: ${error instanceof Error ? error.message : String(error)}`;
    console.error(errorMessage);
    errors.push(errorMessage);
    return {
      totalInstances: 0,
      processedInstances: 0,
      totalConversationsUpdated: 0,
      totalExecutionTime: 0,
      errors,
      instanceResults: []
    };
  } finally {
    // Limpiar la bandera de procesamiento
    await setValue(PROCESSING_FLAG_KEY, 'false');
    // Actualizar la última ejecución
    await setValue(LAST_RUN_KEY, new Date().toISOString());
  }
}

/**
 * Formatea el tiempo de ejecución en un formato legible
 * @param seconds Tiempo en segundos
 * @returns String formateado
 */
function formatTime(seconds: number): string {
  if (seconds < 60) {
    return `${seconds.toFixed(2)} segundos`;
  }
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60);
  
  if (remainingSeconds === 0) {
    return `${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}`;
  }
  
  return `${minutes} ${minutes === 1 ? 'minuto' : 'minutos'} ${remainingSeconds} ${remainingSeconds === 1 ? 'segundo' : 'segundos'}`;
}

/**
 * Función principal para ejecutar el updater como script
 */
async function main() {
  console.log('Iniciando ejecución del Chatwoot Conversation Updater...');
  
  // Mostrar información de la zona horaria
  const currentTime = getCurrentTimeInMontevideo();
  console.log(`Hora actual: ${currentTime.formatted} (Montevideo)`);
  console.log(`Rango horario configurado: ${START_HOUR}:00 - ${END_HOUR}:00 (Montevideo)`);
  
  // Verificar primero si estamos en el horario permitido
  if (!isWithinAllowedTimeRange()) {
    console.log(`Hora actual fuera del rango permitido. No se accederá a la base de datos. Finalizando...`);
    process.exit(0);
  }
  
  try {
    const result = await updateInactiveConversations();
    
    result.instanceResults.forEach(instance => {
      if (instance.error) {
        console.log(`  - Error: ${instance.error}`);
      }
    });
    
    if (result.errors.length > 0) {
      console.log('\nErrores encontrados:');
      result.errors.forEach(error => console.log(`- ${error}`));
    }
  } catch (error) {
    console.error('Error en la ejecución principal:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Si el archivo se ejecuta directamente
if (require.main === module) {
  main()
    .then(() => {
      console.log('Ejecución completada exitosamente');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Error fatal:', error);
      process.exit(1);
    });
} 