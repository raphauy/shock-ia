
import { config } from "dotenv"
import { createExternalPayment } from "./cobros-wap"
import { createContact, createChatwootConversation, getInboxId } from "./chatwoot"
config()

async function main() {

    console.log("main init")

    const accountId = 13
    const inboxId = 46
    const phoneNumber = "+59892265737"
    const name = "Tinta"

    const contactId = await createContact(accountId, inboxId, phoneNumber, name)

    console.log("contactId:", contactId)

    // const contactId = "11854"
    // const conversationId = await createChatwootConversation(accountId, String(inboxId), contactId)
    // console.log("conversationId:", conversationId)

}
  
main()

