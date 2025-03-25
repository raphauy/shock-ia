"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, X } from "lucide-react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useCallback, useEffect, useState, useTransition } from "react"

interface SearchBoxProps {
  initialQuery?: string
  placeholder?: string
}

export default function SearchBox({ 
  initialQuery = "", 
  placeholder = "Buscar productos..."
}: SearchBoxProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  
  // Estado local para el input
  const [searchTerm, setSearchTerm] = useState(initialQuery)
  const [isPending, startTransition] = useTransition()
  
  // Sincronizar con URL al cargar
  useEffect(() => {
    const query = searchParams.get("query") || ""
    setSearchTerm(query)
  }, [searchParams])
  
  // Actualizar la URL
  const performSearch = useCallback((query: string) => {
    startTransition(() => {
      const params = new URLSearchParams(searchParams)
      
      if (query) {
        params.set("query", query)
      } else {
        params.delete("query")
      }
      
      // Volver a la primera página al cambiar la búsqueda
      params.set("page", "1")
      
      router.push(`${pathname}?${params.toString()}`)
    })
  }, [pathname, router, searchParams])
  
  // Manejar cambio en el input
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchTerm(value)
  }
  
  // Manejar tecla Enter para búsqueda inmediata
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      performSearch(searchTerm)
    }
  }
  
  // Limpiar el input
  const handleClear = () => {
    setSearchTerm("")
  }
  
  // Ejecutar búsqueda
  const handleSearch = () => {
    performSearch(searchTerm)
  }
  
  const showClearButton = searchTerm.length > 0
  
  return (
    <div className="w-full space-y-3">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium">Consulta</h3>
      </div>
      
      <div className="flex gap-2">
        <div className="w-full relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          
          <Input
            type="text"
            placeholder={placeholder}
            value={searchTerm}
            onChange={handleSearchChange}
            onKeyDown={handleKeyDown}
            className={`w-full pl-10 ${showClearButton ? 'pr-10' : 'pr-4'}`}
            aria-label="Buscar productos"
          />
          
          {showClearButton && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7"
              onClick={handleClear}
              title="Limpiar texto"
              aria-label="Limpiar texto"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        <Button 
          onClick={handleSearch}
          className="flex-shrink-0"
          variant="default"
        >
          <Search className="h-4 w-4 mr-2" />
          Buscar
        </Button>
      </div>
      
      {isPending && (
        <p className="text-xs text-muted-foreground animate-pulse">
          Buscando...
        </p>
      )}
    </div>
  )
} 