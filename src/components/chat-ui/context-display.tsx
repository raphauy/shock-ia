'use client';

import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertTriangle, User, Code, FileText, Info, CalendarDays, Repeat, CalendarClock, BookOpen } from 'lucide-react';
import { ContextSection } from './context-section';

interface ContextDisplayProps {
  systemMessage: string;
}

interface Section {
  title: string;
  content: string;
  icon: React.ReactNode;
  defaultOpen?: boolean;
  type?: 'normal' | 'documents';
}

export function ContextDisplay({ systemMessage }: ContextDisplayProps) {
  const sections: Section[] = extractSections(systemMessage);

  return (
    <ScrollArea className="h-[60vh] w-full rounded-md">
      <div className="space-y-2 p-2">
        {sections.map((section, index) => (
          <ContextSection 
            key={index} 
            title={section.title} 
            content={section.content} 
            icon={section.icon}
            defaultOpen={section.defaultOpen}
            type={section.type}
          />
        ))}
      </div>
    </ScrollArea>
  );
}

function extractSections(systemMessage: string): Section[] {
  const sections: Section[] = [];
  
  // Patrones para identificar secciones
  const sectionPatterns = [
    { 
      name: 'Importante', 
      startTag: '<Importante>', 
      endTag: '</Importante>',
      icon: <AlertTriangle className="h-4 w-4 text-amber-500" />,
      defaultOpen: false
    },
    { 
      name: 'Prompt del cliente', 
      startTag: '<Prompt del cliente>', 
      endTag: '</Prompt del cliente>',
      icon: <User className="h-4 w-4 text-blue-500" />
    },
    { 
      name: 'Contexto técnico', 
      startTag: '<Contexto técnico>', 
      endTag: '</Contexto técnico>',
      icon: <Code className="h-4 w-4 text-green-500" />
    },
    { 
      name: 'Información del Contacto', 
      startTag: '<Información del Contacto>', 
      endTag: '</Información del Contacto>',
      icon: <User className="h-4 w-4 text-purple-500" />
    },
    { 
      name: 'Eventos Repetitivos', 
      startTag: '<Eventos Repetitivos>', 
      endTag: '</Eventos Repetitivos>',
      icon: <Repeat className="h-4 w-4 text-indigo-400" />,
      type: 'documents'
    },
    { 
      name: 'Eventos de tipo Única vez', 
      startTag: '<Eventos de tipo Única vez>', 
      endTag: '</Eventos de tipo Única vez>',
      icon: <CalendarClock className="h-4 w-4 text-teal-500" />,
      type: 'documents'
    },
    { 
      name: 'Reservas', 
      startTag: '<Reservas>', 
      endTag: '</Reservas>',
      icon: <BookOpen className="h-4 w-4 text-pink-500" />,
      type: 'documents'
    },
    { 
      name: 'Documentos', 
      startTag: '<Documentos>', 
      endTag: '</Documentos>',
      icon: <FileText className="h-4 w-4 text-orange-500" />,
      type: 'documents'
    }
  ];
  
  // Extraer cada sección
  for (const pattern of sectionPatterns) {
    const startIndex = systemMessage.indexOf(pattern.startTag);
    if (startIndex !== -1) {
      const contentStartIndex = startIndex + pattern.startTag.length;
      const endIndex = systemMessage.indexOf(pattern.endTag, contentStartIndex);
      
      if (endIndex !== -1) {
        const content = systemMessage.substring(contentStartIndex, endIndex).trim();
        sections.push({
          title: pattern.name,
          content,
          icon: pattern.icon,
          defaultOpen: pattern.defaultOpen,
          type: pattern.type as 'normal' | 'documents'
        });
      }
    }
  }
  
  // Si no se encontró ninguna sección estructurada, mostrar todo el contenido como una sección
  if (sections.length === 0) {
    sections.push({
      title: 'Contexto del sistema',
      content: systemMessage,
      icon: <Info className="h-4 w-4 text-blue-500" />,
      defaultOpen: true
    });
  }
  
  return sections;
} 