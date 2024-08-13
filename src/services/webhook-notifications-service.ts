import { JsonValue } from "@prisma/client/runtime/library";
import { format } from "date-fns";
import { RepoDataDAO } from "./repodata-services";
import { es } from "date-fns/locale";
import axios from "axios";

type RepoDataEntryResponse = {
    id: string,
    phone: string,
    repoName: string,
    functionName: string,
    clientId: string,
    clientName: string,
    date: string,
    data: String,
}

type RepoDataWithClientName = RepoDataDAO & {
    client: {
        name: string
    }
}

export async function sendWebhookNotification(webhookUrl: string, repoData: RepoDataWithClientName) {

    const data: RepoDataEntryResponse = {
        id: repoData.id,
        phone: repoData.phone,
        repoName: repoData.repoName,
        functionName: repoData.functionName,
        clientId: repoData.clientId,
        clientName: repoData.client.name,
        date: format(repoData.createdAt, "yyyy-MM-dd HH:mm", { locale: es }),
        data: repoData.data,
    }

    const init= new Date().getTime()
    try {
        // const response = await axios.post(webhookUrl, data, {
        const response = await axios.post(webhookUrl, data, {
                headers: {
                'Content-Type': 'application/json',
            },
            timeout: 20000, // 20 segundos
        })
        const elapsedTime = new Date().getTime() - init
        console.log(`Request took ${elapsedTime} milliseconds`)

        if (response.status !== 200) {
            console.error(`Failed to send webhook notification to ${webhookUrl} `, response.status, response.statusText)
        }
    } catch (error) {
        if (axios.isAxiosError(error) && error.code === 'ECONNABORTED') {
            console.error('Request timed out');
        } else {
            console.error('Failed to send webhook notification:', error)
        }
    }
}