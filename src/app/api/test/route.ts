import { NextResponse } from "next/server";


export async function POST(request: Request) {

    const json= await request.json()
    console.log("json: ", json)

//    await new Promise(resolve => setTimeout(resolve, 12000));

//    return NextResponse.json( { "error": "Ocurrió un error" }, { status: 400 })
    return NextResponse.json( { "received": json }, { status: 200 })

}

export async function GET(request: Request) {

    const res= "API is working"


    return NextResponse.json( { "data": res }, { status: 200 })

}

