'use client';

import { cn } from '@/lib/utils';
import { UseChatHelpers } from '@ai-sdk/react';
import type { UIMessage } from 'ai';
import cx from 'classnames';
import equal from 'fast-deep-equal';
import { AnimatePresence, motion } from 'framer-motion';
import Image from 'next/image';
import { memo } from 'react';
import { DocumentTool, DocumentToolSkeleton, GenericTool } from './component-tools';
import { Markdown } from './markdown';
import { MessageActions } from './message-actions';
import { MessageReasoning } from './message-reasoning';
import { PreviewAttachment } from './preview-attachment';

const PurePreviewMessage = ({
  message,
  isLoading,
  setMessages,
  reload,
  status,
  slug,
}: {
  message: UIMessage;
  isLoading: boolean;
  setMessages: UseChatHelpers['setMessages'];
  reload: UseChatHelpers['reload'];
  status: UseChatHelpers['status'];
  slug: string;
}) => {

  return (
    <AnimatePresence>
      <motion.div
        data-testid={`message-${message.role}`}          
        initial={{ y: 5, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full mx-auto max-w-3xl px-4 group/message" 
        data-role={message.role}
      >
        <div
          className={cn('flex gap-4 w-full group-data-[role=user]/message:ml-auto group-data-[role=user]/message:max-w-2xl group-data-[role=user]/message:w-fit pt-0',
          )}
        >
          {/* {message.role === 'assistant' && (
            <AssistantAvatar status={status} />
          )} */}

          <div className="flex flex-col gap-4 w-full pt-0 mt-0">
            {message.experimental_attachments && (
              <div
                data-testid={`message-attachments`}
                className="flex flex-row justify-end gap-2"
              >
                {message.experimental_attachments.map((attachment) => (
                  <PreviewAttachment
                    key={attachment.url}
                    attachment={attachment}
                  />
                ))}
              </div>
            )}

            {message.parts?.map((part, index) => {
              const { type } = part;
              const key = `message-${message.id}-part-${index}`;

              if (type === 'reasoning') {
                return (
                  <MessageReasoning
                    key={key}
                    isLoading={isLoading}
                    reasoning={part.reasoning}
                  />
                );
              }

              if (type === 'text') {
                return (
                  <div key={key} className="flex gap-2">
                    {message.role === 'assistant' && (
                      <AssistantAvatar status={status} />
                    )}
                  
                    <div className="flex flex-row gap-2 items-start mt-1">
                      <div
                        data-testid="message-content"
                        className={cn('flex flex-col gap-4', {
                          'bg-primary text-primary-foreground px-3 py-2 rounded-xl':
                            message.role === 'user',
                        })}
                      >
                        <Markdown>{part.text}</Markdown>
                      </div>
                    </div>
                  </div>
                );
              }

              if (type === 'tool-invocation') {
                const { toolInvocation } = part;
                const { toolName, toolCallId, state } = toolInvocation;

                if (state === 'call') {
                  const { args } = toolInvocation;

                  return (
                    <div
                      key={toolCallId}
                      className={cx({
                        skeleton: ['getDocument'].includes(toolName),
                      })}
                    >
                      {
                        toolName === 'getDocument' ? (
                          <DocumentToolSkeleton />
                        )
                      : (
                          <GenericTool toolName={toolName} args={args} />
                        )
                      }
                      {/* {toolName === 'getWeather' ? (
                        <Weather />
                      ) : toolName === 'createDocument' ? (
                        <DocumentPreview isReadonly={isReadonly} args={args} />
                      ) : toolName === 'updateDocument' ? (
                        <DocumentToolCall
                          type="update"
                          args={args}
                          isReadonly={isReadonly}
                        />
                      ) : toolName === 'requestSuggestions' ? (
                        <DocumentToolCall
                          type="request-suggestions"
                          args={args}
                          isReadonly={isReadonly}
                        />
                      ) : null} */}
                    </div>
                  );
                }

                if (state === 'result') {
                  const { args, result } = toolInvocation;

                  return (
                    <div key={toolCallId}>
                      {
                        toolName === 'getDocument' ? (
                          <DocumentTool documentId={args.documentId} documentName={result.documentName} slug={slug} />
                        )
                      : (
                          <GenericTool toolName={toolName} args={args} result={result} />
                        )
                      }
                    </div>
                  );
                }
              }
            })}

            <MessageActions
              key={`action-${message.id}`}
              message={message}
              isLoading={isLoading}
            />
          </div>
        </div>
      </motion.div>
  </AnimatePresence>
);
};

export const PreviewMessage = memo(
PurePreviewMessage,
(prevProps, nextProps) => {
  if (prevProps.isLoading !== nextProps.isLoading) return false;
  if (prevProps.message.id !== nextProps.message.id) return false;
  if (!equal(prevProps.message.parts, nextProps.message.parts)) return false;

  return true;
},
);

export const ThinkingMessage = ({
status,
}: { status: UseChatHelpers['status'] }) => {
const role = 'assistant';

return (
    <motion.div
      data-testid="message-assistant-loading"      
      initial={{ y: 5, opacity: 0 }}
      animate={{ y: 0, opacity: 1, transition: { delay: 1 } }}
      className="w-full mx-auto max-w-3xl px-4 group/message"
      data-role={role}
    >
      <div
        className={cx(
          'flex gap-4 group-data-[role=user]/message:px-3 w-full group-data-[role=user]/message:w-fit group-data-[role=user]/message:ml-auto group-data-[role=user]/message:max-w-2xl group-data-[role=user]/message:py-2 rounded-xl',
          {
            'group-data-[role=user]/message:bg-muted': true,
          },
        )}
      >
        <AssistantAvatar status={status} showBackground={false} />

        <div className="flex flex-col gap-2 w-full mt-1">
          <div className="flex flex-col gap-4 text-muted-foreground">
            🤔 Hmmm...
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Componente reutilizable para el avatar del asistente
interface AssistantAvatarProps {
  status: UseChatHelpers['status'];
  showBackground?: boolean;
}

function AssistantAvatar({ status, showBackground = true }: AssistantAvatarProps) {
  return (
    <div className={cn(
      "size-8 flex items-center justify-center ring-1 shrink-0 ring-blue-600 rounded-full overflow-hidden",
      showBackground && "bg-background"
    )}>
      <div className="flex items-center justify-center">
        <div
          className={cn("flex items-center justify-center", {
            'animate-spin': status !== 'ready',
          })}
        >
          <Image 
            src="/asistime_icon2.png"
            alt="Asistime.ai Logo"
            width={24}
            height={24}
            className="w-[24px] h-[24px]"
          />
        </div>
      </div>
    </div>
  );
}
