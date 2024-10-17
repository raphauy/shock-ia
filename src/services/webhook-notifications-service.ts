import { JsonValue } from "@prisma/client/runtime/library";
import { format } from "date-fns";
import { RepoDataDAO } from "./repodata-services";
import { es } from "date-fns/locale";
import axios from "axios";

type RepoDataEntryResponse = {
    id: string,
    phone: string,
    functionName: string,
    clientId: string,
    clientName: string,
    clientSlug: string,
    conversationId: string,
    date: string,
    data: String,
}

type RepoDataWithClientName = RepoDataDAO & {
    client: {
        name: string,
        slug: string
    }
}

export async function sendWebhookNotification(webhookUrl: string, repoData: RepoDataWithClientName) {
    const parsedData = JSON.parse(repoData.data as string);

    const jsonReplaced = Object.keys(parsedData).reduce((acc, key) => {
      acc[key] = parsedData[key] === true ? "SI" : parsedData[key] === false ? "NO" : parsedData[key];
      return acc;
    }, {} as Record<string, any>);


    const data: RepoDataEntryResponse = {
        id: repoData.id,
        phone: repoData.phone,
        functionName: repoData.functionName,
        clientId: repoData.clientId,
        clientName: repoData.client.name,
        clientSlug: repoData.client.slug,
        conversationId: repoData.conversationId,
        date: format(repoData.createdAt, "yyyy-MM-dd HH:mm", { locale: es }),
        data: JSON.stringify(jsonReplaced),
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
            const statusCode = (error as any).response?.status
            // if error es 400 log only the message
            if (statusCode === 400) {
                console.error('Failed to send webhook notification:', (error as any).response?.data?.message)
            } else {
                console.error('Failed to send webhook notification:', error)
            }
        }
    }
}