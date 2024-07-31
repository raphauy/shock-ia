"use client"

import { FunctionClientDAO, SimpleFunction } from "@/services/function-services"
import { Loader } from "lucide-react"
import { useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { getFunctionsIdsWithRepoAction } from "../functions/function-actions"
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
        getFunctionsIdsWithRepoAction(clientId)
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
                    key={simpleFunction.functionId}
                    name={simpleFunction.functionName} 
                    path={`${basePath}/api/${clientId}/registros/${simpleFunction.functionId}`} 
                />
            ))}

        </div>
    )
    // return (
    //     <div className="w-full p-4 mt-2 border rounded-lg">
    //         <p className="text-2xl font-bold">Documents</p>
    //         <SimpleCopyHook name="getDocuments" path={`${basePath}/api/${clientId}/documents`} />
    //         <SimpleCopyHook name="createDocuments" path={`${basePath}/api/${clientId}/documents/create`} />
    //         <SimpleCopyHook name="updateDocument" path={`${basePath}/api/${clientId}/documents/update`} />
    //         <SimpleCopyHook name="deleteDocument" path={`${basePath}/api/${clientId}/documents/delete`} />            
    //     </div>
    // )
}
