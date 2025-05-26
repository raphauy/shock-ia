'use client';

import { ChatHeader } from '@/components/chat-ui/chat-header';
import { useChat } from '@ai-sdk/react';
import type { Attachment, UIMessage } from 'ai';
import { useState, useCallback } from 'react';
import { useSWRConfig } from 'swr';
import { toast } from '../ui/use-toast';
import { MultimodalInput } from './multimodal-input';
import { useParams } from 'next/navigation';
import { Messages } from './messages';
import { UiGroupToolData } from '@/lib/ai/tools';

export function Chat({
  conversationId,
  clientId,
  initialMessages,
  selectedChatModel,
  uiGroupsTools = [],
  maxInWindow,
  systemMessage
}: {
  conversationId: string | null;
  clientId: string;
  initialMessages: Array<UIMessage>;
  selectedChatModel: string;
  uiGroupsTools: UiGroupToolData[];
  maxInWindow: number;
  systemMessage: string;
}) {
  const { mutate } = useSWRConfig();
  const params = useParams();
  const slug = params.slug as string;

  const {
    messages,
    setMessages,
    handleSubmit,
    input,
    setInput,
    append,
    status,
    error,
    stop,
    reload,
  } = useChat({
    body: { clientId, selectedChatModel: selectedChatModel },
    api: '/api/chat-v2',
    initialMessages,
    experimental_throttle: 100,
    sendExtraMessageFields: true,
    onFinish: () => {
      //mutate(unstable_serialize(getChatHistoryPaginationKey));
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Ocurrió un error, por favor intente nuevamente!',
      });
    },
  });

  const [attachments, setAttachments] = useState<Array<Attachment>>([]);
  
  return (
    <>
      <div className="flex flex-col min-w-0 h-[calc(100vh-80px)] bg-background w-full items-center text-foreground">
        <ChatHeader
          selectedModelId={selectedChatModel}
        />

        {messages.length === 0 ? (
          <div className="w-full flex flex-col items-center justify-center min-h-[70vh]">
            <div className="w-full flex flex-col items-center justify-center gap-2 max-w-3xl">
              <div className="w-full flex flex-col items-center">
                <Messages
                  status={status}
                  messages={messages}
                  setMessages={setMessages}
                  reload={reload}
                  slug={slug}
                  maxInWindow={maxInWindow}
                />
              </div>
              <form className="flex flex-col items-center w-full max-w-3xl gap-1">
                <MultimodalInput
                  conversationId={conversationId}
                  clientId={clientId}
                  slug={slug}
                  input={input}
                  setInput={setInput}
                  handleSubmit={handleSubmit}
                  status={status}
                  stop={stop}
                  attachments={attachments}
                  setAttachments={setAttachments}
                  messages={messages}
                  setMessages={setMessages}
                  append={append}
                  uiGroupsTools={uiGroupsTools}
                  systemMessage={systemMessage}
                />
              </form>
            </div>
          </div>
        ) : (
          <>
            <div className="flex flex-col min-w-0 gap-6 flex-1 overflow-y-auto scrollbar-thin pt-4 w-full">
              <Messages
                status={status}
                messages={messages}
                setMessages={setMessages}
                reload={reload}
                slug={slug}
                maxInWindow={maxInWindow}
              />
            </div>
            <form className="flex mx-auto px-4 bg-background pb-4 md:pb-6 gap-2 w-full md:max-w-3xl">
              <MultimodalInput
                conversationId={conversationId}
                clientId={clientId}
                slug={slug}
                input={input}
                setInput={setInput}
                handleSubmit={handleSubmit}
                status={status}
                stop={stop}
                attachments={attachments}
                setAttachments={setAttachments}
                messages={messages}
                setMessages={setMessages}
                append={append}
                uiGroupsTools={uiGroupsTools}
                systemMessage={systemMessage}
              />
            </form>
          </>
        )}
      </div>

    </>
  );
}
