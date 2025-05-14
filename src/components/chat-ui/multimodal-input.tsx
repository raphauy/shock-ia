'use client';

import type { Attachment, UIMessage } from 'ai';
import cx from 'classnames';
import type React from 'react';
import { useRef, useEffect, useState, useCallback, type Dispatch, type SetStateAction, type ChangeEvent, memo } from 'react';
import { useLocalStorage, useWindowSize } from 'usehooks-ts';
import { PreviewAttachment } from './preview-attachment';
import equal from 'fast-deep-equal';
import type { UseChatHelpers } from '@ai-sdk/react';
import { toast } from '@/components/ui/use-toast';
import { SuggestedActions } from './suggested-actions';
import { Textarea } from '@/components/ui/textarea';
import { closeConversationAction, getActiveConversationIdAction } from '@/app/client/[slug]/crm/simulator-pro/actions';
import { useSession } from 'next-auth/react';
import { 
  AttachmentsButton, 
  StopButton, 
  SendButton, 
  ToolsButton, 
  NewConversationButton,
  TooltipButtonProvider
} from './chat-buttons';

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
    window.history.replaceState({}, '', `/client/${slug}/crm/simulator-pro`);

    // Si hay attachments pero no hay texto, usar append con "Imagen enviada"
    if (input.trim() === '' && attachments.length > 0) {
      append({
        role: 'user',
        content: 'Imagen enviada',
        experimental_attachments: attachments,
      });
    } else {
      handleSubmit(undefined, {
        experimental_attachments: attachments,
      });
    }

    setAttachments([]);
    setLocalStorageInput('');
    resetHeight();

    if (width && width > 768) {
      textareaRef.current?.focus();
    }
  }, [
    attachments,
    handleSubmit,
    append,
    input,
    setAttachments,
    setLocalStorageInput,
    width,
    slug,
  ]);

  const uploadFile = useCallback(async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('clientSlug', slug);

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
  }, [slug]);

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
    [setAttachments, uploadFile, setUploadQueue],
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
      setAttachments([]);
      setUploadQueue([]);
      resetHeight();
      
      toast({
        title: "Conversación cerrada.",
        description: "Iniciando nueva conversación.",
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
          className="flex flex-row gap-2 overflow-x-auto scrollbar-thin items-end"
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
          'min-h-[24px] max-h-[calc(75dvh)] overflow-hidden resize-none rounded-2xl !text-base bg-background pb-12 border border-input shadow-xl focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none focus-visible:border-input',
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
        <TooltipButtonProvider>
          <AttachmentsButton fileInputRef={fileInputRef} status={status} />
          <ToolsButton userTools={userTools} />
          <NewConversationButton 
            handleNewConversation={handleNewConversation}
            disabled={messages.length === 0 || status !== 'ready'}
          />
        </TooltipButtonProvider>
      </div>

      <div className="absolute bottom-0 right-0 p-2 w-fit flex flex-row justify-end">
        {status === 'submitted' ? (
          <StopButton stop={stop} setMessages={setMessages} />
        ) : (
          <SendButton
            input={input}
            submitForm={submitForm}
            uploadQueue={uploadQueue}
            hasAttachments={attachments.length > 0}
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
