import { getCarServiceEntry } from "@/services/carservice-services";
import { getNarvaezEntry } from "@/services/narvaez-services";
import { getSummitEntry } from "@/services/summit-services";
import { format } from "date-fns";
import { NextResponse } from "next/server";


export async function POST(request: Request, { params }: { params: { clientId: string } }) {

    try {
        const authorization = request.headers.get("authorization")
        if (!authorization) return NextResponse.json({ error: "authorization is required" }, { status: 400 })
        const apiToken= authorization.replace("Bearer ", "")
        if (!apiToken) return NextResponse.json({ error: "apiToken is required" }, { status: 400 })
        if (apiToken !== process.env.API_TOKEN) return NextResponse.json({ error: "Bad apiToken" }, { status: 400 })
        
        const clientId = params.clientId
        if (!clientId) return NextResponse.json({ error: "clientId not found" }, { status: 400 })

        const json= await request.json()
        const message= json.message
        console.log("json: ", json)
        console.log("message: ", message)

        const phone = message.phone
        if (!phone) {
            return NextResponse.json({ error: "phone is required" }, { status: 400 })
        }

        console.log("[Car Service API] phone: ", phone)

        const carServiceEntry = await getCarServiceEntry(clientId, phone)
        console.log("[Car Service API] carServiceEntry: ", carServiceEntry)

        if (!carServiceEntry) {
            return NextResponse.json({ data: "Car Service Entry not found" }, { status: 200 })
        }

        const data: CarServiceEntryResponse = {
            data: {
                phone,
                nombreReserva: carServiceEntry.nombreReserva,
                telefonoContacto: carServiceEntry.telefonoContacto,
                fechaReserva: carServiceEntry.fechaReserva,
                localReserva: carServiceEntry.localReserva,
                marcaAuto: carServiceEntry.marcaAuto,
                modeloAuto: carServiceEntry.modeloAuto,
                matriculaAuto: carServiceEntry.matriculaAuto,
                kilometraje: carServiceEntry.kilometraje,                
            }
        }

        return NextResponse.json( data, { status: 200 })

    } catch (error) {
        return NextResponse.json({ error: "error: " + error}, { status: 502 })        
    }
   
}


// model CarService {
//     id                  String       @id @default(cuid())
//     nombreReserva       String      @default("")           // gennext: show.column
//     telefonoContacto    String      @default("")           // gennext: show.column
//     fechaReserva        String      @default("")           // gennext: show.column
//     localReserva        String      @default("")           // gennext: show.column
//     marcaAuto           String      @default("")           // gennext: show.column
//     modeloAuto          String      @default("")           // gennext: show.column
//     matriculaAuto       String      @default("")           // gennext: show.column
//     kilometraje         String      @default("")           // gennext: show.column
  
//     createdAt           DateTime     @default(now())         // gennext: skip.zod
//     updatedAt           DateTime     @updatedAt              // gennext: skip.zod show.column
  
//     conversation        Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
//     conversationId     String @unique
  
//   }
type CarServiceEntryResponse = {
    data:{
        phone: string,
        nombreReserva: string,
        telefonoContacto: string,
        fechaReserva: string,
        localReserva: string,
        marcaAuto: string,
        modeloAuto: string,
        matriculaAuto: string,
        kilometraje: string,
    }
}