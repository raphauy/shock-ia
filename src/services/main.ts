
import { config } from "dotenv"
import { createExternalPayment } from "./cobros-wap"
import { createContactInChatwoot, createChatwootConversation, getInboxId, deleteContactInChatwoot, sendAudioToConversation, listAccountAgents, assignConversationToAgent } from "./chatwoot"
import { generateAudio } from "./model-services"
import { createOrUpdateFieldValues } from "./fieldvalue-services"
import { formatMinutesBefore } from "@/lib/utils"
import { checkWorkingHoursNow } from "./clientService"
import { getNextComercialIdToAssign } from "./comercial-services"
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

    const clientId= "clsnvcntc003okaqc2gfrme4b"
    const comercialId= await getNextComercialIdToAssign(clientId)
    console.log("comercialId:", comercialId)
}
  
main()

