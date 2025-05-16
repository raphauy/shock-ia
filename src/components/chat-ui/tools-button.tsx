'use client';

import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { UiGroupToolData } from '@/lib/ai/tools';
import equal from 'fast-deep-equal';
import { Info, Wrench } from 'lucide-react';
import React, { memo, useState } from 'react';

// Función para truncar texto
const truncateText = (text: string, maxLength: number) => {
  if (!text) return '';
  return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
};

// Botón de herramientas
interface ToolsButtonProps {
  uiGroupsTools: UiGroupToolData[];
}

function PureToolsButton({ uiGroupsTools }: ToolsButtonProps) {
  const [open, setOpen] = useState(false);
  const totalTools = uiGroupsTools.reduce((acc, group) => acc + group.tools.length, 0);

  return (
    <Tooltip>
      <Popover open={open} onOpenChange={setOpen}>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              disabled={totalTools === 0}
              className="rounded-full flex items-center gap-2 px-3 py-2 h-fit text-sm border border-input bg-background hover:bg-muted text-foreground ml-1"
            >
              <Wrench size={16} />
              <span>Herramientas</span>
              {totalTools > 0 && (
                <span className="bg-accent-foreground text-accent rounded-full size-5 min-w-5 flex items-center justify-center text-[10px] font-medium">
                  {totalTools}
                </span>
              )}
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <PopoverContent className="max-w-3xl w-[550px] p-0" align="start" sideOffset={8}>
          <div className="p-4 bg-accent/30 border-b flex items-center justify-between">
            <h3 className="font-semibold text-sm">Herramientas disponibles</h3>
            <span className="text-xs text-muted-foreground">{totalTools} herramientas</span>
          </div>
          <ScrollArea className="h-[400px]">
            <div className="p-4">
              {uiGroupsTools.length === 0 ? (
                <div className="py-6 text-sm text-muted-foreground text-center flex flex-col items-center gap-2">
                  <Info size={24} className="text-muted-foreground/70" />
                  <p>No hay herramientas disponibles</p>
                </div>
              ) : (
                <div className="space-y-5">
                  {uiGroupsTools.map((uiGroupTool, groupIndex) => (
                    <div key={`${uiGroupTool.groupName}-${groupIndex}`} className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-md text-primary border-l-4 border-primary pl-2">
                          {uiGroupTool.groupName}
                        </h4>
                        <span className="bg-primary/90 text-primary-foreground rounded-full size-5 min-w-5 flex items-center justify-center text-[10px] font-medium">
                          {uiGroupTool.tools.length}
                        </span>
                      </div>
                      
                      <div className="space-y-1">
                        {uiGroupTool.tools.map((tool, toolIndex) => (
                          <div
                            key={`${tool.name}-${toolIndex}`}
                            className="py-1.5 px-3 text-sm border-b border-border/30 hover:bg-accent/10 transition-colors flex items-center gap-2"
                          >
                            <div className="font-medium text-primary/90 whitespace-nowrap">
                              {tool.name}
                            </div>
                            {tool.description && (
                              <div className="text-xs text-muted-foreground truncate">
                                {truncateText(tool.description, 70)}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
        </PopoverContent>
      </Popover>
      <TooltipContent>
        <p>Herramientas disponibles</p>
      </TooltipContent>
    </Tooltip>
  );
}

export const ToolsButton = memo(PureToolsButton, (prevProps, nextProps) => {
  return equal(prevProps.uiGroupsTools, nextProps.uiGroupsTools);
}); 