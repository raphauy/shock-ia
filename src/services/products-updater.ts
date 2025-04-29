import { getFeedsToSync, syncProductsFromFeed, generateProductEmbeddings } from './product-services';
import { getValue, setValue } from './config-services';
import { getCurrentTimeInMontevideo } from '@/lib/utils';

const PROCESSING_FLAG_KEY = 'PRODUCTS_UPDATER_PROCESSING';
const LAST_RUN_KEY = 'PRODUCTS_UPDATER_LAST_RUN';
const MAX_PRODUCTS_KEY = 'PRODUCTS_UPDATER_MAX_PRODUCTS';
const MAX_EMBEDDINGS_KEY = 'PRODUCTS_UPDATER_MAX_EMBEDDINGS';

// Configuración de horario permitido (valores fijos en código)
const START_HOUR = 7;
const END_HOUR = 22;

// Valores por defecto
const DEFAULT_MAX_PRODUCTS = 100;
const DEFAULT_MAX_EMBEDDINGS = 10;

/**
 * Obtiene el valor de configuración o el valor por defecto
 * @param key Clave de configuración
 * @param defaultValue Valor por defecto
 * @returns Valor de configuración como número
 */
async function getConfigValue(key: string, defaultValue: number): Promise<number> {
  const value = await getValue(key);
  if (!value) {
    await setValue(key, defaultValue.toString());
    return defaultValue;
  }
  const numValue = parseInt(value, 10);
  return isNaN(numValue) ? defaultValue : numValue;
}


/**
 * Verifica si la hora actual está dentro del rango horario permitido
 * @returns true si la hora actual está dentro del rango permitido
 */
function isWithinAllowedTimeRange(): boolean {
  const currentTime = getCurrentTimeInMontevideo();
  return currentTime.hour >= START_HOUR && currentTime.hour < END_HOUR;
}

/**
 * Ejecuta la actualización de todos los feeds configurados para sincronización automática
 * @returns Objeto con estadísticas de la ejecución
 */
