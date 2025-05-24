import { Skeleton } from '@/components/ui/skeleton';
import { getConversationMessages, convertToUIMessages } from '@/services/conversation-v2-services';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
import { ClientMessagesView } from './client-messages-view';

interface ConversationMessagesProps {
  conversationId?: string;
  slug: string;
}

export async function ConversationMessages({ conversationId, slug }: ConversationMessagesProps) {
  // Si no hay conversación seleccionada, mostrar mensaje de selección
  if (!conversationId) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center">
        <h2 className="text-2xl font-medium mb-2">Selecciona una conversación</h2>
        <p className="text-muted-foreground">Elige una conversación del panel izquierdo para ver los mensajes</p>
      </div>
    );
  }

  // Obtener los mensajes de la conversación seleccionada
  try {
    const messagesFromDb = await getConversationMessages(conversationId, 100); // Obtener hasta 100 mensajes
    
    // Si no hay mensajes, mostrar un mensaje informativo
    if (messagesFromDb.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-6 text-center">
          <h2 className="text-2xl font-medium mb-2">Conversación vacía</h2>
          <p className="text-muted-foreground">Esta conversación no tiene mensajes</p>
        </div>
      );
    }
    
    // Convertir los mensajes al formato que espera el componente Messages
    const messages = convertToUIMessages(messagesFromDb);
    
    // Usar ClientMessagesView para renderizar los mensajes
    return <ClientMessagesView messages={messages} slug={slug} conversationId={conversationId} />;
  } catch (error) {
    console.error("Error cargando mensajes:", error);
    return (
      <div className="flex flex-col items-center justify-center h-full p-6">
        <Card className="max-w-md w-full bg-destructive/10 text-destructive border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-5 w-5" />
              <h3 className="font-semibold">Error al cargar los mensajes</h3>
            </div>
            <p className="text-sm">{error instanceof Error ? error.message : "Error desconocido"}</p>
          </CardContent>
        </Card>
      </div>
    );
  }
}

// Skeleton para Suspense
export function ConversationMessagesSkeleton() {
  return (
    <div className="h-full flex flex-col p-4 space-y-4">
      <div className="flex items-start gap-2 w-3/4">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-24 w-full rounded-lg" />
        </div>
      </div>
      
      <div className="flex items-start gap-2 self-end w-3/4">
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-20 ml-auto" />
          <Skeleton className="h-16 w-full rounded-lg" />
        </div>
        <Skeleton className="h-10 w-10 rounded-full" />
      </div>
      
      <div className="flex items-start gap-2 w-3/4">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-20 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
} 