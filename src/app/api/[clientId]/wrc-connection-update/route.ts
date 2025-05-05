import { getClient } from "@/services/clientService";
import { MessageDelayResponse, onMessageReceived, processDelayedMessage } from "@/services/messageDelayService";
import { log } from "console";
import { format } from "date-fns";
import { NextResponse } from "next/server";
import { connectionState } from "@/services/wrc-sdk";
import { sendWhatsappDisconnectNotification } from "@/services/notifications-service";


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
            processConnectionUpdate(clientId, instanceName, state, dateTimeInMontevideo)
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


function processConnectionUpdate(clientId: string, instanceName: string, state: string, dateTime: Date) {
    console.log("processing connection update")

    console.log("clientId: ", clientId)
    console.log("instanceName: ", instanceName)
    console.log("state: ", state)
    const formattedDate= format(dateTime, "yyyy-MM-dd HH:mm:ss")
    console.log("dateTime: ", formattedDate)
    
    // Verificar si la instancia está desconectada
    if (state !== "open") {
        console.log(`La instancia ${instanceName} se ha desconectado. Verificando reconexión...`)
        
        const LOOPS_LIMIT = 3; // segundos
        const LOOP_TIME = 10; // segundos
        let contador = 0;
        
        const intervalo = setInterval(async () => {
            contador++;
            
            try {
                const estadoConexion = await connectionState(instanceName);
                
                if (estadoConexion.state === "open") {
                    clearInterval(intervalo);
                    console.log(`La instancia ${instanceName} se ha reconectado después de ${contador} segundos.`);
                    return;
                } else {
                    console.log(`La instancia ${instanceName} sigue desconectada después de ${contador * LOOP_TIME} segundos. Status: ${estadoConexion.state}`);
                }
                
                if (contador >= LOOPS_LIMIT) {
                    clearInterval(intervalo);
                    console.log(`¡ALERTA! La instancia ${instanceName} sigue desconectada después de ${LOOPS_LIMIT * LOOP_TIME} segundos.`);
                    await sendWhatsappDisconnectNotification(clientId)
                }
                
            } catch (error) {
                console.error(`Error verificando estado de conexión para ${instanceName}:`, error);
                clearInterval(intervalo);
            }
            
        }, LOOP_TIME * 1000); // Verificar cada 10 segundos
    }
}

// ejemplo 1:
// json:  {                                                                                                                                    
//   event: 'connection.update',                                                                                                               
//   instance: 'dev-cantinabarreiro',                                                                                                          
//   data: {                                                                                                                                   
//     instance: 'dev-cantinabarreiro',                                                                                                        
//     state: 'connecting',                                                                                                                    
//     statusReason: 200                                                                                                                       
//   },                                                                                                                                        
//   destination: 'https://local.rctracker.dev/api/clsnvcntc003okaqc2gfrme4b/wrc-connection-update',                                           
//   date_time: '2025-05-05T03:55:22.229Z',                                                                                                    
//   sender: '59898353507@s.whatsapp.net',                                                                                                     
//   server_url: 'https://wrc.raphauy.dev',                                                                                                    
// }

// ejemplo 2:
// json:  {
//   event: 'connection.update',
//   instance: 'dev-cantinabarreiro',
//   data: {
//     instance: 'dev-cantinabarreiro',
//     wuid: '59898353507@s.whatsapp.net',
//     profilePictureUrl: 'https://pps.whatsapp.net/v/t61.24694-24/321265217_5780002138795077_789561094804400244_n.jpg?ccb=11-4&oh=01_Q5Aa1QHiO
// hmpUPLTUQiab2usBApmjds505boePU5BPTN46Jwqw&oe=682562DD&_nc_sid=5e03e0&_nc_cat=111',
//     state: 'open',
//     statusReason: 200
//   },
//   destination: 'https://local.rctracker.dev/api/clsnvcntc003okaqc2gfrme4b/wrc-connection-update',
//   date_time: '2025-05-05T03:55:24.451Z',
//   sender: '59898353507@s.whatsapp.net',
//   server_url: 'https://wrc.raphauy.dev',
// }