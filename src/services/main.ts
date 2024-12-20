
import { config } from "dotenv"
import { createExternalPayment } from "./cobros-wap"
import { createContact, createChatwootConversation, getInboxId, deleteContactInChatwoot } from "./chatwoot"
config()

async function main() {

    console.log("main init")

    const accountId = 13
    // const inboxId = 47
    // const phoneNumber = "+59892265333"
    // const name = "El 333"

    // const contactId = await createContact(accountId, inboxId, phoneNumber, name)

    // console.log("contactId:", contactId)

    // const contactId = "11854"
    // const conversationId = await createChatwootConversation(accountId, String(inboxId), contactId)
    // console.log("conversationId:", conversationId)

    const contactId = 12097
    await deleteContactInChatwoot(accountId, contactId)
}
  
//main()

