import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";
import Link from "next/link";
import { getConversationsAction } from "./actions";
import { ConversationCard } from "./conversation-card";
import { ConversationsSearchBar } from "./conversations-search-bar";
import { Pagination } from "./pagination";

interface ConversationsListProps {
  clientId: string;
  slug: string;
  currentPage: number;
  selectedId?: string;
  search?: string;
}

export async function ConversationsList({
  clientId,
  slug,
  currentPage,
  selectedId,
  search
}: ConversationsListProps) {
  // URL base para la búsqueda y paginación
  const baseUrl = `/client/${slug}/crm/conversations-pro`;

  // Obtener conversaciones para la página actual
  const conversationsResult = await getConversationsAction(clientId, currentPage, 10, search);
  const conversations = conversationsResult.success && conversationsResult.data ? conversationsResult.data : [];
  const errorMessage = conversationsResult.success ? undefined : conversationsResult.error;
  const meta = conversationsResult.meta;

  // Si hay un error, mostrarlo
  if (errorMessage) {
    return (
      <div className="flex flex-col h-full">
        {/* Buscador */}
        <div className="p-3 border-b">
          <ConversationsSearchBar baseUrl={baseUrl} initialSearch={search} />
        </div>
        <div className="flex flex-col items-center justify-center flex-grow p-4 text-center">
          <div className="w-full p-4 border border-destructive rounded-md bg-destructive/10 text-destructive">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-5 w-5" />
              <h3 className="font-semibold">Error de conexión</h3>
            </div>
            <p className="text-sm">{errorMessage}</p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-4"
            asChild
          >
            <Link href={baseUrl}>Reintentar</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Si no hay conversaciones, mostrar mensaje
  if (conversations.length === 0) {
    return (
      <div className="flex flex-col h-full">
        {/* Buscador */}
        <div className="p-3 border-b">
          <ConversationsSearchBar baseUrl={baseUrl} initialSearch={search} />
        </div>
        <div className="flex flex-col items-center justify-center flex-grow p-4 text-center">
          <p className="text-muted-foreground">No hay conversaciones</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col overflow-y-auto h-full">
      {/* Buscador */}
      <div className="p-3 border-b">
        <ConversationsSearchBar baseUrl={baseUrl} initialSearch={search} />
      </div>
      {/* Lista de conversaciones */}
      <div className="flex-grow">
        <div className="p-1 space-y-2">
          {conversations.map(conversation => (
            <Link 
              key={conversation.id}
              href={`${baseUrl}?id=${conversation.id}${currentPage > 1 ? `&page=${currentPage}` : ''}`}
              className="block"
            >
              <ConversationCard
                conversation={conversation}
                isSelected={conversation.id === selectedId}
                slug={slug}
              />
            </Link>
          ))}
        </div>
      </div>
      {/* Paginación fija en la parte inferior */}
      {meta && meta.totalPages > 1 && (
        <div className="border-t p-2 bg-muted/20">
          <div className="text-xs text-muted-foreground mb-1 text-center">
            Página {meta.currentPage} de {meta.totalPages} ({meta.totalCount} conversaciones)
          </div>
          <Pagination
            currentPage={meta.currentPage}
            totalPages={meta.totalPages}
            slug={slug}
            selectedId={selectedId}
          />
        </div>
      )}
    </div>
  );
}

// Skeleton para Suspense
export function ConversationsListSkeleton() {
  return (
    <div className="flex flex-col overflow-y-auto">
      <div className="p-3 border-b">
        <div className="flex gap-2">
          <Skeleton className="h-9 flex-grow" />
          <Skeleton className="h-9 w-9" />
        </div>
      </div>
      <div className="flex-grow">
        <div className="p-1 space-y-2">
          {Array(6).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
} 