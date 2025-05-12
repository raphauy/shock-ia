'use client';

import { useRouter } from 'next/navigation';
import { useWindowSize } from 'usehooks-ts';

import { ModelSelector } from '@/components/chat-ui/model-selector';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { PlusIcon } from 'lucide-react';
import { memo } from 'react';

function PureChatHeader({
  selectedModelId,
}: {
  selectedModelId: string;
}) {
  const router = useRouter();

  const { width: windowWidth } = useWindowSize();

  return (
    <header className="flex sticky top-0 bg-background py-1.5 items-center px-2 md:px-2 gap-2">

      {(windowWidth < 768) && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              className="order-2 md:order-1 md:px-2 px-2 md:h-fit ml-auto md:ml-0"
              onClick={() => {
                router.push('/');
                router.refresh();
              }}
            >
              <PlusIcon />
              <span className="md:sr-only">Nuevo Chat</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Nuevo Chat</TooltipContent>
        </Tooltip>
      )}

      <ModelSelector
        selectedModelId={selectedModelId}
        className="order-1 md:order-2"
      />

    </header>
  );
}

export const ChatHeader = memo(PureChatHeader, (prevProps, nextProps) => {
  return prevProps.selectedModelId === nextProps.selectedModelId;
});
