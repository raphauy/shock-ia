"use server"

import { getInboxId } from "@/services/chatwoot"
import { deleteWhatsappInstance, getClient, getClientBySlug, getWhatsappInstance, setChatwootData, setInboxProvider, setWhatsappInboxId, setWhatsappInstance } from "@/services/clientService"
import { connectInstance, connectionState, createInstanceBasic, deleteInstance, logoutInstance, restartInstance, enableChatwoot, disableChatwoot } from "@/services/wrc-sdk"
import { ChatwootParams, WhatsappInstanceDAO } from "@/services/wrc-sdk-types"
import { InboxProvider } from "@/lib/generated/prisma"
import { revalidatePath } from "next/cache"

export async function createInstanceAction(instanceName: string) {
    const client= await getClientBySlug(instanceName)
    if (!client) {
        throw new Error('Client not found')
    }
    //const webhookUrl= `${process.env.NEXTAUTH_URL}/api/${client.id}/wrc`
    const response = await createInstanceBasic(instanceName)
    const instanceData: WhatsappInstanceDAO = {
        name: response.instance.instanceName,
        externalId: response.instance.instanceId,
        number: null,
        whatsappInboxId: null,
        chatwootUrl: null,
        chatwootAccountId: null,
        chatwootAccessToken: null,
        chatwootWidgetToken: null,
        clientId: client.id,
    }
    const instance = await setWhatsappInstance(instanceData)
    revalidatePath('/admin/config')
    return instance
}

export async function getConnectionStatusAction(instanceName: string) {
    const status = await connectionState(instanceName)
    return status
}

export async function connectInstanceAction(instanceName: string) {
    const instance = await connectInstance(instanceName)
    revalidatePath('/admin/config')
    return instance
}

export async function logoutInstanceAction(instanceName: string) {
    const instance = await logoutInstance(instanceName)
    revalidatePath('/admin/config')
    return instance
}

export async function deleteInstanceAction(instanceName: string) {
    const instance = await deleteInstance(instanceName)
    if (instance) {
        await deleteWhatsappInstance(instanceName)
    }
    revalidatePath('/admin/config')
    return instance
}

export async function restartInstanceAction(instanceName: string) {
    const instance = await restartInstance(instanceName)
    revalidatePath('/admin/config')
    return instance
}

export async function enableChatwootAction(clientId: string, instanceName: string, chatwootAccountId: string) {
    const url= process.env.CHATWOOT_URL
    const token= process.env.CHATWOOT_ACCESS_TOKEN
    if (!url || !token) {
        throw new Error('CHATWOOT_URL or CHATWOOT_ACCESS_TOKEN is not set')
    }
    const whatsappInstance = await getWhatsappInstance(clientId)
    if (!whatsappInstance) {
        throw new Error('Whatsapp instance not found')
    }

    const params: ChatwootParams = {
        enabled: true,
        accountId: chatwootAccountId,
        token,
        url,
        signMsg: false,
        reopenConversation: false,
        conversationPending: true,        
        nameInbox: "whatsapp",
        importContacts: false,        
        importMessages: false,
        daysLimitImportMessages: 7,
        signDelimiter: '\n',
        autoCreate: true,
        organization: 'WRC',
        logo: '',
    }

    await enableChatwoot(instanceName, params)

    const whatsappInboxId = await getInboxId(Number(chatwootAccountId), "whatsapp")

    const chatwootUpdated= await setChatwootData(clientId, chatwootAccountId, token, url, String(whatsappInboxId))

    revalidatePath('/admin/config')

    return chatwootUpdated
}

export async function disableChatwootAction(instanceName: string) {
    const result = await disableChatwoot(instanceName)
    return result
}

export async function setInboxProvidersAction(clientId: string, inboxProvider: InboxProvider) {
    const client = await setInboxProvider(clientId, inboxProvider)
    revalidatePath('/admin/config')
    return client
}

export async function setWhatsappInboxIdAction(clientId: string, whatsappInboxId: string) {
    const client = await setWhatsappInboxId(clientId, whatsappInboxId)
    revalidatePath('/admin/config')
    return client
}