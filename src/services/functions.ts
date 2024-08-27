import { decodeAndCorrectText } from "@/lib/utils";
import { getValue, setValue } from "./config-services";
import { getDocumentDAO } from "./document-services";
import { NarvaezFormValues, createOrUpdateNarvaez } from "./narvaez-services";
import { sendWapMessage } from "./osomService";
import { getSectionOfDocument } from "./section-services";
import { SummitFormValues, createSummit } from "./summit-services";
import { getConversation, messageArrived } from "./conversationService";
import { CarServiceFormValues, createCarService } from "./carservice-services";
import { revalidatePath } from "next/cache";
import { getRepositoryDAOByFunctionName } from "./repository-services";
import { createRepoData, repoDataFormValues } from "./repodata-services";
import { getFunctionClientDAO } from "./function-services";
import { sendWebhookNotification } from "./webhook-notifications-service";

export type CompletionInitResponse = {
  assistantResponse: string | null
  promptTokens: number
  completionTokens: number
  agentes: boolean  
}


export async function notifyHuman(clientId: string){
  console.log("notifyHuman")
  return "dile al usuario que un agente se va a comunicar con él, saluda y finaliza la conversación. No ofrezcas más ayuda, saluda y listo."
}

export type SectionResult = {
  docId: string;
  docName: string;
  secuence: string;
  content: string | null;
};

export async function getSection(docId: string, secuence: string): Promise<SectionResult | string> {
  const section= await getSectionOfDocument(docId, parseInt(secuence))
  if (!section) return "Section not found"
  console.log(`\tgetSection: doc: ${section.document.name}, secuence: ${secuence}`)

  return {
    docId: section.documentId,
    docName: section.document.name,
    secuence: secuence,
    content: section.text ?? null,
  }
}

export type DocumentResult = {
  docId: string;
  docName: string;
  docURL: string | null;
  description: string | null;
  content: string | null;
};

export async function getDocument(id: string): Promise<DocumentResult | string> {
  const document= await getDocumentDAO(id)
  if (!document) return "Document not found"
  console.log(`\tgetDocument: doc: ${document.name}`)

  return {
    docId: document.id,
    docName: document.name,
    docURL: document.url ?? null,
    description: document.description ?? null,
    content: document.textContent ?? null,
  }
}

export async function getDateOfNow(){
  // return the current date and time in Montevideo time zone
  const res= new Date().toLocaleString("es-UY", {timeZone: "America/Montevideo"})
  console.log("getDateOfNow: " + res)
  return res
}

export async function registrarPedido(clientId: string, 
  conversationId: string, 
  clasificacion: string, 
  consulta: string, 
  nombre: string, 
  email: string | undefined, 
  horarioContacto: string | undefined, 
  idTrackeo: string | undefined, 
  urlPropiedad: string | undefined, 
  consultaAdicional: string | undefined, 
  resumenConversacion: string
  )
{

  console.log("registrarPedido")
  console.log(`\tclasificacion: ${clasificacion}`)
  console.log(`\tconsulta: ${consulta}`)
  console.log(`\tnombre: ${nombre}`)
  console.log(`\temail: ${email}`)
  console.log(`\thorarioContacto: ${horarioContacto}`)
  console.log(`\tidTrackeo: ${idTrackeo}`)
  console.log(`\turlPropiedad: ${urlPropiedad}`)
  console.log(`\tconsultaAdicional: ${consultaAdicional}`)
  console.log(`\tresumenConversacion: ${resumenConversacion}`)  

  const data: NarvaezFormValues = {
    conversationId,
    clasificacion,
    consulta,
    nombre,
    email,
    horarioContacto,
    idTrackeo,
    urlPropiedad,
    consultaAdicional,
    resumenPedido: resumenConversacion,
  }

  let created= null

  try {
    created= await createOrUpdateNarvaez(data)    
  } catch (error) {
    return "Error al registrar el pedido, pregunta al usuario si quiere que tu reintentes"
  }
  if (!created) return "Error al registrar el pedido, pregunta al usuario si quiere que tu reintentes"

  const conversation= await getConversation(conversationId)
  if (!conversation) return "Error al obtener la conversación"

  const text= `Función registrarPedido invocada.`
  const messageStored= await messageArrived(conversation?.phone, text, clientId, "function", "", 0, 0)
  if (messageStored) console.log("function message stored")

  const slug= conversation.client.slug
  const key= `${slug.toUpperCase()}_Registro_Respuesta`
  let Registro_Respuesta= await getValue(key)
  if (!Registro_Respuesta) {
    console.log(`${key} not found`)    
    Registro_Respuesta= "Pedido registrado, dile esto al usuario hablándole por su nombre lo siguiente: 'con la información que me pasaste un asesor te contactará a la brevedad'"
    await setValue(key, Registro_Respuesta)
  }
  console.log("Registro_Respuesta: ", Registro_Respuesta)      

  return Registro_Respuesta
}

