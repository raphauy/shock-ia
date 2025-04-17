"use client"

import { EventLogDAO } from "@/services/event-log-services";
import { format, formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import CodeBlock from "@/components/code-block";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import { useState, useEffect } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";

interface EventLogListProps {
  eventLogs: EventLogDAO[];
}

export default function EventLogList({ eventLogs }: EventLogListProps) {
  if (eventLogs.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No se encontraron registros con los filtros seleccionados
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {eventLogs.map((log) => (
        <EventLogCard key={log.id} log={log} />
      ))}
    </div>
  );
}

function EventLogCard({ log }: { log: EventLogDAO }) {
  const [formattedDate, setFormattedDate] = useState<string>("");
  const exactDate = format(new Date(log.createdAt), "dd/MM/yyyy HH:mm:ss", { locale: es });

  // Parsear metadata si es un string
  const metadataObj = typeof log.metadata === 'string' 
    ? JSON.parse(log.metadata) 
    : log.metadata;

  useEffect(() => {
    const updateFormattedDate = () => {
      const distance = formatDistanceToNow(new Date(log.createdAt), {
        addSuffix: true,
        locale: es
      });
      setFormattedDate(distance);
    };
    updateFormattedDate();
  }, [log.createdAt]);

  // Título del Collapsible
  let collapsibleTitle = "";
  if (Array.isArray(metadataObj)) {
    if (log.eventType === 'SET_CONVERSATION_AS_PENDING') {
      collapsibleTitle = `Se reactivaron ${metadataObj.length} conversacion${metadataObj.length === 1 ? '' : 'es'} en Chatwoot`;
    } else {
      collapsibleTitle = `Array de ${metadataObj.length} elemento${metadataObj.length === 1 ? '' : 's'}`;
    }
  } else if (typeof metadataObj === 'object' && metadataObj !== null) {
    const keys = Object.keys(metadataObj);
    const preview = keys.slice(0, 4).map(key => {
      let value = metadataObj[key];
      if (typeof value === 'object' && value !== null) value = '[obj]';
      if (typeof value === 'string') value = value.length > 30 ? value.slice(0, 30) + '…' : value;
      return `${key}: ${value}`;
    }).join(", ");
    collapsibleTitle = `{ ${preview}${keys.length > 4 ? ', ...' : ''} }`;
  } else {
    collapsibleTitle = String(metadataObj);
  }

  return (
    <Card className="overflow-hidden hover:shadow-sm transition-shadow">
      <CardContent className="p-3">
        <div className="flex flex-col gap-2">
          {/* Fila 1: Badges y fecha en grid de 3 columnas en desktop */}
          <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-2 min-h-[32px] w-full">
            <div>
              <Badge variant="secondary" className="text-blue-800">
                {log.clientName}
              </Badge>
            </div>
            <div>
              <Badge variant="secondaryWithBorder" className="font-medium">
                {log.eventType}
              </Badge>
            </div>
            <div className="md:justify-self-end">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="text-sm text-muted-foreground flex items-center gap-1 cursor-help whitespace-nowrap">
                      <CalendarIcon className="h-3.5 w-3.5" />
                      {formattedDate}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{exactDate}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
          {/* Fila 2: Collapsible */}
          <Collapsible>
            <div className="flex items-center justify-between">
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="px-2 h-7 flex-1 flex justify-between items-center">
                  {Array.isArray(metadataObj) ? (
                    <span className="font-mono text-xs text-left pr-2">{collapsibleTitle}</span>
                  ) : (
                    <span className="font-mono text-xs text-left pr-2 truncate w-full" style={{display: 'block'}}>{collapsibleTitle}</span>
                  )}
                  <ChevronDownIcon className="h-4 w-4 ml-2 transition-transform data-[state=open]:rotate-180" />
                </Button>
              </CollapsibleTrigger>
            </div>
            <CollapsibleContent>
              <div className="pt-2 border-t mt-2">
                <div className="rounded overflow-hidden text-xs">
                  <CodeBlock
                    code={JSON.stringify(metadataObj, null, 2)}
                    showLineNumbers={false}                    
                  />
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </CardContent>
    </Card>
  );
} 