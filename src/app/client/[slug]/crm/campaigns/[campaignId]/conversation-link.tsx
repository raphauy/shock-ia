"use client"

import { MessageCircle } from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"

type Props = {
    conversationId: string
}

export function ConversationLink({ conversationId }: Props) {
    const params= useParams()
    const slug= params.slug as string

    return (
        <Link href={`/client/${slug}/chats?id=${conversationId}`} target="_blank" prefetch={false}><MessageCircle className="w-4 h-4" /></Link>
    )
}