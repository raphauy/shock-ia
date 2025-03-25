"use client"

import { Button } from "@/components/ui/button"
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight,
  MoreHorizontal
} from "lucide-react"
import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"

interface PaginationProps {
  totalItems: number
  itemsPerPage: number
  currentPage: number
  siblingsCount?: number
}

export default function Pagination({
  totalItems,
  itemsPerPage,
  currentPage,
  siblingsCount = 1
}: PaginationProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  
  // Calcular el total de páginas
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  
  if (totalPages <= 1) {
    return null
  }
  
  // Crear una URL con los parámetros de búsqueda actualizados
  const createPageURL = (pageNumber: number | string) => {
    const params = new URLSearchParams(searchParams)
    params.set('page', pageNumber.toString())
    return `${pathname}?${params.toString()}`
  }
  
  // Generar array de números de páginas a mostrar
  const generatePagination = () => {
    // Si hay menos de 7 páginas, mostrar todas
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }
    
    // Calcular páginas vecinas
    const leftSiblingIndex = Math.max(currentPage - siblingsCount, 1)
    const rightSiblingIndex = Math.min(currentPage + siblingsCount, totalPages)
    
    // Determinar si mostrar puntos suspensivos
    const shouldShowLeftDots = leftSiblingIndex > 2
    const shouldShowRightDots = rightSiblingIndex < totalPages - 1
    
    // Caso 1: Mostrar puntos suspensivos solo a la derecha
    if (!shouldShowLeftDots && shouldShowRightDots) {
      const leftItemCount = 3 + 2 * siblingsCount
      const leftRange = Array.from({ length: leftItemCount }, (_, i) => i + 1)
      
      return [...leftRange, 'dots', totalPages]
    }
    
    // Caso 2: Mostrar puntos suspensivos solo a la izquierda
    if (shouldShowLeftDots && !shouldShowRightDots) {
      const rightItemCount = 3 + 2 * siblingsCount
      const rightRange = Array.from(
        { length: rightItemCount },
        (_, i) => totalPages - rightItemCount + i + 1
      )
      
      return [1, 'dots', ...rightRange]
    }
    
    // Caso 3: Mostrar puntos suspensivos en ambos lados
    if (shouldShowLeftDots && shouldShowRightDots) {
      const middleRange = Array.from(
        { length: rightSiblingIndex - leftSiblingIndex + 1 },
        (_, i) => leftSiblingIndex + i
      )
      
      return [1, 'dots', ...middleRange, 'dots', totalPages]
    }
    
    return []
  }
  
  const pages = generatePagination()
  
  return (
    <nav aria-label="Paginación" className="flex justify-center my-8">
      <ul className="flex items-center gap-1">
        {/* Botón "Primera página" */}
        <li>
          <Button
            variant="outline"
            size="icon"
            disabled={currentPage <= 1}
            asChild={currentPage > 1}
          >
            {currentPage > 1 ? (
              <Link href={createPageURL(1)} aria-label="Primera página">
                <ChevronsLeft className="h-4 w-4" />
              </Link>
            ) : (
              <span>
                <ChevronsLeft className="h-4 w-4" />
              </span>
            )}
          </Button>
        </li>
        
        {/* Botón "Página anterior" */}
        <li>
          <Button
            variant="outline"
            size="icon"
            disabled={currentPage <= 1}
            asChild={currentPage > 1}
          >
            {currentPage > 1 ? (
              <Link href={createPageURL(currentPage - 1)} aria-label="Página anterior">
                <ChevronLeft className="h-4 w-4" />
              </Link>
            ) : (
              <span>
                <ChevronLeft className="h-4 w-4" />
              </span>
            )}
          </Button>
        </li>
        
        {/* Números de página */}
        {pages.map((page, i) => (
          <li key={i}>
            {page === 'dots' ? (
              <Button variant="outline" size="icon" disabled>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                variant={currentPage === page ? "default" : "outline"}
                size="icon"
                asChild={currentPage !== page}
              >
                {currentPage !== page ? (
                  <Link href={createPageURL(page)} aria-label={`Página ${page}`}>
                    {page}
                  </Link>
                ) : (
                  <span>{page}</span>
                )}
              </Button>
            )}
          </li>
        ))}
        
        {/* Botón "Página siguiente" */}
        <li>
          <Button
            variant="outline"
            size="icon"
            disabled={currentPage >= totalPages}
            asChild={currentPage < totalPages}
          >
            {currentPage < totalPages ? (
              <Link href={createPageURL(currentPage + 1)} aria-label="Página siguiente">
                <ChevronRight className="h-4 w-4" />
              </Link>
            ) : (
              <span>
                <ChevronRight className="h-4 w-4" />
              </span>
            )}
          </Button>
        </li>
        
        {/* Botón "Última página" */}
        <li>
          <Button
            variant="outline"
            size="icon"
            disabled={currentPage >= totalPages}
            asChild={currentPage < totalPages}
          >
            {currentPage < totalPages ? (
              <Link href={createPageURL(totalPages)} aria-label="Última página">
                <ChevronsRight className="h-4 w-4" />
              </Link>
            ) : (
              <span>
                <ChevronsRight className="h-4 w-4" />
              </span>
            )}
          </Button>
        </li>
      </ul>
    </nav>
  )
} 