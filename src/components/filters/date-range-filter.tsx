"use client"

import { DatePicker } from "@/components/date-picker";
import { Button } from "@/components/ui/button";
import { formatISO } from "date-fns";
import { X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

interface DateRangeFilterProps {
  basePath: string;
}

export default function DateRangeFilter({ basePath }: DateRangeFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Estado para el filtro 'last'
  const [lastFilter, setLastFilter] = useState<string | null>(null);
  
  // Estados para las fechas
  const [fromDate, setFromDate] = useState<Date | undefined>(undefined);
  const [toDate, setToDate] = useState<Date | undefined>(undefined);
  
  // Cargar parámetros iniciales
  useEffect(() => {
    // Leer el filtro 'last' de los searchParams
    const lastParam = searchParams.get("last");
    setLastFilter(lastParam);
    
    // Leer 'from' y 'to' de los searchParams si existen
    const fromParam = searchParams.get("from");
    if (fromParam) {
      try {
        const parsedDate = new Date(fromParam);
        setFromDate(parsedDate);
      } catch (e) {
        setFromDate(undefined);
      }
    } else {
      setFromDate(undefined);
    }
    
    const toParam = searchParams.get("to");
    if (toParam) {
      try {
        const parsedDate = new Date(toParam);
        setToDate(parsedDate);
      } catch (e) {
        setToDate(undefined);
      }
    } else {
      setToDate(undefined);
    }
  }, [searchParams]);
  
  // Función para crear nueva URL con parámetros actualizados
  const createUrlWithParams = useCallback((params: Record<string, string | null>) => {
    const newParams = new URLSearchParams(searchParams.toString());
    
    // Aplicar los cambios de parámetros
    Object.entries(params).forEach(([key, value]) => {
      if (value === null) {
        newParams.delete(key);
      } else {
        newParams.set(key, value);
      }
    });
    
    return `${basePath}?${newParams.toString()}`;
  }, [searchParams, basePath]);
  
  // Manejar selección de filtro rápido
  const handleQuickFilter = useCallback((filter: string) => {
    // Si es el mismo filtro, lo eliminamos
    if (lastFilter === filter) {
      router.push(createUrlWithParams({
        last: null,
        from: null,
        to: null
      }));
      setLastFilter(null);
      setFromDate(undefined);
      setToDate(undefined);
    } else {
      // Si es un nuevo filtro, actualizamos
      router.push(createUrlWithParams({
        last: filter,
        from: null,
        to: null
      }));
      setLastFilter(filter);
      setFromDate(undefined);
      setToDate(undefined);
    }
  }, [lastFilter, router, createUrlWithParams]);
  
  // Manejar cambio en DatePicker "Desde"
  const handleFromDateChange = useCallback((date: Date | undefined) => {
    if (date) {
      router.push(createUrlWithParams({
        from: formatISO(date, { representation: 'date' }),
        last: null
      }));
      setLastFilter(null);
    } else {
      router.push(createUrlWithParams({
        from: null
      }));
    }
    setFromDate(date);
  }, [router, createUrlWithParams]);
  
  // Manejar cambio en DatePicker "Hasta"
  const handleToDateChange = useCallback((date: Date | undefined) => {
    if (date) {
      router.push(createUrlWithParams({
        to: formatISO(date, { representation: 'date' }),
        last: null
      }));
      setLastFilter(null);
    } else {
      router.push(createUrlWithParams({
        to: null
      }));
    }
    setToDate(date);
  }, [router, createUrlWithParams]);
  
  // Limpiar todos los filtros de fecha
  const clearAllDateFilters = useCallback(() => {
    router.push(createUrlWithParams({
      last: null,
      from: null, 
      to: null
    }));
    setLastFilter(null);
    setFromDate(undefined);
    setToDate(undefined);
  }, [router, createUrlWithParams]);
  
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2 items-center">
        <Button 
          size="sm" 
          variant={lastFilter === "HOY" ? "default" : "outline"}
          onClick={() => handleQuickFilter("HOY")}
        >
          Hoy
        </Button>
        <Button 
          size="sm" 
          variant={lastFilter === "7D" ? "default" : "outline"}
          onClick={() => handleQuickFilter("7D")}
        >
          7D
        </Button>
        <Button 
          size="sm" 
          variant={lastFilter === "30D" ? "default" : "outline"}
          onClick={() => handleQuickFilter("30D")}
        >
          30D
        </Button>
        
        <div className="flex gap-2">
          <DatePicker 
            label="Desde" 
            date={fromDate} 
            setDate={handleFromDateChange} 
          />
          <DatePicker 
            label="Hasta" 
            date={toDate} 
            setDate={handleToDateChange} 
          />
        </div>
        
        {(fromDate || toDate || lastFilter) && (
          <Button 
            size="sm" 
            variant="outline" 
            onClick={clearAllDateFilters}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
} 