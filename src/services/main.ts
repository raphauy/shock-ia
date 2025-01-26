
import { config } from "dotenv"
import { createExternalPayment } from "./cobros-wap"
import { createContactInChatwoot, createChatwootConversation, getInboxId, deleteContactInChatwoot, sendAudioToConversation } from "./chatwoot"
import { generateAudio } from "./model-services"
config()

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

    const text = "Hola, esto, es una prueba de audio en español muy importante"
    const audioBase64 = await generateAudio(text)
    console.log("audioBase64:", audioBase64)

    const accountId= 16
    const conversationId= 7
    const response= await sendAudioToConversation(accountId, conversationId, audioBase64)
    console.log("response:", response)
}
  
//main()

