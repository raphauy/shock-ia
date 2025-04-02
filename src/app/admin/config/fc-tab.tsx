import { useState } from "react"
import { DataClient } from "../clients/(crud)/actions"
import { RepoSelector, SelectorData } from "./repo-selector"
import FCConfig from "../repositories/[repoId]/fc-config"
import { getReposOfClient } from "@/services/repository-services"
import { CreateFCDialog } from "./create-fc-dialog"

type Props = {
    client: DataClient
    searchParams: {
        fcId: string
    }
}

export default async function FCTab({ client, searchParams }: Props) {

    const repoId= searchParams.fcId

    const repos= await getReposOfClient(client.id)
    const selectors= repos.map((repo) => ({ id: repo.id, name: repo.name }))


    const fullMode= false

    return (
        <div className="w-full mt-5 border-t pt-5">
            <p className="text-2xl font-bold text-center">Function Call config</p>
            <div className="mt-6 flex items-center justify-between gap-4">
                <RepoSelector clientId={client.id} selectors={selectors} />
                <CreateFCDialog clientId={client.id} />
            </div>
            { repoId && <FCConfig repoId={repoId} fullMode={fullMode} clientId={client.id} haveCRM={client.haveCRM} /> }
        </div>
    )
}
