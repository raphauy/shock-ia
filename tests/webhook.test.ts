import { sendWhatsappDisconnectNotification } from '@/services/notifications-service';
import { getWebhookStatus, setWebhook } from '@/services/wrc-sdk';
import { config } from "dotenv";
config();

/**
 * Test para las funciones setWebhook y getWebhookStatus de wrc-sdk.ts
 * Este test permite activar, verificar o desactivar el webhook para una instancia de WhatsApp
 * asociada a un cliente específico
 */
async function main() {
    console.log("Iniciando prueba de webhook");

    const clientId = "clsnvcntc003okaqc2gfrme4b"; // ID del cliente proporcionado
//    const instanceName = "dev-cantinabarreiro"; // ID del cliente proporcionado
    const instanceName = "demo-traveloz"; // ID del cliente proporcionado
    
    try {
        // Verificar estado actual del webhook
        // console.log(`Verificando estado actual del webhook para el cliente: ${instanceName}`);
        // const estadoActual = await getWebhookStatus(instanceName);
        // console.log(`Estado actual del webhook:`);
        // console.log(`- Habilitado: ${estadoActual.enabled}`);
        // console.log(`- URL: ${estadoActual.url}`);
        // console.log(`- Eventos: ${estadoActual.events.join(', ')}`);

        await sendWhatsappDisconnectNotification(clientId, "close")
        
        // // Activar el webhook
        // console.log(`\nActivando webhook para el cliente: ${instanceName}`);
        // const resultadoActivar = await setWebhook(clientId, true);
        // console.log(`Resultado de activación: ${resultadoActivar ? "Éxito" : "Fallo"}`);
        
        // // Verificar después de activar
        // console.log(`\nVerificando estado después de activar:`);
        // const estadoDespuesActivar = await getWebhookStatus(instanceName);
        // console.log(`- Habilitado: ${estadoDespuesActivar.enabled}`);
        // console.log(`- URL: ${estadoDespuesActivar.url}`);
        // console.log(`- Eventos: ${estadoDespuesActivar.events.join(', ')}`);
        
        // // Esperar 2 segundos
        // await new Promise(resolve => setTimeout(resolve, 2000));
        
        // // Desactivar el webhook (opcional, comentar si solo se desea activar)
        // console.log(`\nDesactivando webhook para el cliente: ${instanceName}`);
        // const resultadoDesactivar = await setWebhook(clientId, false);
        // console.log(`Resultado de desactivación: ${resultadoDesactivar ? "Éxito" : "Fallo"}`);
        
        // // Verificar después de desactivar
        // console.log(`\nVerificando estado después de desactivar:`);
        // const estadoDespuesDesactivar = await getWebhookStatus(instanceName);
        // console.log(`- Habilitado: ${estadoDespuesDesactivar.enabled}`);
        // console.log(`- URL: ${estadoDespuesDesactivar.url}`);
        // console.log(`- Eventos: ${estadoDespuesDesactivar.events.join(', ')}`);
    } catch (error) {
        console.error("Error durante la prueba de webhook:", error);
    }
}

// Ejecutar el test
main(); 