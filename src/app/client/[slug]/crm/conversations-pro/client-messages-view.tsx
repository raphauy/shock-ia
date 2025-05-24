"use client";

import { Messages } from '@/components/chat-ui/messages';
import { Card, CardContent } from '@/components/ui/card';
import type { UIMessage } from 'ai';
import type { ChatRequestOptions } from 'ai';
import { Badge } from '@/components/ui/badge';
import { CloseConversationDialog } from '@/app/client/[slug]/chats/(delete-conversation)/delete-dialogs';

// Extensión local del tipo UIMessage para incluir los campos de tokens
export interface UIMessageWithTokens extends UIMessage {
  promptTokens?: number;
  completionTokens?: number;
  gptData?: any;
}

interface ClientMessagesViewProps {
  messages: UIMessageWithTokens[];
  slug: string;
  conversationId: string;
}

export function ClientMessagesView({ messages, slug, conversationId }: ClientMessagesViewProps) {
  // Mock functions para los props que no usaremos activamente
  const mockSetMessages = () => {};
  const mockReload = (chatRequestOptions?: ChatRequestOptions) => Promise.resolve(null);
  
  // Calcular sumatorias de tokens
  const promptTokens = messages.reduce((acc, msg) => acc + (msg.promptTokens || 0), 0);
  const completionTokens = messages.reduce((acc, msg) => acc + (msg.completionTokens || 0), 0);
  const totalTokens = promptTokens + completionTokens;

  return (
    <div className="h-full flex flex-col overflow-hidden bg-background">
      {/* Header sticky de tokens */}
      <div className="sticky top-0 z-10 bg-muted/95 backdrop-blur border-b border-border px-4 py-1 flex gap-4 items-center">
        <span className="font-medium text-sm text-muted-foreground">Tokens de la conversación:</span>
        <Badge variant="archived">In: {promptTokens}</Badge>
        <Badge variant="archived">Out: {completionTokens}</Badge>
        <Badge>Total: {totalTokens}</Badge>
        <div className="flex-1" />
        {conversationId && (
          <CloseConversationDialog
            id={conversationId}
            description="¿Seguro que quieres cerrar esta conversación?"
            redirectUri={`/client/${slug}/crm/conversations-pro`}
          />
        )}
      </div>
      <Card className="flex-grow flex flex-col overflow-hidden border-0 shadow-none">
        <CardContent className="p-0 h-full flex flex-col">
          <Messages 
            messages={messages}
            setMessages={mockSetMessages}
            reload={mockReload}
            status="ready"
            slug={slug}
          />
        </CardContent>
      </Card>
    </div>
  );
} 