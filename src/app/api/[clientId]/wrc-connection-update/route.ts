import { getClient } from "@/services/clientService";
import { sendWhatsappDisconnectNotification } from "@/services/notifications-service";
import { connectionState } from "@/services/wrc-sdk";
import { NextResponse } from "next/server";


export const maxDuration = 800

type Props= {
    params: Promise<{
        clientId: string
    }>
}

export async function POST(request: Request, props: Props) {
    const params = await props.params;

    try {
        const clientId = params.clientId
        if (!clientId) return NextResponse.json({ error: "clientId not found, probably wrong url" }, { status: 400 })
        
        const client= await getClient(clientId)
        if (!client) return NextResponse.json({ error: "client not found" }, { status: 400 })

        console.log("client: ", client.name)    

        const json= await request.json()
        console.log("json: ", json)

        const instanceName= json.instance
        console.log("instanceName: ", instanceName)
        
        const state= json.data.state
        const dateTimeStr= json.date_time
        const dateTimeInMontevideo: Date = new Date(dateTimeStr)


        const event= json.event
        console.log("event: ", event)
        if (event === "connection.update") {
            await processConnectionUpdate(clientId, instanceName, state)
            return NextResponse.json({ data: "ACK" }, { status: 200 })
        }

        return NextResponse.json({ data: "ACK" }, { status: 200 })
    
    } catch (error) {
        console.log("error: ", error)
        return NextResponse.json({ error: "error: " + error}, { status: 502 })                
    }
}

export async function GET(request: Request) {

    const res= "API is working"


    return NextResponse.json( { "data": res }, { status: 200 })

}


async function processConnectionUpdate(clientId: string, instanceName: string, state: string) {
    console.log("processing connection update")

    console.log("clientId: ", clientId)
    console.log(instanceName + ": " + state)
    
    // Verificar si la instancia está desconectada
    if (state === "close") {
        console.log(`La instancia ${instanceName} se ha desconectado. Verificando reconexión...`)
        
        const SLEEP_TIME = 10; // segundos
        
        try {
            // Primera verificación realizada, ahora esperamos
            console.log(`Esperando ${SLEEP_TIME} segundos antes de verificar nuevamente...`)
            await new Promise(resolve => setTimeout(resolve, SLEEP_TIME * 1000));
            
            // Verificamos nuevamente después de esperar
            const estadoConexion = await connectionState(instanceName);
            
            if (estadoConexion.state === "open") {
                console.log(`La instancia ${instanceName} se ha reconectado después de ${SLEEP_TIME} segundos.`);
                return;
            } else {
                console.log(`La instancia ${instanceName} sigue desconectada después de ${SLEEP_TIME} segundos. Status: ${estadoConexion.state}`);
                console.log(`¡ALERTA! La instancia ${instanceName} sigue desconectada. Enviando notificación...`);
                await sendWhatsappDisconnectNotification(clientId);
            }
        } catch (error) {
            console.error(`Error verificando estado de conexión para ${instanceName}:`, error);
        }
    }
}
