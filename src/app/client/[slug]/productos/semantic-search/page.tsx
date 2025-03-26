'use client'

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Slider } from "@/components/ui/slider"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { LayoutDashboard, Loader2, Search, ShoppingCart, X } from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useState } from "react"
import ProductCard from "../components/product-card"
import { searchProducts } from "./actions"

type Props = {
  params: {
    slug: string
  }
}

export default function SemanticSearchPage({ params }: Props) {
  const { slug } = useParams() as { slug: string }
  
  const [query, setQuery] = useState("")
  const [limit, setLimit] = useState<number>(10)
  const [thresholdPercentage, setThresholdPercentage] = useState<number>(35)
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resultInfo, setResultInfo] = useState<string | null>(null)
  
  const handleSearch = async () => {
    if (!query.trim()) {
      setError("Por favor, introduce un texto para buscar")
      return
    }
    
    setError(null)
    setIsSearching(true)
    setResultInfo(null)
    
    try {
      const result = await searchProducts(slug, query, limit)
      
      if (!result.success) {
        throw new Error(result.error)
      }
      
      setSearchResults(result.products)
      
      if (result.products.length === 0) {
        setResultInfo("No se encontraron productos que coincidan con tu búsqueda")
      } else {
        const relevantCount = result.products.filter(product => 
          Math.round((1 - Number(product.similarity)) * 100) >= thresholdPercentage
        ).length;
        
        setResultInfo(
          `Se encontraron ${result.products.length} producto(s). ` +
          `${relevantCount} ${relevantCount === 1 ? 'cumple' : 'cumplen'} ` +
          `con el umbral de similitud del ${thresholdPercentage}%.`
        )
      }
      
    } catch (err: any) {
      console.error("Error:", err)
      setError(err.message || "Error al realizar la búsqueda")
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }
  
  // Limpiar el input de búsqueda
  const handleClearSearch = () => {
    setQuery("")
    setError(null)
  }

  const handleThresholdChange = (value: number[]) => {
    setThresholdPercentage(value[0])
    
    if (searchResults.length > 0) {
      const relevantCount = searchResults.filter(product => 
        Math.round((1 - Number(product.similarity)) * 100) >= value[0]
      ).length;
      
      setResultInfo(
        `Se encontraron ${searchResults.length} producto(s). ` +
        `${relevantCount} ${relevantCount === 1 ? 'cumple' : 'cumplen'} ` +
        `con el umbral de similitud del ${value[0]}%.`
      );
    }
  }
  
  const relevantProductsCount = searchResults.filter(product => 
    Math.round((1 - Number(product.similarity)) * 100) >= thresholdPercentage
  ).length;
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col space-y-2">
        <div className="flex flex-col md:flex-row justify-between md:items-center">
          <h1 className="text-3xl font-bold tracking-tight">Búsqueda Semántica de Productos</h1>
          <div className="flex gap-2 mt-2 md:mt-0">
            <Link href={`/client/${slug}/productos`}>
              <Button variant="outline">
                <LayoutDashboard className="mr-2 h-4 w-4" />
                Dashboard
              </Button>
            </Link>
            <Link href={`/client/${slug}/productos/text-search`}>
              <Button variant="outline">
                <ShoppingCart className="mr-2 h-4 w-4" />
                Todos los productos
              </Button>
            </Link>
          </div>
        </div>
        <p className="text-muted-foreground">
          Busca productos utilizando lenguaje natural y similitud semántica
        </p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Búsqueda</CardTitle>
          <CardDescription>
            Describe lo que estás buscando con tus propias palabras
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="query">Consulta</Label>
            <div className="flex space-x-2">
              <div className="relative flex-1">
                <Input
                  id="query"
                  placeholder="Ej: zapatos deportivos rojos para correr"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className={query.length > 0 ? 'pr-10' : 'pr-4'}
                />
                {query.length > 0 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7"
                    onClick={handleClearSearch}
                    title="Limpiar texto"
                    aria-label="Limpiar texto"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <Button onClick={handleSearch} disabled={isSearching}>
                {isSearching ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Buscando
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Buscar
                  </>
                )}
              </Button>
            </div>
          </div>
          
          <Separator />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="limit">Resultados a mostrar</Label>
                <span className="text-sm font-medium">{limit}</span>
              </div>
              <Input
                id="limit"
                type="number"
                min="1"
                max="50"
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
                className="w-full"
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Label htmlFor="threshold">Umbral de similitud</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-4 w-4 rounded-full">
                          ?
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="w-[240px] text-xs">
                          Define el porcentaje mínimo de coincidencia para destacar productos como relevantes.
                          Los productos que no alcanzan este umbral se muestran en escala de grises.
                          Ajusta este valor para ver más o menos productos destacados, sin necesidad de realizar una nueva búsqueda.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="flex items-center">
                  <Badge variant="secondary" className="mr-2">
                    {searchResults.length > 0 ? `${relevantProductsCount}/${searchResults.length}` : '0/0'}
                  </Badge>
                  <span className="text-sm font-medium">{thresholdPercentage}%</span>
                </div>
              </div>
              <div className="space-y-2">
                <Slider
                  id="threshold"
                  min={10}
                  max={90}
                  step={5}
                  value={[thresholdPercentage]}
                  onValueChange={handleThresholdChange}
                  className="py-4"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Más resultados</span>
                  <span>Mayor precisión</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {error && (
        <div className="bg-destructive/15 text-destructive rounded-md p-4">
          {error}
        </div>
      )}
      
      {resultInfo && (
        <div className="bg-muted rounded-md p-4">
          {resultInfo}
        </div>
      )}
      
      {searchResults.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2">
          {searchResults.map((product) => (
            <ProductCard
              key={product.id}
              id={product.id}
              title={product.title}
              description={product.description}
              imageUrl={product.imageUrl}
              brand={product.brand}
              category={product.category}
              price={product.price}
              salePrice={product.salePrice}
              currency={product.currency}
              link={product.link}
              availability={product.availability}
              similarity={Number(product.similarity)}
              thresholdPercentage={thresholdPercentage}
              showSimilarity={true}
            />
          ))}
        </div>
      )}
    </div>
  )
}