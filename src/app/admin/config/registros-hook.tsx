"use client"

import { FunctionClientDAO, SimpleFunction } from "@/services/function-services"
import { Loader } from "lucide-react"
import { useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { getFunctionsWithRepoAction } from "../functions/function-actions"
import SimpleCopyHook from "./simple-copy-hook"

interface Props {
    basePath: string
}

export default function RegistrosHook({ basePath }: Props) {

    const [clientId, setClientId]= useState("") 
    const [simpleFunctions, setSimpleFunctions]= useState<SimpleFunction[]>([])
    const [loading, setLoading]= useState(false)

    const searchParams= useSearchParams()
    useEffect(() => {
        setLoading(true)
        const clientId= searchParams.get("clientId") || ""
        setClientId(clientId)
        getFunctionsWithRepoAction(clientId)
        .then((data) => {
            if (!data) return
            setSimpleFunctions(data)
        })
        .catch((error) => {
            console.log(error)
        })
        .finally(() => {
            setLoading(false)
        })
        
    }, [searchParams])

    if (loading) return <div className="w-full p-4 mt-2 border rounded-lg flex justify-center"><Loader className="w-6 h-6 animate-spin" /></div> 

    if (!clientId) return null

    if (simpleFunctions.length === 0) return null

    return (
        <div className="w-full p-4 mt-2 border rounded-lg">
            <p className="text-2xl font-bold">Funciones con registros</p>
            {simpleFunctions.map((simpleFunction) => (
                <SimpleCopyHook 
                    key={simpleFunction.repoId}
                    name={simpleFunction.functionName} 
                    path={`${basePath}/api/registros/${simpleFunction.repoId}`} 
                />
            ))}

        </div>
    )
}
