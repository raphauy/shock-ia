
import { config } from "dotenv"
import { createExternalPayment } from "./cobros-wap"
config()

async function main() {

    console.log("Hello, world!")


    const number= "59892265737"
    const accountId= 1
    const conversationId= 27
    const tagName= "widget-web"

    //await addLabelToConversation(accountId, number, tagName)


    //await sendTextToConversation(accountId, conversationId, "Hola, ¿cómo estás?")

    const unitPrice= 100
    const quantity= 1
    const currency= "UYU"
    const companyId= "e57728b3-ab30-44de-846c-cbad1e3933f3"
    const concept= "Pago de prueba"

    const amount= unitPrice * quantity

    const paymentLink= await createExternalPayment(amount, currency, companyId, concept)

    console.log(paymentLink)

}
  
//main()
