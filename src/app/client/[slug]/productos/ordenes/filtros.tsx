'use client'

import { Calendar, FilterX, Loader, Search } from "lucide-react";
import { ESTADOS_ENTREGA, ESTADOS_ORDEN } from "./types";
import { format, subDays } from 'date-fns';
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useState, useTransition, useRef, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { DatePicker } from "@/components/date-picker";

interface FiltrosProps {
  slug: string;
  searchParams: {
    estado?: string;
    estadoEntrega?: string;
    fDesde?: string;
    fHasta?: string;
    cliente?: string;
    incluirAtributosProducto?: string;
  };
}

export default function Filtros({ slug, searchParams }: FiltrosProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [currentAction, setCurrentAction] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  
  // Estado para los valores de los filtros
  const [estado, setEstado] = useState(searchParams.estado || "TODAS");
  const [estadoEntrega, setEstadoEntrega] = useState(searchParams.estadoEntrega || "TODOS");
  const [cliente, setCliente] = useState(searchParams.cliente || "");
  const [fDesde, setFDesde] = useState<Date | undefined>(searchParams.fDesde ? new Date(searchParams.fDesde) : undefined);
  const [fHasta, setFHasta] = useState<Date | undefined>(searchParams.fHasta ? new Date(searchParams.fHasta) : undefined);
  const [incluirAtributos, setIncluirAtributos] = useState(searchParams.incluirAtributosProducto === "1");
  
  // Sincronizar formulario con searchParams cuando cambian
  useEffect(() => {
    setEstado(searchParams.estado || "TODAS");
    setEstadoEntrega(searchParams.estadoEntrega || "TODOS");
    setCliente(searchParams.cliente || "");
    setFDesde(searchParams.fDesde ? new Date(searchParams.fDesde) : undefined);
    setFHasta(searchParams.fHasta ? new Date(searchParams.fHasta) : undefined);
    setIncluirAtributos(searchParams.incluirAtributosProducto === "1");
  }, [searchParams]);
  
  // Obtener fecha de hace X días en formato YYYY-MM-DD
  const obtenerFechaHaceDias = (dias: number) => {
    const fecha = subDays(new Date(), dias);
    return format(fecha, 'yyyy-MM-dd');
  };
  
  // Función para limpiar todos los filtros
  const limpiarFiltros = () => {
    // Marcar la acción actual
    setCurrentAction('limpiar');
    
    // Resetear estados
    setEstado("TODAS");
    setEstadoEntrega("TODOS");
    setCliente("");
    setFDesde(undefined);
    setFHasta(undefined);
    setIncluirAtributos(false);
    
    // Navegar directamente a la URL base sin parámetros
    const url = `/client/${slug}/productos/ordenes`;
    
    // Iniciar transición
    startTransition(() => {
      // Navegar a la URL limpia
      router.push(url);
    });
  };
  
  // Función para navegar a una ruta con los filtros aplicados
  const navegarConFiltros = (filtrosPersonalizados: Record<string, string> = {}, accion: string = 'filtrar') => {
    // Marcar la acción actual
    setCurrentAction(accion);
    
    // Construir la URL base
    let url = `/client/${slug}/productos/ordenes`;
    
    // Si hay filtros, añadir como query params
    if (Object.keys(filtrosPersonalizados).length > 0) {
      const params = new URLSearchParams();
      Object.entries(filtrosPersonalizados).forEach(([key, value]) => {
        params.append(key, value);
      });
      url += `?${params.toString()}`;
    }
    
    // Iniciar transición - esto mantendrá isPending como true hasta que la navegación se complete
    startTransition(() => {
      // Navegar y forzar un refresh del contenido
      router.push(url);
    });
  };
  
  // Establecer fecha de hace 7 días
  const aplicarUltimos7Dias = () => {
    const fechaDesde = subDays(new Date(), 7);
    setFDesde(fechaDesde);
    
    const filtros: Record<string, string> = {};
    filtros.fDesde = format(fechaDesde, 'yyyy-MM-dd');
    navegarConFiltros(filtros, '7dias');
  };
  
  // Establecer fecha de hace 30 días
  const aplicarUltimos30Dias = () => {
    const fechaDesde = subDays(new Date(), 30);
    setFDesde(fechaDesde);
    
    const filtros: Record<string, string> = {};
    filtros.fDesde = format(fechaDesde, 'yyyy-MM-dd');
    navegarConFiltros(filtros, '30dias');
  };
  
  // Manejar el evento de submit del formulario
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    const filtros: Record<string, string> = {};
    
    // Añadir los filtros activos
    if (estado && estado !== "TODAS") filtros.estado = estado;
    if (estadoEntrega && estadoEntrega !== "TODOS") filtros.estadoEntrega = estadoEntrega;
    if (cliente) filtros.cliente = cliente;
    if (fDesde) filtros.fDesde = format(fDesde, 'yyyy-MM-dd');
    if (fHasta) filtros.fHasta = format(fHasta, 'yyyy-MM-dd');
    if (incluirAtributos) filtros.incluirAtributosProducto = "1";
    
    navegarConFiltros(filtros, 'aplicar');
  };

  // Verificar si un botón específico está cargando
  const isActionLoading = (accion: string) => isPending && currentAction === accion;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Filtros</CardTitle>
      </CardHeader>
      <CardContent>
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Estado de la orden */}
            <div className="space-y-2">
              <Label htmlFor="estado">Estado de la Orden</Label>
              <Select 
                value={estado} 
                onValueChange={setEstado}
                disabled={isPending}
              >
                <SelectTrigger id="estado" className="w-full">
                  <SelectValue placeholder="Seleccionar estado" />
                </SelectTrigger>
                <SelectContent>
                  {ESTADOS_ORDEN.map(e => (
                    <SelectItem key={e.valor} value={e.valor}>{e.etiqueta}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Estado de entrega */}
            <div className="space-y-2">
              <Label htmlFor="estadoEntrega">Estado de Entrega</Label>
              <Select 
                value={estadoEntrega} 
                onValueChange={setEstadoEntrega}
                disabled={isPending}
              >
                <SelectTrigger id="estadoEntrega" className="w-full">
                  <SelectValue placeholder="Seleccionar estado de entrega" />
                </SelectTrigger>
                <SelectContent>
                  {ESTADOS_ENTREGA.map(e => (
                    <SelectItem key={e.valor} value={e.valor}>{e.etiqueta}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Búsqueda de cliente */}
            <div className="space-y-2">
              <Label htmlFor="cliente">Buscar Cliente</Label>
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input 
                  id="cliente"
                  placeholder="Nombre, email, documento o teléfono"
                  className="pl-9"
                  value={cliente}
                  onChange={(e) => setCliente(e.target.value)}
                  disabled={isPending}
                />
              </div>
            </div>
            
            {/* Fecha desde */}
            <div className="space-y-2">
              <Label htmlFor="fDesde">Desde</Label>
              <DatePicker 
                label="Fecha desde"
                date={fDesde}
                setDate={isPending ? () => {} : setFDesde}
                disabled={isPending}
              />
            </div>
            
            {/* Fecha hasta */}
            <div className="space-y-2">
              <Label htmlFor="fHasta">Hasta</Label>
              <DatePicker 
                label="Fecha hasta"
                date={fHasta}
                setDate={isPending ? () => {} : setFHasta}
                disabled={isPending}
              />
            </div>
            
            {/* Incluir atributos de producto */}
            <div className="flex items-center space-x-2 h-full py-4">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="incluirAtributosProducto" 
                  checked={incluirAtributos}
                  onCheckedChange={(checked: boolean | 'indeterminate') => setIncluirAtributos(checked === true)}
                  disabled={isPending}
                />
                <Label 
                  htmlFor="incluirAtributosProducto" 
                  className="text-sm cursor-pointer"
                >
                  Incluir atributos de producto
                </Label>
              </div>
            </div>
          </div>
          
          {/* Botones de filtrado y enlaces rápidos */}
          <div className="flex flex-col md:flex-row gap-4 justify-between pt-2 items-center">
            <div className="flex flex-wrap gap-2 text-sm">
              <Button 
                variant="link" 
                className="h-auto p-0"
                onClick={limpiarFiltros}
                type="button"
                disabled={isPending}
              >
                {isActionLoading('limpiar') ? (
                  <>
                    <Loader className="h-3 w-3 mr-1 animate-spin" />
                    Limpiando...
                  </>
                ) : 'Limpiar filtros'}
              </Button>
              <span className="text-muted-foreground">•</span>
              <Button 
                variant="link" 
                className="h-auto p-0"
                onClick={aplicarUltimos7Dias}
                type="button"
                disabled={isPending}
              >
                {isActionLoading('7dias') ? (
                  <>
                    <Loader className="h-3 w-3 mr-1 animate-spin" />
                    Filtrando...
                  </>
                ) : 'Últimos 7 días'}
              </Button>
              <span className="text-muted-foreground">•</span>
              <Button 
                variant="link" 
                className="h-auto p-0"
                onClick={aplicarUltimos30Dias}
                type="button"
                disabled={isPending}
              >
                {isActionLoading('30dias') ? (
                  <>
                    <Loader className="h-3 w-3 mr-1 animate-spin" />
                    Filtrando...
                  </>
                ) : 'Últimos 30 días'}
              </Button>
              <span className="text-muted-foreground">•</span>
              <Button 
                variant="link" 
                className="h-auto p-0"
                onClick={() => navegarConFiltros({ estado: "ABANDONADA" }, 'abandonadas')}
                type="button"
                disabled={isPending}
              >
                {isActionLoading('abandonadas') ? (
                  <>
                    <Loader className="h-3 w-3 mr-1 animate-spin" />
                    Filtrando...
                  </>
                ) : 'Solo abandonados'}
              </Button>
            </div>
            
            <Button 
              type="submit" 
              variant="default"
              disabled={isPending}
              className="w-40"
            >
              {isActionLoading('aplicar') ? (
                <>
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                  Aplicando...
                </>
              ) : (
                <>
                  <FilterX className="mr-2 h-4 w-4" />
                  Aplicar Filtros
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
} 