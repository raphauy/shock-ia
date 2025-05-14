'use client';

import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { UseChatHelpers } from '@ai-sdk/react';
import equal from 'fast-deep-equal';
import { ArrowUpIcon, Loader, PaperclipIcon, PlusCircleIcon, StopCircleIcon, Wrench } from 'lucide-react';
import React, { memo, useState } from 'react';

// Botón de adjuntos
interface AttachmentsButtonProps {
  fileInputRef: React.MutableRefObject<HTMLInputElement | null>;
  status: UseChatHelpers['status'];
}

function PureAttachmentsButton({ fileInputRef, status }: AttachmentsButtonProps) {
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

export const AttachmentsButton = memo(PureAttachmentsButton);

// Botón de parar
interface StopButtonProps {
  stop: () => void;
  setMessages: UseChatHelpers['setMessages'];
}

function PureStopButton({ stop, setMessages }: StopButtonProps) {
  return (
    <Button
      data-testid="stop-button"
      className="rounded-full p-1.5 h-fit border dark:border-zinc-600 animate-bounce"
      onClick={(event) => {
        event.preventDefault();
        stop();
        setMessages((messages) => messages);
      }}
    >
      <StopCircleIcon size={16} />
    </Button>
  );
}

export const StopButton = memo(PureStopButton);

// Botón de enviar
interface SendButtonProps {
  submitForm: () => void;
  input: string;
  uploadQueue: Array<string>;
  hasAttachments?: boolean;
}

function PureSendButton({ submitForm, input, uploadQueue, hasAttachments = false }: SendButtonProps) {
  return (
    <Button
      data-testid="send-button"
      className="rounded-full p-2 h-fit bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center"
      onClick={(event) => {
        event.preventDefault();
        submitForm();
      }}
      disabled={(input.length === 0 && !hasAttachments) || uploadQueue.length > 0}
    >
      <ArrowUpIcon size={16} />
    </Button>
  );
}

export const SendButton = memo(PureSendButton, (prevProps, nextProps) => {
  if (prevProps.uploadQueue.length !== nextProps.uploadQueue.length)
    return false;
  if (prevProps.input !== nextProps.input) return false;
  if (prevProps.hasAttachments !== nextProps.hasAttachments) return false;
  return true;
});

// Botón de herramientas
interface ToolsButtonProps {
  userTools: {
    totalTools: number;
    tools: Array<{ name: string; mcpName: string }>;
  };
}

function PureToolsButton({ userTools }: ToolsButtonProps) {
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
              <span>Herramientas</span>
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
            <h3 className="font-medium text-sm">Herramientas disponibles (en desarrollo)</h3>
          </div>
          <div className="max-h-[300px] overflow-y-auto p-2">
            {userTools.tools.length === 0 ? (
              <div className="py-3 px-2 text-sm text-muted-foreground text-center">
                No hay herramientas disponibles
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
}

export const ToolsButton = memo(PureToolsButton, (prevProps, nextProps) => {
  return equal(prevProps.userTools, nextProps.userTools);
});

// Botón de nueva conversación
interface NewConversationButtonProps {
  handleNewConversation: () => Promise<void>;
  disabled: boolean;
}

function PureNewConversationButton({ handleNewConversation, disabled }: NewConversationButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async (event: React.MouseEvent) => {
    event.preventDefault();
    setIsLoading(true);
    try {
      await handleNewConversation();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          data-testid="new-conversation-button"
          className="rounded-full flex items-center gap-2 px-3 py-2 h-fit text-sm border border-input bg-background hover:bg-muted text-foreground ml-1"
          onClick={handleClick}
          disabled={disabled || isLoading}
          variant="ghost"
        >
          {isLoading ? (
            <Loader size={16} className="animate-spin" />
          ) : (
            <PlusCircleIcon size={16} />
          )}
          <span>Nueva conversación</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>Nueva conversación</p>
      </TooltipContent>
    </Tooltip>
  );
}

export const NewConversationButton = memo(PureNewConversationButton);

// Proveedor de Tooltip para envolver todos los botones
export function TooltipButtonProvider({ children }: { children: React.ReactNode }) {
  return <TooltipProvider>{children}</TooltipProvider>;
} 