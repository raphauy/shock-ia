import { prisma } from "@/lib/db"
import { getFunctionsDefinitions } from "./function-services"
import openaiTokenCounter from 'openai-gpt-token-counter'

async function main() {

    const text = "Hola, buenos días!"
    const model = "gpt-4"

    let tokenCount = openaiTokenCounter.text(text, model)
    console.log(`Token count: ${tokenCount}`)

    const messages = [
        { role: "system", content: "Usted es un asistente virtual muy entusiasta" },
        { role: "user", content: "Hola, buenos días!" },
        { role: "assistant", content: "¡Buenos días! ¿En qué puedo asistirte hoy con mi entusiasmo y energía? 😄" },
    ]

    tokenCount = openaiTokenCounter.chat(messages, model)
    console.log(`Message token count: ${tokenCount}`)

}
  
main()
  