// nombreReserva: string | undefined
// nombreCumpleanero: string | undefined
// fechaReserva: Date | undefined
// email: string | undefined
// resumenConversacion: string | undefined

export async function reservarSummit(clientId: string, conversationId: string, nombreReserva: string | undefined, nombreCumpleanero: string | undefined, cantidadInvitados: number | undefined, fechaReserva: string | undefined, email: string | undefined, resumenConversacion: string | undefined){
  console.log("reservarSummit")
  console.log(`\tconversationId: ${conversationId}`)
  console.log(`\tnombreReserva: ${nombreReserva}`)
  console.log(`\tnombreCumpleanero: ${nombreCumpleanero}`)
  console.log(`\tcantidadInvitados: ${cantidadInvitados}`)
  console.log(`\tfechaReserva: ${fechaReserva}`)
  console.log(`\temail: ${email}`)
  console.log(`\tresumenConversacion: ${resumenConversacion}`)

  const data: SummitFormValues = {
    conversationId,
    nombreReserva,
    nombreCumpleanero,
    cantidadInvitados,
    fechaReserva,
    email,
    resumenConversacion,
  }

  let created= null

  try {
    created= await createSummit(data)    
  } catch (error) {
    return "Error al reservar, pregunta al usuario si quiere que tu reintentes"
  }

  if (!created) return "Error al reservar, pregunta al usuario si quiere que tu reintentes"

  let SUMMIT_Respuesta= await getValue("SUMMIT_Respuesta")
  if (!SUMMIT_Respuesta) {
    console.log("SUMMIT_Respuesta not found")    
    SUMMIT_Respuesta= "Reserva realizada, dile esto al usuario lo siguiente: 'con la información que me pasaste un asesor te contactará a la brevedad'"
  }
  console.log("SUMMIT_Respuesta: ", SUMMIT_Respuesta)      

  let SUMMIT_Celulares= await getValue("SUMMIT_Celulares")
  if (!SUMMIT_Celulares) {
    console.log("SUMMIT_Celulares not found")    
  } else {
    console.log("SUMMIT_Celulares: ", SUMMIT_Celulares)      
    const celulares= SUMMIT_Celulares.split(",")
    for (const phone of celulares) {
      console.log("enviar mensaje a: ", phone)
      if (resumenConversacion) {
        const textoMensaje= getTextoMensajeSummit(data)
        console.log("textoMensaje:")
        console.log(textoMensaje)
        
        await sendWapMessage(phone, textoMensaje, false, clientId)
      } else console.log("resumenConversacion not found")
    }
  }

  return SUMMIT_Respuesta
}

function getTextoMensajeSummit(data: SummitFormValues): string {
  const textoMensaje= `Nombre: ${data.nombreReserva}
Cumpleañero: ${data.nombreCumpleanero}
Cantidad de invitados: ${data.cantidadInvitados}
Fecha de la reserva: ${data.fechaReserva}
Email: ${data.email}
Resumen: ${data.resumenConversacion}
`
  return textoMensaje
}

