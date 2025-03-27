'use client'

import { useState, useTransition } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Loader, Search } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface BuscadorOrdenProps {
  slug: string
}

export default function BuscadorOrden({ slug }: BuscadorOrdenProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [ordenId, setOrdenId] = useState(searchParams.get("ordenId") || "")
  const [isPending, startTransition] = useTransition()
  
  // Función para manejar la búsqueda
  const handleBuscar = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    if (!ordenId.trim()) return
    
    // Crear un objeto URLSearchParams con los parámetros actuales
    const params = new URLSearchParams(searchParams)
    
    // Actualizar el parámetro ordenId
    params.set("ordenId", ordenId.trim())
    
    // Iniciar transición para navegar a la misma página con el nuevo parámetro
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`)
    })
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Buscar Orden por ID</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleBuscar} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ordenId">ID de la Orden</Label>
            <div className="flex gap-2">
              <div className="relative flex-grow">
                <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="ordenId"
                  type="search"
                  value={ordenId}
                  onChange={(e) => setOrdenId(e.target.value)}
                  placeholder="Ingresa el ID de la orden"
                  className="pl-9"
                  disabled={isPending}
                />
              </div>
              <Button type="submit" disabled={isPending || !ordenId.trim()} className="w-40">
                {isPending ? (
                  <Loader className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
                <span className="ml-2">
                  {isPending ? "Buscando..." : "Buscar"}
                </span>
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Ingresa el ID exacto de la orden para ver sus detalles
            </p>
          </div>
        </form>
      </CardContent>
    </Card>
  )
} 