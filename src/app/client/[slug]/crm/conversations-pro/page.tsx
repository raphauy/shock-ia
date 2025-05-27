import { getCurrentUser } from "@/lib/auth";
import { getClientBySlug } from "@/services/clientService";
import { ConversationsList, ConversationsListSkeleton } from "./conversations-list";
import { ConversationMessages, ConversationMessagesSkeleton } from "./conversation-messages";
import { DatabaseError } from "@/components/error-ui/database-error";
import { Pagination } from "./pagination";
import { Suspense } from "react";

type Props = {
  params: Promise<{ 
    slug: string
  }>,
  searchParams: Promise<{
    page?: string,
    id?: string,
    search?: string
  }>
}

export default async function ConversationsProPage(props: Props) {
  const params = await props.params;
  const { slug } = params;
  
  const searchParams = await props.searchParams;
  const { page = "1", id, search } = searchParams;
  
  const currentPage = parseInt(page);

  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return <div>Debes estar logueado para acceder a esta página</div>
    }
    if (!currentUser.email) {
      return <div>Debes estar logueado para acceder a esta página</div>
    }

    const client = await getClientBySlug(slug);
    if (!client) {
      return <div>No se pudo obtener el cliente ({slug})</div>
    }

    return (
      <div className="flex flex-grow w-full h-[calc(100vh-80px)]">
        {/* Panel lateral izquierdo con listado de conversaciones */}
        <div className="w-72 border-r border-border flex flex-col h-full">
          <div className="flex-grow overflow-y-auto">
            <Suspense fallback={<ConversationsListSkeleton />}>
              <ConversationsList 
                clientId={client.id}
                slug={slug}
                currentPage={currentPage}
                selectedId={id}
                search={search}
              />
            </Suspense>
          </div>
        </div>

        {/* Panel principal con los mensajes */}
        <div className="flex-grow h-full">
          <Suspense fallback={<ConversationMessagesSkeleton />}>
            <ConversationMessages
              conversationId={id}
              slug={slug}
            />
          </Suspense>
        </div>
      </div>
    );
  } catch (error) {
    console.error("Error en ConversationsProPage:", error);
    // Crear la URL para reintentar con los mismos parámetros
    const retryUrl = `/client/${slug}/crm/conversations-pro${id ? `?id=${id}` : ''}${page !== '1' ? `${id ? '&' : '?'}page=${page}` : ''}`;
    
    return (
      <div className="p-4 h-full">
        <DatabaseError 
          error={error instanceof Error ? error : new Error(String(error))} 
          retryUrl={retryUrl}
        />
      </div>
    );
  }
} 