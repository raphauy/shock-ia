import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from '@/hooks/use-toast';
import type { Message } from 'ai';
import { CopyIcon } from 'lucide-react';
import { memo, type MouseEvent, type FocusEvent } from 'react';
import { useCopyToClipboard } from 'usehooks-ts';
import { Badge } from '../ui/badge';

export function PureMessageActions({
  message,
  isLoading,
  promptTokens,
  completionTokens,
}: {
  message: Message;
  isLoading: boolean;
  promptTokens: number;
  completionTokens: number;
}) {
  const [_, copyToClipboard] = useCopyToClipboard();

  if (isLoading) return null;
  if (message.role === 'user') return null;

  // Detiene la propagación de eventos para evitar que se active el scroll automático
  const handleMouseEnter = (e: MouseEvent) => {
    e.stopPropagation();
  };

  const handleFocus = (e: FocusEvent) => {
    e.stopPropagation();
  };

  const totalTokens= promptTokens + completionTokens

  return (
    <TooltipProvider delayDuration={0}>
      <div 
        className="flex flex-row gap-2 ml-10 message-action-container"
        onMouseEnter={handleMouseEnter}
        onFocus={handleFocus}
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              className="py-1 px-2 h-fit text-muted-foreground"
              variant="outline"
              onClick={async (e) => {
                e.stopPropagation(); // Prevenir propagación del evento click
                
                const textFromParts = message.parts
                  ?.filter((part) => part.type === 'text')
                  .map((part) => (part as { text: string }).text)
                  .join('\n')
                  .trim();

                if (!textFromParts) {
                  toast({
                    title: 'Error',
                    description: "No hay texto para copiar!",
                  });
                  return;
                }

                await copyToClipboard(textFromParts);
                toast({
                  title: 'Copiado!',
                  description: 'Copiado al portapapeles!',
                });
              }}
            >
              <CopyIcon className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Copiar</TooltipContent>
        </Tooltip>

        {
          totalTokens > 0 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="outline">{totalTokens}</Badge>
              </TooltipTrigger>
              <TooltipContent>
                <div className='flex gap-2'>
                  <Badge variant="archived">In: {promptTokens}</Badge>
                  <Badge variant="archived">Out: {completionTokens}</Badge>
                  <Badge>Total: {totalTokens}</Badge>
                </div>

              </TooltipContent>
            </Tooltip>
        )}
        </div>
    </TooltipProvider>
  );
}

export const MessageActions = memo(
  PureMessageActions,
  (prevProps, nextProps) => {
    if (prevProps.isLoading !== nextProps.isLoading) return false;

    return true;
  },
);
