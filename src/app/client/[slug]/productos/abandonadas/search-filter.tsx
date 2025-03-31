"use client";

import { useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, X, Loader } from "lucide-react";

export default function SearchFilter({ initialFilter }: { initialFilter?: string }) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [filter, setFilter] = useState(initialFilter || "");
    const [isLoading, setIsLoading] = useState(false);
    
    // Función para aplicar el filtro
    const applyFilter = () => {
        // Crear nuevo objeto URLSearchParams basado en los parámetros actuales
        const params = new URLSearchParams(searchParams);
        
        // Restablecer la página a 1 cuando se aplica un nuevo filtro
        params.set("page", "1");
        
        // Agregar o eliminar el filtro según corresponda
        if (filter.trim()) {
            params.set("filter", filter);
        } else {
            params.delete("filter");
        }
        
        // Establecer estado de carga
        setIsLoading(true);
        
        // Redirigir a la misma ruta con los nuevos parámetros
        router.push(`${pathname}?${params.toString()}`);
        
        // Simular el tiempo de carga hasta que se complete la navegación
        setTimeout(() => {
            setIsLoading(false);
        }, 1000); // Timeout para asegurar que el estado de carga sea visible
    };
    
    // Función para limpiar el filtro
    const clearFilter = () => {
        setFilter("");
        
        // Crear nuevo objeto URLSearchParams basado en los parámetros actuales
        const params = new URLSearchParams(searchParams);
        
        // Eliminar el parámetro de filtro y restablecer la página
        params.delete("filter");
        params.set("page", "1");
        
        // Establecer estado de carga
        setIsLoading(true);
        
        // Redirigir a la misma ruta sin el filtro
        router.push(`${pathname}?${params.toString()}`);
        
        // Simular el tiempo de carga hasta que se complete la navegación
        setTimeout(() => {
            setIsLoading(false);
        }, 1000); // Timeout para asegurar que el estado de carga sea visible
    };
    
    // Manejar envío del formulario
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        applyFilter();
    };
    
    return (
        <form onSubmit={handleSubmit} className="flex items-end gap-2">
            <div className="flex-1">
                <div className="text-sm font-medium mb-2">Filtrar por ID, nombre o teléfono</div>
                <div className="relative">
                    <Input
                        type="text"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        placeholder="Buscar por ID, nombre o teléfono..."
                        className="pr-8"
                        disabled={isLoading}
                    />
                    {filter && (
                        <button
                            type="button"
                            onClick={clearFilter}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            disabled={isLoading}
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>
            </div>
            <Button type="submit" className="gap-2" disabled={isLoading}>
                {isLoading ? 
                    <Loader className="h-4 w-4 animate-spin" /> : 
                    <Search className="h-4 w-4" />
                }
                Buscar
            </Button>
        </form>
    );
} 