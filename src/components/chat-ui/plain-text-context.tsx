'use client';

import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Copy, CheckCheck } from 'lucide-react';
import { useState } from 'react';

interface PlainTextContextProps {
  systemMessage: string;
}

export function PlainTextContext({ systemMessage }: PlainTextContextProps) {
  const [copied, setCopied] = useState(false);
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(systemMessage)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(err => {
        console.error('Error al copiar texto: ', err);
      });
  };
  
  // Función para resaltar solo las etiquetas XML
  const highlightXmlTags = (text: string) => {
    if (!text) return '';
    
    // Aseguramos que no haya problemas con el renderizado HTML
    const safeText = text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    
    // Solo resaltamos las etiquetas XML, dejando el resto del texto sin cambios
    const highlightedText = safeText.replace(
      /&lt;[^&]*?&gt;/g, 
      '<span class="text-blue-600 dark:text-blue-400">$&</span>'
    );
    
    return highlightedText;
  };
  
  return (
    <div className="relative">
      <ScrollArea className="h-[60vh] w-full rounded-md border">
        <pre 
          className="whitespace-pre-wrap font-mono p-4 text-sm"
          dangerouslySetInnerHTML={{ __html: highlightXmlTags(systemMessage) }}
        />
      </ScrollArea>
      
      <Button 
        size="sm"
        variant="ghost" 
        onClick={copyToClipboard}
        className="absolute top-2 right-2 h-8 w-8 p-0 rounded-full"
        aria-label="Copiar al portapapeles"
      >
        {copied ? (
          <CheckCheck className="h-4 w-4 text-green-500" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
        <span className="sr-only">Copiar al portapapeles</span>
      </Button>
    </div>
  );
}
