import { addLabelToConversation } from "./chatwoot"

import { config } from "dotenv"
config()

async function main() {

    console.log("Hello, world!")


    const number= "59892265737"
    const accountId= 1
    const tagName= "ventas"

    await addLabelToConversation(accountId, number, tagName)

}
  
main()
