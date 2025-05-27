import type { UIMessage } from 'ai';
import { PreviewMessage, ThinkingMessage } from './message';
import { useScrollToBottom } from './use-scroll-to-bottom';
import { Greeting } from './greeting';
import { memo } from 'react';
import equal from 'fast-deep-equal';
import type { UseChatHelpers } from '@ai-sdk/react';
import { cn } from '@/lib/utils';

interface MessagesProps {
  status: UseChatHelpers['status'];
  messages: Array<UIMessage>;
  setMessages: UseChatHelpers['setMessages'];
  reload: UseChatHelpers['reload'];
  slug: string;
  maxInWindow: number;
}

function PureMessages({
  status,
  messages,
  setMessages,
  reload,
  slug,
  maxInWindow,
}: MessagesProps) {
  const [messagesContainerRef, messagesEndRef] = useScrollToBottom<HTMLDivElement>();

  const messagesInRed= messages.length - maxInWindow

  return (
    <div
      ref={messagesContainerRef}
      className={cn("flex flex-col min-w-0 gap-6 flex-1 pt-4 w-full overflow-y-auto scrollbar-thin")}
    >
      {messages.length === 0 && <Greeting />}

      {messages.map((message, index) => (
        <div key={message.id} className={cn(index < messagesInRed && "bg-red-100 dark:bg-red-900")}>
          <PreviewMessage            
            message={message}
            isLoading={status === 'streaming' && messages.length - 1 === index}
            setMessages={setMessages}
            reload={reload}
            status={status}
            slug={slug}
          />
        </div>
      ))}

      {status === 'submitted' &&
        messages.length > 0 &&
        messages[messages.length - 1].role === 'user' && (
          <ThinkingMessage status={status} />
        )}

      <div
        ref={messagesEndRef}
        className="shrink-0 min-w-[24px] min-h-[24px]"
      />
    </div>
  );
}

export const Messages = memo(PureMessages, (prevProps, nextProps) => {

  if (prevProps.status !== nextProps.status) return false;
  if (prevProps.status && nextProps.status) return false;
  if (prevProps.messages.length !== nextProps.messages.length) return false;
  if (!equal(prevProps.messages, nextProps.messages)) return false;

  return true;
});