export async function echoRegister(clientId: string, conversationId: string, text: string | undefined){
  console.log("echoRegister")
  console.log(`\tconversationId: ${conversationId}`)
  console.log(`\ttexto: ${text}`)

  if (text) {
    const data: SummitFormValues = {
      conversationId,
      resumenConversacion: text,
    }
    let created= null

    try {
      created= await createSummit(data)    
      return "Echo registrado. Dile al usuario que su texto ya está registrado en el sistema"
    } catch (error) {
      return "Error al registrar, pregunta al usuario si quiere que tu reintentes"
    }
  
  } else console.log("text not found")

  return "Mensaje enviado"

}

export async function completarFrase(clientId: string, conversationId: string, texto: string | undefined){
  console.log("completarFrase")
  console.log(`\tconversationId: ${conversationId}`)
  console.log(`\ttexto: ${texto}`)

  if (texto) {
    const data: SummitFormValues = {
      conversationId,
      resumenConversacion: texto,
    }
    let created= null

    try {
      created= await createSummit(data)    
      return "Frase completada"
    } catch (error) {
      return "Error al completar la frase, pregunta al usuario si quiere que tu reintentes"
    }
  
  } else console.log("texto not found")

  return "Mensaje enviado"

}

export async function reservarServicio(clientId: string, conversationId: string, nombreReserva: string | undefined, telefonoContacto: string | undefined, fechaReserva: string | undefined, localReserva: string | undefined, marcaAuto: string | undefined, modeloAuto: string | undefined, matriculaAuto: string | undefined, kilometraje: string | undefined){
  console.log("reservarServicio")
  console.log(`\tconversationId: ${conversationId}`)
  console.log(`\tnombreReserva: ${nombreReserva}`)
  console.log(`\ttelefonoContacto: ${telefonoContacto}`)
  console.log(`\tfechaReserva: ${fechaReserva}`)
  console.log(`\tlocalReserva: ${localReserva}`)
  console.log(`\tmarcaAuto: ${marcaAuto}`)
  console.log(`\tmodeloAuto: ${modeloAuto}`)
  console.log(`\tmatriculaAuto: ${matriculaAuto}`)
  console.log(`\tkilometraje: ${kilometraje}`)

  if (!nombreReserva) return "nombreReserva not found"
  if (!telefonoContacto) return "telefonoContacto not found"
  if (!fechaReserva) return "fechaReserva not found"
  if (!localReserva) return "localReserva not found"
  if (!marcaAuto) return "marcaAuto not found"
  if (!modeloAuto) return "modeloAuto not found"
  if (!matriculaAuto) return "matriculaAuto not found"
  if (!kilometraje) return "kilometraje not found"

  const data: CarServiceFormValues = {
    conversationId,
    nombreReserva,
    telefonoContacto,
    fechaReserva,
    localReserva,
    marcaAuto,
    modeloAuto,
    matriculaAuto,
    kilometraje,
  }

  const created= await createCarService(data)
  if (!created) return "Error al reservar, pregunta al usuario si quiere que tu reintentes"

  revalidatePath("/client/[slug]/car-service", "page")

  return "Reserva registrada. Dile exactamente esto al usuario: Gracias por agendar tu service, a la brevedad un asesor te confirmará la fecha del service."
}


