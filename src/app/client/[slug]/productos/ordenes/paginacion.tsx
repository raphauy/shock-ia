'use client'

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Loader, MoreHorizontal, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useState, useTransition, useEffect } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface PaginacionProps {
  slug: string;
  searchParams: Record<string, string | undefined>;
  hayMasResultados: boolean;
  paginaActual: number;
  totalItems?: number; // Opcional, si está disponible
  hayResultadosEnPaginaActual?: boolean; // Nueva prop para indicar si hay resultados en la página actual
}

export default function Paginacion({ 
  slug, 
  searchParams, 
  hayMasResultados, 
  paginaActual,
  totalItems,
  hayResultadosEnPaginaActual = true // Por defecto asumimos que hay resultados
}: PaginacionProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [currentPage, setCurrentPage] = useState<number | null>(null);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [paginaUltimaConDatos, setPaginaUltimaConDatos] = useState<number | null>(null);
  const [seDetectoPaginaVacia, setSeDetectoPaginaVacia] = useState(false);
  
  // Calcular el total de páginas basado en la información disponible
  useEffect(() => {
    // Actualizamos la última página con datos conocida 
    if (hayResultadosEnPaginaActual && (paginaUltimaConDatos === null || paginaActual > paginaUltimaConDatos)) {
      setPaginaUltimaConDatos(paginaActual);
    }
    
    // Si estamos en una página sin resultados y tenemos una página anterior con datos,
    // eso significa que hemos llegado al final real de los datos
    if (!hayResultadosEnPaginaActual && paginaUltimaConDatos !== null && paginaActual > paginaUltimaConDatos) {
      setSeDetectoPaginaVacia(true);
    }
    
    // Si sabemos el total de items, podemos calcular el total de páginas exacto
    if (totalItems && totalItems > 0) {
      // Calculamos las páginas basadas en el total reportado por la API
      const calculatedPages = Math.ceil(totalItems / 50); // 50 items por página
      
      // Si hemos detectado una página vacía después de una con datos, usamos la última página con datos
      if (seDetectoPaginaVacia && paginaUltimaConDatos !== null) {
        setTotalPaginas(paginaUltimaConDatos);
      } else if (paginaActual > calculatedPages) {
        // Si estamos en una página válida pero teóricamente no debería existir,
        // ajustamos para que la página actual sea válida
        setTotalPaginas(paginaActual);
      } else {
        // Caso normal: usamos el cálculo basado en el total de items
        setTotalPaginas(calculatedPages);
      }
    } else {
      // Si hemos detectado una página vacía después de una con datos, usamos la última página con datos
      if (seDetectoPaginaVacia && paginaUltimaConDatos !== null) {
        setTotalPaginas(paginaUltimaConDatos);
      } else if (hayMasResultados) {
        // Si hay más resultados, al menos hay una página más
        setTotalPaginas(Math.max(paginaActual + 1, 1));
      } else {
        // Si no hay más resultados, la página actual es la última
        setTotalPaginas(Math.max(paginaActual, 1));
      }
    }
  }, [totalItems, hayMasResultados, paginaActual, hayResultadosEnPaginaActual, paginaUltimaConDatos, seDetectoPaginaVacia]);
  
  // Función para generar la URL con los parámetros actuales y la página especificada
  const navegarAPagina = (pagina: number) => {
    // Si sabemos que la última página con datos es menor que la solicitada y hemos detectado página vacía,
    // ajustamos a la última página con datos conocida
    if (seDetectoPaginaVacia && paginaUltimaConDatos !== null && pagina > paginaUltimaConDatos) {
      pagina = paginaUltimaConDatos;
    }
    
    // Validar que la página esté dentro de los límites
    if (pagina < 1 || pagina > totalPaginas) return;
    
    // Evitar navegación a la misma página
    if (pagina === paginaActual) return;
    
    // Marcar la página actual para mostrar el estado de carga
    setCurrentPage(pagina);
    
    const nuevosParams = new URLSearchParams();
    
    // Añadir todos los parámetros actuales excepto 'pagina'
    Object.entries(searchParams).forEach(([key, value]) => {
      if (key !== 'pagina' && value) {
        nuevosParams.append(key, value);
      }
    });
    
    // Añadir el nuevo número de página si es mayor que 1
    if (pagina > 1) {
      nuevosParams.append('pagina', pagina.toString());
    }
    
    const queryString = nuevosParams.toString();
    const url = `/client/${slug}/productos/ordenes${queryString ? `?${queryString}` : ''}`;
    
    // Iniciar transición - esto mantendrá isPending como true hasta que la navegación se complete
    startTransition(() => {
      router.push(url);
    });
  };
  
  // Verificar si un botón de página específico está cargando
  const isPageLoading = (pagina: number) => isPending && currentPage === pagina;
  
  // Generar array de números de páginas a mostrar
  const generarPaginacion = () => {
    // Determinar el máximo de páginas a mostrar basado en datos reales
    const maxPaginasReales = seDetectoPaginaVacia && paginaUltimaConDatos !== null 
      ? paginaUltimaConDatos 
      : totalPaginas;
    
    // Si hay menos de 7 páginas, mostrar todas
    if (maxPaginasReales <= 7) {
      return Array.from({ length: maxPaginasReales }, (_, i) => i + 1);
    }
    
    // Caso especial: si estamos en una página cercana al final conocido
    if (paginaActual > maxPaginasReales - 3) {
      const startPage = Math.max(maxPaginasReales - 6, 1);
      return [
        ...Array.from({ length: Math.min(7, maxPaginasReales) }, (_, i) => startPage + i)
      ];
    }
    
    // Calcular páginas vecinas
    const leftSiblingIndex = Math.max(paginaActual - 1, 1);
    const rightSiblingIndex = Math.min(paginaActual + 1, maxPaginasReales);
    
    // Determinar si mostrar puntos suspensivos
    const mostrarPuntosIzquierda = leftSiblingIndex > 2;
    const mostrarPuntosDerecha = rightSiblingIndex < maxPaginasReales - 1;
    
    // Caso 1: Mostrar puntos suspensivos solo a la derecha
    if (!mostrarPuntosIzquierda && mostrarPuntosDerecha) {
      const leftRange = Array.from({ length: 5 }, (_, i) => i + 1);
      return [...leftRange, 'dots', maxPaginasReales];
    }
    
    // Caso 2: Mostrar puntos suspensivos solo a la izquierda
    if (mostrarPuntosIzquierda && !mostrarPuntosDerecha) {
      const rightRange = Array.from(
        { length: 5 },
        (_, i) => maxPaginasReales - 4 + i
      );
      return [1, 'dots', ...rightRange];
    }
    
    // Caso 3: Mostrar puntos suspensivos en ambos lados
    if (mostrarPuntosIzquierda && mostrarPuntosDerecha) {
      const middleRange = [
        paginaActual - 1,
        paginaActual,
        paginaActual + 1
      ];
      return [1, 'dots', ...middleRange, 'dots', maxPaginasReales];
    }
    
    return Array.from({ length: Math.min(7, maxPaginasReales) }, (_, i) => i + 1);
  };
  
  const paginas = generarPaginacion();
  
  // Determinar si mostrar una advertencia sobre posibles páginas vacías
  const mostrarAdvertencia = seDetectoPaginaVacia && 
                            paginaUltimaConDatos !== null && 
                            totalItems && 
                            Math.ceil(totalItems / 50) > paginaUltimaConDatos;
  
  // Texto para la advertencia
  const mensajeAdvertencia = paginaUltimaConDatos !== null && totalItems
    ? `El sistema reporta ${totalItems} órdenes (${Math.ceil(totalItems / 50)} páginas), pero solo hay datos hasta la página ${paginaUltimaConDatos}`
    : '';
  
  return (
    <nav aria-label="Paginación" className="flex flex-col gap-2">
      {mostrarAdvertencia && (
        <Card className="p-3 border-amber-200 bg-amber-50">
          <div className="flex items-center gap-2 text-amber-600 text-sm">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <span>{mensajeAdvertencia}</span>
          </div>
        </Card>
      )}
      
      <div className="flex justify-between items-center mt-2">
        <div className="text-sm text-muted-foreground flex items-center gap-2">
          <span>Mostrando página {paginaActual}</span>
          {!hayResultadosEnPaginaActual && (
            <Badge variant="outline" className="text-xs bg-muted">Sin resultados</Badge>
          )}
          <span>de {seDetectoPaginaVacia && paginaUltimaConDatos ? paginaUltimaConDatos : totalPaginas || '?'}</span>
          {totalItems && (
            <Badge variant="secondary" className="ml-1">Total: {totalItems}</Badge>
          )}
        </div>
        
        <ul className="flex items-center gap-1">
          {/* Primera página */}
          <li>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="w-9 h-9 p-0"
                  onClick={() => navegarAPagina(1)}
                  disabled={isPending || paginaActual <= 1}
                  aria-label="Primera página"
                >
                  {isPageLoading(1) ? (
                    <Loader className="h-4 w-4 animate-spin" />
                  ) : (
                    <ChevronsLeft className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Primera página</TooltipContent>
            </Tooltip>
          </li>
          
          {/* Página anterior */}
          <li>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="w-9 h-9 p-0"
                  onClick={() => navegarAPagina(paginaActual - 1)}
                  disabled={isPending || paginaActual <= 1}
                  aria-label="Página anterior"
                >
                  {isPageLoading(paginaActual - 1) ? (
                    <Loader className="h-4 w-4 animate-spin" />
                  ) : (
                    <ChevronLeft className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Página anterior</TooltipContent>
            </Tooltip>
          </li>
          
          {/* Números de página */}
          {paginas.map((pagina, i) => (
            <li key={i}>
              {pagina === 'dots' ? (
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="w-9 h-9 p-0" 
                  disabled
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  variant={paginaActual === pagina ? "default" : "outline"}
                  size="icon"
                  className={cn(
                    "w-9 h-9 p-0",
                    paginaActual === pagina && "pointer-events-none"
                  )}
                  onClick={() => navegarAPagina(pagina as number)}
                  disabled={isPending || paginaActual === pagina || (seDetectoPaginaVacia && paginaUltimaConDatos !== null && (pagina as number) > paginaUltimaConDatos)}
                  aria-label={`Página ${pagina}`}
                  aria-current={paginaActual === pagina ? "page" : undefined}
                >
                  {isPageLoading(pagina as number) ? (
                    <Loader className="h-4 w-4 animate-spin" />
                  ) : (
                    pagina
                  )}
                </Button>
              )}
            </li>
          ))}
          
          {/* Página siguiente - Solo habilitado si hay más resultados */}
          <li>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="w-9 h-9 p-0"
                  onClick={() => navegarAPagina(paginaActual + 1)}
                  disabled={isPending || !hayMasResultados || !hayResultadosEnPaginaActual || (seDetectoPaginaVacia && paginaUltimaConDatos !== null && paginaActual >= paginaUltimaConDatos)}
                  aria-label="Página siguiente"
                >
                  {isPageLoading(paginaActual + 1) ? (
                    <Loader className="h-4 w-4 animate-spin" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Página siguiente</TooltipContent>
            </Tooltip>
          </li>
          
          {/* Última página - Solo si podemos estimar el total y no estamos en la última */}
          {(!seDetectoPaginaVacia && hayMasResultados && totalPaginas > paginaActual) || 
           (seDetectoPaginaVacia && paginaUltimaConDatos !== null && paginaActual < paginaUltimaConDatos) ? (
            <li>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="w-9 h-9 p-0"
                    onClick={() => navegarAPagina(seDetectoPaginaVacia && paginaUltimaConDatos !== null ? paginaUltimaConDatos : totalPaginas)}
                    disabled={isPending || (seDetectoPaginaVacia && paginaUltimaConDatos !== null ? paginaActual >= paginaUltimaConDatos : paginaActual >= totalPaginas)}
                    aria-label={seDetectoPaginaVacia && paginaUltimaConDatos !== null ? `Última página con datos (${paginaUltimaConDatos})` : "Última página"}
                  >
                    {isPageLoading(seDetectoPaginaVacia && paginaUltimaConDatos !== null ? paginaUltimaConDatos : totalPaginas) ? (
                      <Loader className="h-4 w-4 animate-spin" />
                    ) : (
                      <ChevronsRight className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {seDetectoPaginaVacia && paginaUltimaConDatos !== null 
                    ? `Última página con datos (${paginaUltimaConDatos})` 
                    : "Última página"}
                </TooltipContent>
              </Tooltip>
            </li>
          ) : null}
        </ul>
      </div>
    </nav>
  );
} 