export async function updateAllFeeds(): Promise<{
  totalFeeds: number;
  processedFeeds: number;
  totalProductsSynced: number;
  totalEmbeddingsGenerated: number;
  totalExecutionTime: number;
  errors: string[];
  feedResults: Array<{
    feedId: string;
    clientName: string;
    productsSynced: number;
    embeddingsGenerated: number;
    executionTime: number;
    error?: string;
  }>;
}> {
  // Verificar si estamos dentro del rango horario permitido
  if (!isWithinAllowedTimeRange()) {
    const currentTime = getCurrentTimeInMontevideo();
    console.log(`Hora actual (${currentTime.formatted} Montevideo) fuera del rango permitido (${START_HOUR}:00 - ${END_HOUR}:00 Montevideo). Finalizando...`);
    return {
      totalFeeds: 0,
      processedFeeds: 0,
      totalProductsSynced: 0,
      totalEmbeddingsGenerated: 0,
      totalExecutionTime: 0,
      errors: ['Hora fuera del rango permitido'],
      feedResults: []
    };
  }

  const startTime = Date.now();
  const errors: string[] = [];
  const feedResults: Array<{
    feedId: string;
    clientName: string;
    productsSynced: number;
    embeddingsGenerated: number;
    executionTime: number;
    error?: string;
  }> = [];
  
  // Obtener valores de configuración
  const maxProducts = await getConfigValue(MAX_PRODUCTS_KEY, DEFAULT_MAX_PRODUCTS);
  const maxEmbeddings = await getConfigValue(MAX_EMBEDDINGS_KEY, DEFAULT_MAX_EMBEDDINGS);
  
  console.log(`Configuración:
    - Máximo de productos por feed: ${maxProducts}
    - Máximo de embeddings por feed: ${maxEmbeddings}
    - Rango horario permitido: ${START_HOUR}:00 - ${END_HOUR}:00 (Montevideo)`);
  
  // Verificar si ya hay una instancia en ejecución
  const isProcessing = await getValue(PROCESSING_FLAG_KEY);
  if (isProcessing === 'true') {
    console.log('Ya hay una instancia del updater en ejecución. Finalizando...');
    return {
      totalFeeds: 0,
      processedFeeds: 0,
      totalProductsSynced: 0,
      totalEmbeddingsGenerated: 0,
      totalExecutionTime: 0,
      errors: ['Ya hay una instancia en ejecución'],
      feedResults: []
    };
  }

  try {
    // Marcar que estamos procesando
    await setValue(PROCESSING_FLAG_KEY, 'true');
    
    // Obtener todos los feeds configurados para sincronización automática
    const feeds = await getFeedsToSync();
    console.log(`Iniciando actualización de ${feeds.length} feeds...`);
    
    let processedFeeds = 0;
    let totalProductsSynced = 0;
    let totalEmbeddingsGenerated = 0;

    // Procesar cada feed
    for (const feed of feeds) {
      const feedStartTime = Date.now();
      console.log(`\nProcesando feed: ${feed.client.name}`);
      
      try {
        // Sincronizar productos del feed
        console.log('Iniciando sincronización de productos...');
        const syncResult = await syncProductsFromFeed(feed.id, maxProducts);
        totalProductsSynced += syncResult.totalSynced;
        
        console.log(`Sincronización completada:
          - Productos nuevos: ${syncResult.newProducts}
          - Productos actualizados: ${syncResult.updatedProducts}
          - Productos sin cambios: ${syncResult.unchangedProducts}
          - Productos eliminados: ${syncResult.deletedProducts}
          - Tiempo de sincronización: ${formatTime(syncResult.executionTime)}`);

        // Generar embeddings para los productos actualizados
        console.log('Iniciando generación de embeddings...');
        const embeddingResult = await generateProductEmbeddings(feed.clientId, false, maxEmbeddings);
        totalEmbeddingsGenerated += embeddingResult.updatedCount;
        
        console.log(`Generación de embeddings completada:
          - Embeddings generados: ${embeddingResult.updatedCount}
          - Tiempo de generación: ${formatTime(embeddingResult.executionTime)}`);

        processedFeeds++;
        
        feedResults.push({
          feedId: feed.id,
          clientName: feed.client.name,
          productsSynced: syncResult.totalSynced,
          embeddingsGenerated: embeddingResult.updatedCount,
          executionTime: syncResult.executionTime,
          error: undefined
        });

      } catch (error) {
        const errorMessage = `Error procesando feed del cliente ${feed.client.name} (ID: ${feed.id}): ${error instanceof Error ? error.message : String(error)}`;
        console.error(errorMessage);
        errors.push(errorMessage);
        feedResults.push({
          feedId: feed.id,
          clientName: feed.client.name,
          productsSynced: 0,
          embeddingsGenerated: 0,
          executionTime: 0,
          error: errorMessage
        });
        // Continuar con el siguiente feed
        continue;
      }

      const feedExecutionTime = (Date.now() - feedStartTime) / 1000;
      console.log(`Feed completado en ${formatTime(feedExecutionTime)}`);
    }

    const totalExecutionTime = (Date.now() - startTime) / 1000;
    
    console.log(`\nResumen de la ejecución:
      - Feeds procesados: ${processedFeeds}/${feeds.length}
      - Productos sincronizados: ${totalProductsSynced}
      - Embeddings generados: ${totalEmbeddingsGenerated}
      - Tiempo total de ejecución: ${formatTime(totalExecutionTime)}
      - Errores encontrados: ${errors.length}`);

    return {
      totalFeeds: feeds.length,
      processedFeeds,
      totalProductsSynced,
      totalEmbeddingsGenerated,
      totalExecutionTime,
      errors,
      feedResults
    };

  } catch (error) {
    const errorMessage = `Error general en el updater: ${error instanceof Error ? error.message : String(error)}`;
    console.error(errorMessage);
    errors.push(errorMessage);
    return {
      totalFeeds: 0,
      processedFeeds: 0,
      totalProductsSynced: 0,
      totalEmbeddingsGenerated: 0,
      totalExecutionTime: 0,
      errors,
      feedResults: []
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
  console.log('Iniciando ejecución del Products Updater...');
  
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
    const result = await updateAllFeeds();
    console.log('\nResultado final:');
    console.log(`Total de feeds procesados: ${result.processedFeeds}/${result.totalFeeds}`);
    console.log(`Total de productos sincronizados: ${result.totalProductsSynced}`);
    console.log(`Total de embeddings generados: ${result.totalEmbeddingsGenerated}`);
    console.log(`Tiempo total de ejecución: ${formatTime(result.totalExecutionTime)}`);
    
    console.log('\nResultados por feed:');
    result.feedResults.forEach(feed => {
      console.log(`\nCliente: ${feed.clientName}`);
      console.log(`  - Productos sincronizados: ${feed.productsSynced}`);
      console.log(`  - Embeddings generados: ${feed.embeddingsGenerated}`);
      console.log(`  - Tiempo de ejecución: ${formatTime(feed.executionTime)}`);
      if (feed.error) {
        console.log(`  - Error: ${feed.error}`);
      }
    });

    if (result.errors.length > 0) {
      console.log('\nErrores encontrados:');
      result.errors.forEach(error => console.log(`- ${error}`));
    }
  } catch (error) {
    console.error('Error en la ejecución principal:', error);
    process.exit(1);
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
