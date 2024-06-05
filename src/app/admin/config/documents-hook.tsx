"use client"

import { useEffect, useState } from "react"
import SimpleCopyHook from "./simple-copy-hook"
import { useSearchParams } from "next/navigation"

interface Props {
    basePath: string
}

export default function DocumentsHook({ basePath }: Props) {

    const [clientId, setClientId]= useState("") 

    const searchParams= useSearchParams()
    useEffect(() => {
        const clientId= searchParams.get("clientId") || ""
        setClientId(clientId)
        
    }, [searchParams])

    if (!clientId) return null

    return (
        <div className="w-full p-4 mt-2 border rounded-lg">
            <p className="text-2xl font-bold">Documents</p>
            <SimpleCopyHook name="getDocuments" path={`${basePath}/api/${clientId}/documents`} />
            <SimpleCopyHook name="createDocuments" path={`${basePath}/api/${clientId}/documents/create`} />
            <SimpleCopyHook name="updateDocument" path={`${basePath}/api/${clientId}/documents/update`} />
            <SimpleCopyHook name="deleteDocument" path={`${basePath}/api/${clientId}/documents/delete`} />            
        </div>
    )
}
