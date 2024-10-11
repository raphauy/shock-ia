import { addLabelToConversation, createAgentBotToClient, removeAgentBotFromClient, sendTextToConversation } from "./chatwoot"

import { config } from "dotenv"
config()

async function main() {

    console.log("Hello, world!")


    const number= "59892265737"
    const accountId= 1
    const conversationId= 27
    const tagName= "widget-web"

    //await addLabelToConversation(accountId, number, tagName)


    //await sendTextToConversation(accountId, conversationId, "Hola, ¿cómo estás?")

    const clientId= "clsnvcntc003okaqc2gfrme4b"
    const botId= "3"

    //await createAgentBotToClient(clientId)
    await removeAgentBotFromClient(botId)
}
  
//main()
