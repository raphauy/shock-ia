import { getClient } from "@/services/clientService";
import { sendWhatsappDisconnectNotification } from "@/services/notifications-service";
import { connectionState } from "@/services/wrc-sdk";
import { NextResponse } from "next/server";


export const maxDuration = 299

type Props= {
    params: {
        clientId: string
    }
}

export async function POST(request: Request, { params }: Props) {

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

export async function GET(request: Request, { params }: { params: { clientId: string } }) {

    const res= "API is working"


    return NextResponse.json( { "data": res }, { status: 200 })

}


async function processConnectionUpdate(clientId: string, instanceName: string, state: string) {
    console.log("processing connection update")

    console.log("clientId: ", clientId)
    console.log("instanceName: ", instanceName)
    console.log("state: ", state)
    
    // Verificar si la instancia está desconectada
    if (state !== "open") {
        console.log(`La instancia ${instanceName} se ha desconectado. Verificando reconexión...`)
        
        const LOOPS_LIMIT = state === "close" ? 6 : 3;
        const LOOP_TIME = 10; // segundos
        let contador = 0;
        
        const intervalo = setInterval(async () => {
            contador++;
            
            try {
                const estadoConexion = await connectionState(instanceName);
                
                if (estadoConexion.state === "open") {
                    clearInterval(intervalo);
                    console.log(`La instancia ${instanceName} se ha reconectado después de ${contador * LOOP_TIME} segundos.`);
                    return;
                } else {
                    console.log(`La instancia ${instanceName} sigue desconectada después de ${contador * LOOP_TIME} segundos. Status: ${estadoConexion.state}`);
                }
                
                if (contador >= LOOPS_LIMIT) {
                    clearInterval(intervalo);
                    console.log(`¡ALERTA! La instancia ${instanceName} sigue desconectada después de ${LOOPS_LIMIT * LOOP_TIME} segundos.`);
                    await sendWhatsappDisconnectNotification(clientId, state)
                }
                
            } catch (error) {
                console.error(`Error verificando estado de conexión para ${instanceName}:`, error);
                clearInterval(intervalo);
            }
            
        }, LOOP_TIME * 1000); // Verificar cada 10 segundos
    }
}
