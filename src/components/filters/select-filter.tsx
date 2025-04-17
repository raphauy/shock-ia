"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCallback, useEffect, useState } from "react";

interface SelectFilterProps {
  basePath: string;
  paramName: string;
  options: string[];
  placeholder?: string;
  allLabel?: string;
}

export default function SelectFilter({
  basePath,
  paramName,
  options,
  placeholder = "Seleccionar...",
  allLabel = "Todos"
}: SelectFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Estado local para el valor seleccionado
  const [selectedValue, setSelectedValue] = useState<string>("");
  
  // Función para crear URL con parámetros actualizados
  const createUrlWithParams = useCallback((params: Record<string, string | null>) => {
    const newParams = new URLSearchParams(searchParams.toString());
    
    // Aplicar cambios de parámetros
    Object.entries(params).forEach(([key, value]) => {
      if (value === null) {
        newParams.delete(key);
      } else {
        newParams.set(key, value);
      }
    });
    
    return `${basePath}?${newParams.toString()}`;
  }, [searchParams, basePath]);
  
  // Sincronizar con searchParams al iniciar
  useEffect(() => {
    const currentValue = searchParams.get(paramName);
    setSelectedValue(currentValue || "");
  }, [searchParams, paramName]);
  
  // Manejar cambio de selección
  const handleSelectChange = useCallback((value: string) => {
    setSelectedValue(value);
    
    // Si se selecciona la opción "todos", eliminar el parámetro
    if (value === "") {
      router.push(createUrlWithParams({
        [paramName]: null
      }));
    } else {
      // De lo contrario, establecer el parámetro
      router.push(createUrlWithParams({
        [paramName]: value
      }));
    }
  }, [router, createUrlWithParams, paramName]);
  
  return (
    <Select
      value={selectedValue}
      onValueChange={handleSelectChange}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="">
          {allLabel}
        </SelectItem>
        {options.map((option) => (
          <SelectItem key={option} value={option}>
            {option}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
} 