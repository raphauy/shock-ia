import { EcommerceProvider } from '@prisma/client'
import { config } from "dotenv"
import {
    createOrUpdateEcommerceFeed,
    generateProductEmbeddings,
    getClientProducts,
    getProductsGoogleFormat,
    syncProductsFromFeed
} from "./product-services"
config()

/**
 * Formatea el tiempo de ejecución para mostrar minutos cuando es necesario
 * @param seconds Tiempo en segundos
 * @returns Tiempo formateado como "X min Y seg" o "X.XX segundos"
 */
function formatExecutionTime(seconds: number): string {
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

async function main() {

    console.log("main init")

    // const accountId = 13
    // const inboxId = 47
    // const phoneNumber = "+59892265333"
    // const name = "El 333"

    // const contactId = await createContact(accountId, inboxId, phoneNumber, name)

    // console.log("contactId:", contactId)

    // const contactId = "11854"
    // const conversationId = await createChatwootConversation(accountId, String(inboxId), contactId)
    // console.log("conversationId:", conversationId)

    // const contactId = 12097
    // await deleteContactInChatwoot(accountId, contactId)

    // const text = "Hola, esto, es una prueba de audio en español muy importante"
    // const audioBase64 = await generateAudio(text)
    // console.log("audioBase64:", audioBase64)

    // const accountId= 16
    // const conversationId= 7
    // const response= await sendAudioToConversation(accountId, conversationId, audioBase64)
    // console.log("response:", response)

    // const objectWithFieldValues= {
    //     "origen": "Test 2",
    //     "Domicilio": "Calle 123"
    // }
    // const clientId= "clsnvcntc003okaqc2gfrme4b"
    // const contactId= "cm6gx7wf8001kkjbbto035kdf"
    // await createOrUpdateFieldValues(objectWithFieldValues, clientId, contactId, "main")

    // const minutesBefore= 1755
    // console.log("minutesBefore:", minutesBefore)
    // const formatted= formatMinutesBefore(minutesBefore)
    // console.log("formatted:", formatted)

    // const clientId= "clsnvcntc003okaqc2gfrme4b"
    // const isAvailable= await checkWorkingHoursNow(clientId)
    // console.log("isAvailable:", isAvailable)

    // const accountId= 16
    // const agents= await listAccountAgents(accountId)
    // console.log("agents:", agents)

    // const conversationId= 27
    // const agentId= 15
    // const response= await assignConversationToAgent(accountId, conversationId, agentId)
    // console.log("response:", response)

    // const clientId= "clsnvcntc003okaqc2gfrme4b"
    // const comercialId= await getNextComercialIdToAssign(clientId)
    // console.log("comercialId:", comercialId)

    const clientId = "clsnvcntc003okaqc2gfrme4b" // Usa un ID de cliente válido de tu base de datos

    try {
        // PASO 1: Sincronizar productos desde el feed
        console.log("\n--- PASO 1: SINCRONIZACIÓN DE PRODUCTOS ---")
        
        // Obtener productos del feed de Google
        const url = "https://mispetates.com/feeds/productos/mipeuy/google"
        const result = await getProductsGoogleFormat(url, 10)
        console.log("Productos obtenidos del feed:", result.products.length)
        console.log("Total de productos en el feed:", result.totalCount)

        // Crear o actualizar el feed para un cliente
        const feed = await createOrUpdateEcommerceFeed(
            clientId,
            "Mis Petates - Feed de prueba",
            url,
            EcommerceProvider.FENICIO
        )
        console.log("Feed creado/actualizado:", feed.id)

        // Sincronizar productos del feed
        const syncResult = await syncProductsFromFeed(feed.id, 10)
        console.log(`Sincronización completada:
- Total sincronizados: ${syncResult.totalSynced} productos
- Nuevos: ${syncResult.newProducts}
- Actualizados: ${syncResult.updatedProducts}
- Sin cambios: ${syncResult.unchangedProducts}
- Tiempo: ${formatExecutionTime(syncResult.executionTime)}
        `)

        
        // PASO 2: Generar embeddings para productos
        console.log("\n--- PASO 2: GENERACIÓN DE EMBEDDINGS ---")
        
        // Solo generamos embeddings para productos que lo necesitan (FALSE en lugar de TRUE)
        const updatedCount = await generateProductEmbeddings(clientId, false, 10)
        console.log(`Se generaron embeddings para ${updatedCount} productos`)
        
        
        // PASO 3: Probar búsqueda semántica
        console.log("\n--- PASO 3: PRUEBA DE BÚSQUEDA SEMÁNTICA ---")
        
        // Primero, veamos qué productos tenemos disponibles
        console.log("\nProductos disponibles:")
        const availableProducts = await getClientProducts(clientId, 10)
        availableProducts.forEach((product, i) => {
            console.log(`${i+1}. ${product.title}`)
        })
        
        
        
        // PASO 4: Prueba de respuestas a preguntas sobre productos
        console.log("\n--- PASO 4: RESPUESTAS A PREGUNTAS SOBRE PRODUCTOS ---")
        
        
    } catch (error) {
        console.error("Error:", error)
    }
}
  
//main()