export async function defaultFunction(clientId: string, name: string, args: any) {
  console.log("defaultFunction")
  console.log("clientId: ", clientId)
  console.log("name: ", name)
  console.log("args: ", args)

  try {
    const repo= await getRepositoryDAOByFunctionName(name)
    if (!repo)
      return "Hubo un error al procesar esta solicitud"
  
    const { conversationId, ...data } = args

    if (!conversationId)
      return "conversationId es obligatorio"

    const conversation= await getConversation(conversationId)
    if (!conversation)
      return `No se encontró la conversación con id ${conversationId}`
  
    const phone= conversation.phone
  
    const repoData: repoDataFormValues= {
      clientId,
      phone,
      functionName: repo.functionName,
      repoName: repo.name,
      repositoryId: repo.id,
      data,
      conversationId
    }
  
    const created= await createRepoData(repoData)
    if (!created || !created.repositoryId)
      return "Hubo un error al procesar esta solicitud"
  
    revalidatePath(`/client/${conversation.client.slug}/registros`)

    const functionClient= await getFunctionClientDAO(repo.functionId, conversation.client.id)
    if (functionClient && functionClient.webHookUrl) {
      try {
        await sendWebhookNotification(functionClient.webHookUrl, created)
      } catch (error) {
        console.log("Error al enviar notificación a webhook")
      }
    }
    if (repo.conversationLLMOff) {
      console.log(`simulating setting conversationLLMOff to true for phone ${conversation.phone}`)
      // TODO: set LLMOff
      // await setLLMOff(conversation.id, true)
    }
  
    return repo.finalMessage    
  } catch (error) {
    console.log(error)
    return "Hubo un error al procesar esta solicitud"        
  }

}

export async function processFunctionCall(clientId: string, name: string, args: any) {
  console.log("function_call: ", name, args)

  let content= null

  switch (name) {
    case "getDateOfNow":
      content = await getDateOfNow()
      break

    case "notifyHuman":
      content = await notifyHuman(clientId)
      break

    case "getDocument":
      content= await getDocument(args.docId)
      break

    case "getSection":
      content= await getSection(args.docId, args.secuence)
      break
    case "registrarPedido":
      content= await registrarPedido(clientId, 
        args.conversationId, 
        args.clasificacion, 
        decodeAndCorrectText(args.consulta),
        decodeAndCorrectText(args.nombre),
        args.email, 
        decodeAndCorrectText(args.horarioContacto),
        args.idTrackeo, 
        args.urlPropiedad, 
        decodeAndCorrectText(args.consultaAdicional),
        decodeAndCorrectText(args.resumenConversacion),
      )
      break
    case "reservarSummit":
      content= await reservarSummit(clientId,
        args.conversationId,
        decodeAndCorrectText(args.nombreReserva),
        decodeAndCorrectText(args.nombreCumpleanero),
        parseInt(args.cantidadInvitados),
        decodeAndCorrectText(args.fechaReserva),
        decodeAndCorrectText(args.email),
        decodeAndCorrectText(args.resumenConversacion),
      )
      break
    case "echoRegister":
      content= echoRegister(clientId, 
        args.conversationId, 
        decodeAndCorrectText(args.text)
      )
      break
    case "completarFrase":
      content= completarFrase(clientId, 
        args.conversationId, 
        decodeAndCorrectText(args.texto)        
      )
      break
    case "reservarServicio":
      content= await reservarServicio(clientId,
        args.conversationId,
        args.nombreReserva,
        args.telefonoContacto,
        args.fechaReserva,
        args.localReserva,
        args.marcaAuto,
        args.modeloAuto,
        args.matriculaAuto,
        args.kilometraje
      )
      break
  
    default:
      content= await defaultFunction(clientId, name, args)
      break
        
  }

  if (content !== null) {      
    return JSON.stringify(content)
  } else {
    return "function call not found"
  }
}

export function getAgentes(name: string): boolean {
let res= false
switch (name) {
  case "notifyHuman":
    res= true
    break
  case "registrarPedido":
    res= true
    break
  case "reservarSummit":
    res= true
    break
  case "reservarServicio":
    res= true
    break
  case "registrarLeadInmobiliario":
    res= true
    break
  case "registrarLeadsDeRegalosEmpresariales":
    res= true
    break
  case "registrarLeadsAcademia":
    res= true
    break
  case "registrarLeadsInteresadosAccessOne":
    res= true
    break
      
  default:
    break
}
return res
}

