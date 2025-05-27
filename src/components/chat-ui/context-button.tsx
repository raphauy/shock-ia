'use client';

import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { InfoIcon } from 'lucide-react';
import { memo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ContextDisplay } from './context-display';
import { PlainTextContext } from './plain-text-context';

interface ContextButtonProps {
  systemMessage: string;
}

function PureContextButton({ systemMessage }: ContextButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Tooltip>
        <DialogTrigger asChild>
          <TooltipTrigger asChild>
            <Button
              data-testid="context-button"
              className="rounded-full flex items-center gap-2 px-3 py-2 h-fit text-sm border border-input bg-background hover:bg-muted text-foreground ml-1"
              variant="ghost"
            >
              <InfoIcon size={16} />
              <span>Contexto</span>
            </Button>
          </TooltipTrigger>
        </DialogTrigger>
        <TooltipContent>
          <p>Ver contexto del agente</p>
        </TooltipContent>
      </Tooltip>
      
      <DialogContent className="sm:max-w-2xl max-h-[80vh]">
        <DialogHeader className="pr-6">
          <DialogTitle className="text-xl flex items-center gap-2">
            <InfoIcon className="h-5 w-5" />
            Contexto del agente
          </DialogTitle>
          <DialogDescription>
            Información que define el comportamiento y conocimiento del asistente
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="structured" className="w-full">
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="structured">Estructurado</TabsTrigger>
            <TabsTrigger value="plain">Texto plano</TabsTrigger>
          </TabsList>
          
          <TabsContent value="structured" className="mt-0">
            <ContextDisplay systemMessage={systemMessage} />
          </TabsContent>
          
          <TabsContent value="plain" className="mt-0">
            <PlainTextContext systemMessage={systemMessage} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

export const ContextButton = memo(PureContextButton); 