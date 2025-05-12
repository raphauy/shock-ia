'use client';

import type { Attachment, UIMessage } from 'ai';
import cx from 'classnames';
import type React from 'react';
import { useRef, useEffect, useState, useCallback, type Dispatch, type SetStateAction, type ChangeEvent, memo } from 'react';
import { useLocalStorage, useWindowSize } from 'usehooks-ts';
import { PreviewAttachment } from './preview-attachment';
import equal from 'fast-deep-equal';
import type { UseChatHelpers } from '@ai-sdk/react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ArrowUpIcon, PaperclipIcon, StopCircleIcon, Wrench, PlusCircleIcon } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { SuggestedActions } from './suggested-actions';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { closeConversationAction, getActiveConversationIdAction } from '@/app/client/[slug]/simulator-v2/actions';
import { useSession } from 'next-auth/react';

function PureMultimodalInput({
  conversationId,
  clientId,
  slug,
  input,
  setInput,
  status,
  stop,
  attachments,
  setAttachments,
  messages,
  setMessages,
  append,
  handleSubmit,
  className,
  userTools = { totalTools: 0, tools: [] },
}: {
  conversationId: string | null;
  clientId: string;
  slug: string;
  input: UseChatHelpers['input'];
  setInput: UseChatHelpers['setInput'];
  status: UseChatHelpers['status'];
  stop: () => void;
  attachments: Array<Attachment>;
  setAttachments: Dispatch<SetStateAction<Array<Attachment>>>;
  messages: Array<UIMessage>;
  setMessages: UseChatHelpers['setMessages'];
  append: UseChatHelpers['append'];
  handleSubmit: UseChatHelpers['handleSubmit'];
  className?: string;
  userTools?: {
    totalTools: number;
    tools: Array<{ name: string; mcpName: string }>;
  };
}) {
  const session= useSession()
  const email= session.data?.user?.email
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { width } = useWindowSize();

  useEffect(() => {
    if (textareaRef.current) {
      adjustHeight();
    }
  }, []);

  const adjustHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight + 2}px`;
    }
  };

  const resetHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = '98px';
    }
  };

  const [localStorageInput, setLocalStorageInput] = useLocalStorage(
    'input',
    '',
  );

  useEffect(() => {
    if (textareaRef.current) {
      const domValue = textareaRef.current.value;
      // Prefer DOM value over localStorage to handle hydration
      const finalValue = domValue || localStorageInput || '';
      setInput(finalValue);
      adjustHeight();
    }
    // Only run once after hydration
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setLocalStorageInput(input);
  }, [input, setLocalStorageInput]);

  const handleInput = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(event.target.value);
    adjustHeight();
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadQueue, setUploadQueue] = useState<Array<string>>([]);

  const submitForm = useCallback(() => {
    window.history.replaceState({}, '', `/client/${slug}/simulator-v2`);

    handleSubmit(undefined, {
      experimental_attachments: attachments,
    });

    setAttachments([]);
    setLocalStorageInput('');
    resetHeight();

    if (width && width > 768) {
      textareaRef.current?.focus();
    }
  }, [
    attachments,
    handleSubmit,
    setAttachments,
    setLocalStorageInput,
    width,
    slug,
  ]);

  const uploadFile = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/files/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        const { url, pathname, contentType } = data;

        return {
          url,
          name: pathname,
          contentType: contentType,
        };
      }
      const { error } = await response.json();
      toast({
        title: 'Error',
        description: error,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to upload file, please try again!',
      });
    }
  };

  const handleFileChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files || []);

      setUploadQueue(files.map((file) => file.name));

      try {
        const uploadPromises = files.map((file) => uploadFile(file));
        const uploadedAttachments = await Promise.all(uploadPromises);
        const successfullyUploadedAttachments = uploadedAttachments.filter(
          (attachment) => attachment !== undefined,
        ) as Attachment[];

        setAttachments((currentAttachments) => [
          ...currentAttachments,
          ...successfullyUploadedAttachments,
        ]);
      } catch (error) {
        console.error('Error uploading files!', error);
      } finally {
        setUploadQueue([]);
      }
    },
    [setAttachments],
  );

  const handleNewConversation = async () => {
    if (messages.length === 0) return;
    if (!email) {
      toast({
        title: "Error",
        description: "Debes estar autenticado para crear una nueva conversación",
      });
      return;
    }
    
    // Obtener el ID de conversación del prop o mediante la action
    let convId = conversationId;
    
    // Si no tenemos conversationId pero hay mensajes, obtenemos el ID de conversación del primer mensaje
    if (!convId && messages.length > 0 && messages[0]?.id) {
      try {
        convId = await getActiveConversationIdAction(email, clientId);
      } catch (error) {
        toast({
          title: "Error",
          description: "No se pudo obtener el ID de la conversación",
        });
        return;
      }
    }
    
    if (!convId) {
      toast({
        title: "Error",
        description: "No se puede identificar la conversación actual",
      });
      return;
    }
    
    try {
      await closeConversationAction(convId);
      
      // Limpiar el estado local
      setMessages([]);
      setInput('');
      resetHeight();
      
      toast({
        description: "Conversación cerrada. Iniciando nueva conversación.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo cerrar la conversación",
      });
    }
  };

  return (
    <div className="relative w-full flex flex-col gap-4">
      {/* {messages.length === 0 &&
        attachments.length === 0 &&
        uploadQueue.length === 0 && (
          <SuggestedActions append={append} slug={slug} />
        )} */}

      <input
        type="file"
        className="fixed -top-4 -left-4 size-0.5 opacity-0 pointer-events-none"
        ref={fileInputRef}
        multiple
        onChange={handleFileChange}
        tabIndex={-1}
      />

      {(attachments.length > 0 || uploadQueue.length > 0) && (
        <div
          data-testid="attachments-preview"
          className="flex flex-row gap-2 overflow-x-scroll items-end"
        >
          {attachments.map((attachment, index) => (
            <PreviewAttachment
              key={`${attachment.url}-${index}`}
              attachment={attachment}
              isUploading={false}
            />
          ))}

          {uploadQueue.map((filename) => (
            <PreviewAttachment
              key={filename}
              attachment={{
                url: '',
                name: filename,
                contentType: '',
              }}
              isUploading={true}
            />
          ))}
        </div>
      )}

      <Textarea
        data-testid="multimodal-input"
        ref={textareaRef}
        placeholder="Escribe aquí..."
        value={input}
        className={cx(
          'min-h-[24px] max-h-[calc(75dvh)] overflow-hidden resize-none rounded-2xl !text-base bg-background pb-10 border border-input shadow-sm focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none focus-visible:border-input',
          className,
        )}
        rows={2}
        autoFocus
        onChange={handleInput}
        onKeyDown={(event) => {
          if (
            event.key === 'Enter' &&
            !event.shiftKey &&
            !event.nativeEvent.isComposing
          ) {
            event.preventDefault();

            if (status !== 'ready') {
              toast({
                title: 'Error',
                description: 'Por favor, espera a que el modelo termine su respuesta!',
              });
            } else {
              submitForm();
            }
          }
        }}
      />

      <div className="absolute bottom-0 p-2 w-fit flex flex-row justify-start items-center">
        <TooltipProvider>
          <AttachmentsButton fileInputRef={fileInputRef} status={status} />
          <ToolsButton userTools={userTools} />
          <NewConversationButton 
            handleNewConversation={handleNewConversation}
            disabled={messages.length === 0 || status !== 'ready'}
          />
        </TooltipProvider>
      </div>

      <div className="absolute bottom-0 right-0 p-2 w-fit flex flex-row justify-end">
        {status === 'submitted' ? (
          <StopButton stop={stop} setMessages={setMessages} />
        ) : (
          <SendButton
            input={input}
            submitForm={submitForm}
            uploadQueue={uploadQueue}
          />
        )}
      </div>
    </div>
  );
}

export const MultimodalInput = memo(
  PureMultimodalInput,
  (prevProps, nextProps) => {
    if (prevProps.input !== nextProps.input) return false;
    if (prevProps.status !== nextProps.status) return false;
    if (!equal(prevProps.attachments, nextProps.attachments)) return false;
    if (!equal(prevProps.messages, nextProps.messages)) return false;

    return true;
  },
);

function PureAttachmentsButton({
  fileInputRef,
  status,
}: {
  fileInputRef: React.MutableRefObject<HTMLInputElement | null>;
  status: UseChatHelpers['status'];
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          data-testid="attachments-button"
          className="rounded-full flex items-center gap-2 px-3 py-2 h-fit text-sm border border-input bg-background hover:bg-muted text-foreground"
          onClick={(event) => {
            event.preventDefault();
            fileInputRef.current?.click();
          }}
          disabled={status !== 'ready'}
          variant="ghost"
        >
          <PaperclipIcon size={16} />
          <span>Imágenes</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>Imágenes</p>
      </TooltipContent>
    </Tooltip>
  );
}

const AttachmentsButton = memo(PureAttachmentsButton);

function PureStopButton({
  stop,
  setMessages,
}: {
  stop: () => void;
  setMessages: UseChatHelpers['setMessages'];
}) {
  return (
    <Button
      data-testid="stop-button"
      className="rounded-full p-1.5 h-fit border dark:border-zinc-600"
      onClick={(event) => {
        event.preventDefault();
        stop();
        setMessages((messages) => messages);
      }}
    >
      <StopCircleIcon size={14} />
    </Button>
  );
}

const StopButton = memo(PureStopButton);

function PureSendButton({
  submitForm,
  input,
  uploadQueue,
}: {
  submitForm: () => void;
  input: string;
  uploadQueue: Array<string>;
}) {
  return (
    <Button
      data-testid="send-button"
      className="rounded-full p-2 h-fit bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center"
      onClick={(event) => {
        event.preventDefault();
        submitForm();
      }}
      disabled={input.length === 0 || uploadQueue.length > 0}
    >
      <ArrowUpIcon size={16} />
    </Button>
  );
}

const SendButton = memo(PureSendButton, (prevProps, nextProps) => {
  if (prevProps.uploadQueue.length !== nextProps.uploadQueue.length)
    return false;
  if (prevProps.input !== nextProps.input) return false;
  return true;
});

const ToolsButton = memo(
  function ToolsButton({
    userTools,
  }: {
    userTools: {
      totalTools: number;
      tools: Array<{ name: string; mcpName: string }>;
    };
  }) {
    const [open, setOpen] = useState(false);

    return (
      <Tooltip>
        <Popover open={open} onOpenChange={setOpen}>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                disabled={userTools.totalTools === 0}
                className="rounded-full flex items-center gap-2 px-3 py-2 h-fit text-sm border border-input bg-background hover:bg-muted text-foreground ml-1"
              >
                <Wrench size={16} />
                <span>Herramientas MCP</span>
                {userTools.totalTools > 0 && (
                  <span className="bg-accent-foreground text-accent rounded-full size-5 min-w-5 flex items-center justify-center text-[10px] font-medium">
                    {userTools.totalTools}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
          </TooltipTrigger>
          <PopoverContent className="w-72 p-0" align="end" sideOffset={8}>
            <div className="p-3 bg-accent/50 border-b">
              <h3 className="font-medium text-sm">Tools disponibles</h3>
            </div>
            <div className="max-h-[300px] overflow-y-auto p-2">
              {userTools.tools.length === 0 ? (
                <div className="py-3 px-2 text-sm text-muted-foreground text-center">
                  No hay tools disponibles
                </div>
              ) : (
                <div className="space-y-1">
                  {userTools.tools.map((tool, index) => (
                    <div
                      key={`${tool.mcpName}-${tool.name}-${index}`}
                      className="py-1.5 px-2 text-sm hover:bg-accent/50 rounded-md cursor-default"
                    >
                      <div className="font-medium">{tool.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {tool.mcpName}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>
        <TooltipContent>
          <p>Herramientas disponibles</p>
        </TooltipContent>
      </Tooltip>
    );
  },
  (prevProps, nextProps) => {
    return equal(prevProps.userTools, nextProps.userTools);
  },
);

function PureNewConversationButton({
  handleNewConversation,
  disabled,
}: {
  handleNewConversation: () => Promise<void>;
  disabled: boolean;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          data-testid="new-conversation-button"
          className="rounded-full flex items-center gap-2 px-3 py-2 h-fit text-sm border border-input bg-background hover:bg-muted text-foreground ml-1"
          onClick={(event) => {
            event.preventDefault();
            handleNewConversation();
          }}
          disabled={disabled}
          variant="ghost"
        >
          <PlusCircleIcon size={16} />
          <span>Nueva conversación</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>Nueva conversación</p>
      </TooltipContent>
    </Tooltip>
  );
}

const NewConversationButton = memo(PureNewConversationButton);
