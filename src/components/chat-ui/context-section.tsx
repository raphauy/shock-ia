'use client';

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ChevronRight, AlertCircle, Book, Code, Calendar, Clock, MapPin } from 'lucide-react';
import { useState } from 'react';

interface ContextSectionProps { 
  title: string; 
  content: string; 
  icon: React.ReactNode;
  defaultOpen?: boolean;
  type?: 'normal' | 'documents';
}

export function ContextSection({
  title, 
  content, 
  icon, 
  defaultOpen = false,
  type = 'normal'
}: ContextSectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  const [hasError, setHasError] = useState(false);

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className="border rounded-md"
    >
      <CollapsibleTrigger className="flex items-center justify-between w-full p-4 text-left font-medium bg-muted/50 hover:bg-muted transition-colors">
        <div className="flex items-center gap-2">
          {icon}
          <span>{title}</span>
        </div>
        <ChevronRight className={`h-4 w-4 transition-transform ${open ? 'transform rotate-90' : ''}`} />
      </CollapsibleTrigger>
      <CollapsibleContent className="p-4 pt-2 text-sm">
        {hasError ? (
          <div className="p-4 border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900 rounded-md">
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <AlertCircle className="h-4 w-4" />
              <span className="font-medium">Error al procesar esta sección</span>
            </div>
            <div className="mt-2 whitespace-pre-wrap">{content}</div>
          </div>
        ) : (
          <>
            {type === 'documents' ? (
              <StructuredSection 
                title={title}
                content={content} 
                onError={() => setHasError(true)} 
              />
            ) : (
              <div className="whitespace-pre-wrap">{content}</div>
            )}
          </>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}

function StructuredSection({ 
  title,
  content, 
  onError 
}: { 
  title: string;
  content: string; 
  onError: () => void;
}) {
  try {
    // Determinar el tipo de contenido basado en el título
    if (title.includes('Documento')) {
      const documents = extractDocumentsFromText(content);
      if (documents.length > 0) {
        return <DocumentsList documents={documents} />;
      }
    } else if (title.includes('Eventos Repetitivos')) {
      const events = extractEventsFromText(content);
      if (events.length > 0) {
        return <EventsList events={events} type="repetitive" />;
      }
    } else if (title.includes('Eventos de tipo Única vez')) {
      const events = extractEventsFromText(content);
      if (events.length > 0) {
        return <EventsList events={events} type="fixed" />;
      }
    } else if (title.includes('Reservas')) {
      const bookings = extractBookingsFromText(content);
      if (bookings.length > 0) {
        return <BookingsList bookings={bookings} />;
      }
    }

    // Si no hay contenido estructurado o no se pudo extraer, mostrar como texto
    return <div className="whitespace-pre-wrap">{content}</div>;
  } catch (error) {
    console.error("Error rendering structured section:", error);
    onError();
    return <div className="whitespace-pre-wrap">{content}</div>;
  }
}

interface Document {
  docId: string;
  docName: string;
  docDescription: string;
}

function DocumentsList({ documents }: { documents: Document[] }) {
  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground mb-2">
        {documents.length} documentos disponibles
      </div>
      
      <div className="grid grid-cols-1 gap-3">
        {documents.map((doc, index) => (
          <div key={index} className="border rounded-md p-3 bg-muted/30 transition-colors hover:bg-muted/50">
            <div className="flex items-center gap-2 mb-2 font-medium text-primary">
              <Book className="h-4 w-4" />
              {doc.docName}
            </div>
            <div className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
              <Code className="h-3 w-3" />
              <span>ID: {doc.docId}</span>
            </div>
            <div className="text-sm mt-2">{doc.docDescription}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface Event {
  eventId: string;
  eventName: string;
  eventDescription: string;
  eventAddress: string;
  timezone: string;
  duration?: number;
  startDateTime?: string;
  endDateTime?: string;
  seatsAvailable?: number;
  seatsTotal?: number;
  metadata?: string;
}

function EventsList({ events, type }: { events: Event[], type: 'repetitive' | 'fixed' }) {
  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground mb-2">
        {events.length} eventos {type === 'repetitive' ? 'repetitivos' : 'de fecha fija'} disponibles
      </div>
      
      <div className="grid grid-cols-1 gap-3">
        {events.map((event, index) => (
          <div key={index} className="border rounded-md p-3 bg-muted/30 transition-colors hover:bg-muted/50">
            <div className="flex items-center gap-2 mb-2 font-medium text-primary">
              <Calendar className="h-4 w-4" />
              {event.eventName}
            </div>
            
            <div className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
              <Code className="h-3 w-3" />
              <span>ID: {event.eventId}</span>
            </div>
            
            {event.eventDescription && (
              <div className="text-sm mt-2 mb-2">{event.eventDescription}</div>
            )}
            
            {event.eventAddress && (
              <div className="text-xs flex items-center gap-1 mb-1">
                <MapPin className="h-3 w-3 text-gray-500" />
                <span>{event.eventAddress}</span>
              </div>
            )}
            
            {type === 'fixed' && event.startDateTime && event.endDateTime && (
              <div className="text-xs flex items-center gap-1 mb-1">
                <Clock className="h-3 w-3 text-gray-500" />
                <span>Desde {event.startDateTime} hasta {event.endDateTime}</span>
              </div>
            )}
            
            {type === 'fixed' && event.seatsAvailable !== undefined && event.seatsTotal !== undefined && (
              <div className="text-xs mt-1">
                <span className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 px-2 py-0.5 rounded">
                  {event.seatsAvailable} de {event.seatsTotal} cupos disponibles
                </span>
              </div>
            )}
            
            {type === 'repetitive' && event.duration !== undefined && (
              <div className="text-xs mt-1">
                <span className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 px-2 py-0.5 rounded">
                  Duración: {event.duration} minutos
                </span>
              </div>
            )}
            
            {event.timezone && (
              <div className="text-xs text-muted-foreground mt-2">
                Zona horaria: {event.timezone}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

interface Booking {
  event: string;
  bookingId: string;
  bookingName: string;
  bookingSeats: number;
  bookingStatus: string;
  bookingDate: string;
}

function BookingsList({ bookings }: { bookings: Booking[] }) {
  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground mb-2">
        {bookings.length} reservas activas
      </div>
      
      <div className="grid grid-cols-1 gap-3">
        {bookings.map((booking, index) => (
          <div key={index} className="border rounded-md p-3 bg-muted/30 transition-colors hover:bg-muted/50">
            <div className="flex items-center gap-2 mb-2 font-medium text-primary">
              <Calendar className="h-4 w-4" />
              {booking.event} - {booking.bookingName}
            </div>
            
            <div className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
              <Code className="h-3 w-3" />
              <span>ID: {booking.bookingId}</span>
            </div>
            
            <div className="text-xs flex items-center gap-1 mb-1">
              <Clock className="h-3 w-3 text-gray-500" />
              <span>Fecha: {booking.bookingDate}</span>
            </div>
            
            <div className="text-xs flex items-center gap-2 mt-2">
              <span className={`px-2 py-0.5 rounded ${
                booking.bookingStatus.toLowerCase() === 'confirmed' 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                  : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
              }`}>
                {booking.bookingStatus}
              </span>
              
              <span className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 px-2 py-0.5 rounded">
                {booking.bookingSeats} {booking.bookingSeats === 1 ? 'cupo' : 'cupos'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Extrae documentos del texto utilizando el método más fiable
function extractDocumentsFromText(text: string): Document[] {
  try {
    const documents: Document[] = [];
    
    // Iteramos por cada par de llaves para extraer los documentos
    const entries = text.split("},");
    
    for (const entry of entries) {
      const docIdMatch = entry.match(/docId:\s*"([^"]+)"/);
      const docNameMatch = entry.match(/docName:\s*"([^"]+)"/);
      const docDescMatch = entry.match(/docDescription:\s*"([^"]+)"/);
      
      if (docIdMatch && docNameMatch && docDescMatch) {
        documents.push({
          docId: docIdMatch[1],
          docName: docNameMatch[1],
          docDescription: docDescMatch[1]
        });
      }
    }
    
    if (documents.length > 0) {
      return documents;
    }
    
    // Enfoque alternativo con regex separados
    const docIdMatches = text.match(/docId:\s*"([^"]+)"/g) || [];
    const docIdValues = docIdMatches.map(m => {
      const match = m.match(/"([^"]+)"/);
      return match ? match[1] : '';
    }).filter(Boolean);
    
    const docNameMatches = text.match(/docName:\s*"([^"]+)"/g) || [];
    const docNameValues = docNameMatches.map(m => {
      const match = m.match(/"([^"]+)"/);
      return match ? match[1] : '';
    }).filter(Boolean);
    
    const docDescMatches = text.match(/docDescription:\s*"([^"]+)"/g) || [];
    const docDescValues = docDescMatches.map(m => {
      const match = m.match(/"([^"]+)"/);
      return match ? match[1] : '';
    }).filter(Boolean);
    
    const count = Math.min(docIdValues.length, docNameValues.length, docDescValues.length);
    
    for (let i = 0; i < count; i++) {
      documents.push({
        docId: docIdValues[i],
        docName: docNameValues[i],
        docDescription: docDescValues[i]
      });
    }
    
    return documents;
  } catch (error) {
    console.error("Error extracting documents:", error);
    return [];
  }
}

// Extrae eventos del texto
function extractEventsFromText(text: string): Event[] {
  try {
    const events: Event[] = [];
    const eventBlocks = text.split(/{/).filter(block => block.includes('eventId'));
    
    for (const block of eventBlocks) {
      // Extraer datos básicos del evento
      const eventIdMatch = block.match(/eventId:\s*"([^"]+)"/);
      const eventNameMatch = block.match(/eventName:\s*"([^"]+)"/);
      const eventDescMatch = block.match(/eventDescription:\s*"([^"]+)"/);
      const eventAddressMatch = block.match(/eventAddress:\s*"([^"]+)"/);
      const timezoneMatch = block.match(/timezone:\s*"([^"]+)"/);
      
      if (eventIdMatch && eventNameMatch) {
        const event: Event = {
          eventId: eventIdMatch[1],
          eventName: eventNameMatch[1],
          eventDescription: eventDescMatch ? eventDescMatch[1] : '',
          eventAddress: eventAddressMatch ? eventAddressMatch[1] : '',
          timezone: timezoneMatch ? timezoneMatch[1] : '',
        };
        
        // Extraer datos adicionales según el tipo de evento
        const durationMatch = block.match(/duration:\s*(\d+)/);
        if (durationMatch) {
          event.duration = parseInt(durationMatch[1]);
        }
        
        const startDateTimeMatch = block.match(/startDateTime:\s*"([^"]+)"/);
        if (startDateTimeMatch) {
          event.startDateTime = startDateTimeMatch[1];
        }
        
        const endDateTimeMatch = block.match(/endDateTime:\s*"([^"]+)"/);
        if (endDateTimeMatch) {
          event.endDateTime = endDateTimeMatch[1];
        }
        
        const seatsAvailableMatch = block.match(/seatsAvailable:\s*(\d+)/);
        if (seatsAvailableMatch) {
          event.seatsAvailable = parseInt(seatsAvailableMatch[1]);
        }
        
        const seatsTotalMatch = block.match(/seatsTotal:\s*(\d+)/);
        if (seatsTotalMatch) {
          event.seatsTotal = parseInt(seatsTotalMatch[1]);
        }
        
        // Extraer metadata si existe
        const metadataMatch = block.match(/metadata:\s*({[^}]+})/);
        if (metadataMatch) {
          event.metadata = metadataMatch[1];
        }
        
        events.push(event);
      }
    }
    
    return events;
  } catch (error) {
    console.error("Error extracting events:", error);
    return [];
  }
}

// Extrae reservas del texto
function extractBookingsFromText(text: string): Booking[] {
  try {
    const bookings: Booking[] = [];
    
    if (text.includes("Este contacto no tiene reservas activas")) {
      return [];
    }
    
    const bookingBlocks = text.split(/{/).filter(block => block.includes('bookingId'));
    
    for (const block of bookingBlocks) {
      const eventMatch = block.match(/event:\s*"([^"]+)"/);
      const bookingIdMatch = block.match(/bookingId:\s*"([^"]+)"/);
      const bookingNameMatch = block.match(/bookingName:\s*"([^"]+)"/);
      const bookingSeatsMatch = block.match(/bookingSeats:\s*(\d+)/);
      const bookingStatusMatch = block.match(/bookingStatus:\s*"([^"]+)"/);
      const bookingDateMatch = block.match(/bookingDate:\s*"([^"]+)"/);
      
      if (bookingIdMatch && eventMatch) {
        bookings.push({
          event: eventMatch[1],
          bookingId: bookingIdMatch[1],
          bookingName: bookingNameMatch ? bookingNameMatch[1] : '',
          bookingSeats: bookingSeatsMatch ? parseInt(bookingSeatsMatch[1]) : 1,
          bookingStatus: bookingStatusMatch ? bookingStatusMatch[1] : 'Pending',
          bookingDate: bookingDateMatch ? bookingDateMatch[1] : '',
        });
      }
    }
    
    return bookings;
  } catch (error) {
    console.error("Error extracting bookings:", error);
    return [];
  }
} 