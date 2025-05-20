"use client";

import { Messages } from '@/components/chat-ui/messages';
import { Card, CardContent } from '@/components/ui/card';
import type { UIMessage } from 'ai';
import type { ChatRequestOptions } from 'ai';

interface ClientMessagesViewProps {
  messages: UIMessage[];
  slug: string;
}

export function ClientMessagesView({ messages, slug }: ClientMessagesViewProps) {
  // Mock functions para los props que no usaremos activamente
  const mockSetMessages = () => {};
  const mockReload = (chatRequestOptions?: ChatRequestOptions) => Promise.resolve(null);
  
  return (
    <div className="h-full flex flex-col overflow-hidden bg-background">
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