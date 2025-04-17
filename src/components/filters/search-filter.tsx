"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SearchIcon, Loader, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

interface SearchFilterProps {
  basePath: string;
  paramName: string;
  placeholder?: string;
}

export default function SearchFilter({
  basePath,
  paramName,
  placeholder = "Buscar..."
}: SearchFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Estado para el input y loading
  const [searchValue, setSearchValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
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
  
  // Cargar valor inicial del parámetro
  useEffect(() => {
    const currentValue = searchParams.get(paramName);
    setSearchValue(currentValue || "");
  }, [searchParams, paramName]);
  
  // Manejar envío de formulario
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Actualizar URL con el nuevo término de búsqueda o eliminar si está vacío
    if (searchValue.trim()) {
      router.push(createUrlWithParams({
        [paramName]: searchValue.trim()
      }));
    } else {
      router.push(createUrlWithParams({
        [paramName]: null
      }));
    }
    
    // Simular pequeño delay para mostrar loading
    setTimeout(() => {
      setIsLoading(false);
    }, 300);
  }, [searchValue, router, createUrlWithParams, paramName]);
  
  // Manejar limpieza del campo
  const handleClear = useCallback(() => {
    setSearchValue("");
    setIsLoading(true);
    
    router.push(createUrlWithParams({
      [paramName]: null
    }));
    
    setTimeout(() => {
      setIsLoading(false);
    }, 300);
  }, [router, createUrlWithParams, paramName]);
  
  return (
    <form onSubmit={handleSubmit} className="flex gap-2 w-full">
      <div className="relative flex-1">
        <Input
          placeholder={placeholder}
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          className="w-full pr-8"
        />
        {searchValue && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      <Button type="submit" disabled={isLoading}>
        {isLoading ? (
          <Loader className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <SearchIcon className="w-4 h-4 mr-2" />
        )}
        Buscar
      </Button>
    </form>
  );
} 