import { getCurrentTimeInMontevideo } from "@/lib/utils";
import { checkAbandonedOrders, processPendingAbandonedOrders } from "./abandoned-orders-service";
import { getClientsWithAbandonedOrders } from "./clientService";

/**
 * Función principal para ejecutar el updater como script
 */
async function main() {
    console.log('Iniciando ejecución del Abandoned Orders Updater...');

    // Mostrar información de la zona horaria
    const currentTime = getCurrentTimeInMontevideo();
    console.log(`Hora actual: ${currentTime.formatted} (Montevideo)`);

    try {
        const clientsToProcess = await getClientsWithAbandonedOrders();
        console.log(`Se encontraron ${clientsToProcess.length} clientes con órdenes abandonadas`);
        
        for (const client of clientsToProcess) {
            console.log(`Procesando cliente: ${client.name}`);
            try {
                const res = await checkAbandonedOrders(client.id);
                if (res.error) {
                    console.error(`Error al procesar cliente ${client.name}: ${res.mensaje}`);
                }
            } catch (error) {
                console.error(`Error al procesar cliente ${client.name}: ${error}`);
            }
        }
        console.log('Proceso de órdenes abandonadas completado exitosamente');
    } catch (error) {
        console.error('Error en la ejecución principal:', error);
        process.exit(1);
    }

    try {
        console.log('Procesando órdenes pendientes...');
        await processPendingAbandonedOrders();
        console.log('Proceso de órdenes pendientes completado exitosamente');
    } catch (error) {
        console.error('Error en la ejecución principal:', error);
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
  