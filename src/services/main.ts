import { prisma } from "@/lib/db"
import { getFunctionsDefinitions } from "./function-services"
import openaiTokenCounter from 'openai-gpt-token-counter'
import { sortData } from "./repodata-services"

async function main() {

    const repositoryId= "clz8hklnw000g5t3q3wc6e4bj"
    const data= {"correo":"pepe@gomez.com","operacion":"COMPRA","dormitorios":"2","nombreCompleto":"Pepe Gómez","preferenciaContacto":"llamada"}

    const sortedData= await sortData(repositoryId, data)
    console.log(sortedData)
    
}
  
//main()
  