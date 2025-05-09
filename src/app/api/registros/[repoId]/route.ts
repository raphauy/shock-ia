import { getCarServiceEntry } from "@/services/carservice-services";
import { getNarvaezEntry } from "@/services/narvaez-services";
import { getRepoDataDAOByPhone } from "@/services/repodata-services";
import { getSummitEntry } from "@/services/summit-services";
import { JsonValue } from "@prisma/client/runtime/library";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { es } from "date-fns/locale";
import { NextResponse } from "next/server";

type Props= {
    params: Promise<{
        repoId: string
    }>
}

export async function POST(request: Request, props: Props) {
    const params = await props.params;

    try {
        const authorization = request.headers.get("authorization")
        if (!authorization) return NextResponse.json({ error: "authorization is required" }, { status: 400 })
        const apiToken= authorization.replace("Bearer ", "")
        if (!apiToken) return NextResponse.json({ error: "apiToken is required" }, { status: 400 })
        if (apiToken !== process.env.API_TOKEN) return NextResponse.json({ error: "Bad apiToken" }, { status: 400 })
        
        const repoId = params.repoId
        if (!repoId) return NextResponse.json({ error: "registro id not found" }, { status: 400 })

        const json= await request.json()
        const message= json.message
        console.log("json: ", json)
        console.log("message: ", message)

        const phone = message.phone
        if (!phone) {
            return NextResponse.json({ error: "phone is required" }, { status: 400 })
        }

        console.log("Id: ", repoId)        
        console.log("[Registros Data API] phone: ", phone)

        const repoDataEntry = await getRepoDataDAOByPhone(repoId, phone)
        console.log("[Registros Data API] Entry: ", repoDataEntry)
        if (!repoDataEntry) {
            return NextResponse.json({ data: "Repo Data Entry not found" }, { status: 200 })
        }

        const timeZone = "America/Montevideo"
        const date = format(toZonedTime(repoDataEntry.createdAt, timeZone), "yyyy-MM-dd HH:mm", { locale: es })

        let data: any= {
            phone,
            functionName: repoDataEntry.functionName,
            clientName: repoDataEntry.client.name,
            date,
        }
        const dataMapped= JSON.parse(repoDataEntry.data)
        for (const key in dataMapped) {
            data[key]= dataMapped[key]
        }


        return NextResponse.json( { data }, { status: 200 })

    } catch (error) {
        return NextResponse.json({ error: "error: " + error}, { status: 502 })        
    }
}

