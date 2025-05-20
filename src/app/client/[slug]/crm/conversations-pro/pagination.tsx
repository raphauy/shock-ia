import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  slug: string;
  selectedId?: string;
}

export function Pagination({ currentPage, totalPages, slug, selectedId }: PaginationProps) {
  // Para debugging: asegurar que totalPages sea al menos 1
  const calculatedTotalPages = Math.max(1, totalPages);
  
  // URL base para la paginación
  const baseUrl = `/client/${slug}/crm/conversations-pro`;
  
  // Crear URL con parámetros
  const createPageUrl = (page: number) => {
    const params = new URLSearchParams();
    params.set('page', String(page));
    
    // Mantener el id de conversación seleccionada si existe
    if (selectedId) {
      params.set('id', selectedId);
    }
    
    return `${baseUrl}?${params.toString()}`;
  };
  
  // Si solo hay una página, mostrar solo el número de página actual
  if (calculatedTotalPages <= 1) {
    return (
      <div className="flex items-center justify-center space-x-1 py-2">
        <Button
          variant="default"
          size="sm"
          className="h-8 w-8 pointer-events-none"
        >
          1
        </Button>
      </div>
    );
  }
  
  // Calcular rango de páginas a mostrar
  let startPage = Math.max(1, currentPage - 1);
  let endPage = Math.min(calculatedTotalPages, startPage + 2);
  
  // Ajustar si estamos al final
  if (endPage - startPage < 2) {
    startPage = Math.max(1, endPage - 2);
  }
  
  // Generar array con las páginas a mostrar
  const pages = Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);
  
  return (
    <div className="flex items-center justify-center space-x-1 py-2">
      <Link href={currentPage > 1 ? createPageUrl(currentPage - 1) : '#'} 
            aria-disabled={currentPage === 1} 
            tabIndex={currentPage === 1 ? -1 : undefined}
            className={cn(currentPage === 1 && "pointer-events-none opacity-50")}>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          disabled={currentPage === 1}
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="sr-only">Página anterior</span>
        </Button>
      </Link>
      
      {startPage > 1 && (
        <>
          <Link href={createPageUrl(1)}>
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8"
            >
              1
            </Button>
          </Link>
          {startPage > 2 && (
            <span className="text-muted-foreground px-1">...</span>
          )}
        </>
      )}
      
      {pages.map(page => (
        <Link key={page} href={createPageUrl(page)}>
          <Button
            variant={page === currentPage ? "default" : "outline"}
            size="sm"
            className={cn("h-8 w-8", page === currentPage && "pointer-events-none")}
          >
            {page}
          </Button>
        </Link>
      ))}
      
      {endPage < calculatedTotalPages && (
        <>
          {endPage < calculatedTotalPages - 1 && (
            <span className="text-muted-foreground px-1">...</span>
          )}
          <Link href={createPageUrl(calculatedTotalPages)}>
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8"
            >
              {calculatedTotalPages}
            </Button>
          </Link>
        </>
      )}
      
      <Link href={currentPage < calculatedTotalPages ? createPageUrl(currentPage + 1) : '#'}
            aria-disabled={currentPage === calculatedTotalPages}
            tabIndex={currentPage === calculatedTotalPages ? -1 : undefined}
            className={cn(currentPage === calculatedTotalPages && "pointer-events-none opacity-50")}>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          disabled={currentPage === calculatedTotalPages}
        >
          <ChevronRight className="h-4 w-4" />
          <span className="sr-only">Página siguiente</span>
        </Button>
      </Link>
    </div>
  );
} 