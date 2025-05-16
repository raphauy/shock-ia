import { cookies } from 'next/headers';

import { Chat } from '@/components/chat-ui/chat';
import { DEFAULT_CHAT_MODEL } from '@/lib/ai/models';
import { getCurrentUser } from '@/lib/auth';
import { getClientBySlug } from '@/services/clientService';
import { getActiveMessages } from '@/services/conversationService';
import type { Attachment, UIMessage } from 'ai';
import { Message } from '@/lib/generated/prisma';
import { getLocalTools } from '@/services/local-tools-services';
import { getUiGroupsTools } from '@/lib/ai/tools';

type Props = {
  params: Promise<{ 
    slug: string
  }>
}
export default async function Page(props: Props) {
  const params = await props.params;
  const { slug } = params;

  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return <div>Debes estar logueado para acceder a esta página</div>
  }
  if (!currentUser.email) {
    return <div>Debes estar logueado para acceder a esta página</div>
  }

  const client = await getClientBySlug(slug);
  if (!client) {
    return <div>No se pudo obtener el cliente ({slug})</div>
  }

  const messagesFromDb = await getActiveMessages(currentUser.email, client.id)

  function convertToUIMessages(messages: Array<Message>): Array<UIMessage> {
    return messages.map((message) => ({
      id: message.id,
      parts: message.parts as UIMessage['parts'],
      role: message.role as UIMessage['role'],
      // Note: content will soon be deprecated in @ai-sdk/react
      content: '',
      createdAt: message.createdAt,
      experimental_attachments: (message.attachments as unknown as Array<Attachment>) ?? [],
    }));
  }

  const conversationId = messagesFromDb && messagesFromDb.length > 0 ? messagesFromDb[0].conversationId : null;

  const cookieStore = await cookies();
  const chatModelFromCookie = cookieStore.get('chat-model');
  
  const selectedChatModel = chatModelFromCookie ? chatModelFromCookie.value : DEFAULT_CHAT_MODEL;

  const uiGroupsTools= await getUiGroupsTools(client.id)

  return (
    <>
      <Chat
        conversationId={conversationId}
        clientId={client.id}
        initialMessages={convertToUIMessages(messagesFromDb ?? [])}
        selectedChatModel={selectedChatModel}
        uiGroupsTools={uiGroupsTools}
      />
    </>
  );
}
