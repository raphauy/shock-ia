
export type ChatwootSender = {
    id: number;
    name: string;
    phone_number?: string;
    email?: string;
    thumbnail?: string;
    identifier?: string;
    avatar?: string;
    type?: string;
    custom_attributes?: Record<string, any>;
    additional_attributes?: Record<string, any>;
    account?: {
        id: number;
        name: string;
    };
};

export type ChatwootConversation = {
    id: number;
    status: string; // "pending", "resolved", etc.
    inbox_id: number;
    can_reply: boolean;
    channel: string;
    contact_inbox: {
        id: number;
        contact_id: number;
        inbox_id: number;
        source_id: string;
        created_at: string;
        updated_at: string;
        hmac_verified: boolean;
        pubsub_token: string;
    };
    messages: any[]; // Podríamos definir un tipo específico para mensajes si es necesario
    labels: any[];
    meta: {
        sender: ChatwootSender;
        assignee: any;
        team: any;
        hmac_verified: boolean;
    };
    custom_attributes: Record<string, any>;
    unread_count: number;
    first_reply_created_at: string | null;
    priority: any;
    waiting_since: number;
    agent_last_seen_at: number;
    contact_last_seen_at: number;
    last_activity_at: number;
    timestamp: number;
    created_at: number;
    additional_attributes?: Record<string, any>;
    snoozed_until?: string | null;
};

export type ChatwootAttachment = {
    id: number;
    message_id: number;
    file_type: string;  // "image", "audio", "video", etc.
    account_id: number;
    extension: string | null;
    data_url: string;   // URL para descargar el archivo
    thumb_url?: string; // URL para una miniatura (si aplica, puede estar vacía para audio)
    file_size?: number; // Tamaño del archivo en bytes
    width?: number | null;  // Dimensiones relevantes para imágenes
    height?: number | null; // Dimensiones relevantes para imágenes
    created_at?: string;
    updated_at?: string;
};

export type IncomingChatwootMessage = {
    id: number;
    content: string | null; // El texto del mensaje (puede ser null si solo hay adjuntos)
    account: {
        id: number;
        name: string;
    };
    conversation: ChatwootConversation;
    message_type: string; // "incoming", "outgoing", etc.
    content_type: string; // "text", "file", etc.
    content_attributes: Record<string, any>; // Atributos adicionales
    additional_attributes: Record<string, any>;
    attachments?: ChatwootAttachment[]; // Adjuntos (imágenes, audios, etc.)
    sender: ChatwootSender;
    inbox: {
        id: number;
        name: string;
    };
    created_at: string;
    status: string;
    private: boolean;
    source_id: string;
    event: string;
};

