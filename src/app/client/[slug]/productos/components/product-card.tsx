import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ExternalLink, AlertCircle } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import Image from "next/image"
import Link from "next/link"
import { cn } from "@/lib/utils"

export type ProductCardProps = {
  id: string
  title: string
  description?: string | null
  imageUrl: string
  brand?: string | null
  category?: string | null
  price: string
  salePrice?: string | null
  currency: string
  link?: string | null
  availability: string
  similarity?: number
  thresholdPercentage?: number
  showSimilarity?: boolean
}

export default function ProductCard({
  title,
  description,
  imageUrl,
  brand,
  category,
  price,
  salePrice,
  currency,
  link,
  availability,
  similarity,
  thresholdPercentage = 50,
  showSimilarity = false,
}: ProductCardProps) {
  // Calcular el porcentaje de coincidencia solo si se proporciona similarity
  const matchPercentage = similarity !== undefined ? Math.round((1 - similarity) * 100) : undefined
  
  // Determinar si el producto es relevante según el umbral (si aplica)
  const isRelevant = similarity !== undefined && thresholdPercentage !== undefined 
    ? matchPercentage! >= thresholdPercentage 
    : true

  return (
    <Card 
      className={cn(
        "overflow-hidden transition-all duration-150",
        similarity !== undefined && !isRelevant ? "opacity-60 grayscale" : "opacity-100"
      )}
    >
      <CardHeader className="pb-2">
        {link ? (
          <Link href={link} target="_blank" rel="noopener noreferrer" className="inline-flex items-start">
            <Button variant="link" className="h-auto p-0 text-left w-full justify-start">
              <span className="line-clamp-2 font-semibold">{title}</span>
              <ExternalLink className="ml-1 h-3 w-3 flex-shrink-0" />
            </Button>
          </Link>
        ) : (
          <CardTitle className="text-base line-clamp-2">{title}</CardTitle>
        )}
        {brand && (
          <CardDescription className="mt-1">
            {brand}
          </CardDescription>
        )}
      </CardHeader>
      
      <CardContent className="pt-2">
        <div className="flex flex-row gap-4">
          {/* Imagen cuadrada a la izquierda con zoom aumentado */}
          <div className="relative w-28 h-28 md:w-36 md:h-36 rounded-md overflow-hidden flex-shrink-0 border shadow-sm">
            <Image
              src={imageUrl}
              alt={title}
              fill
              sizes="(max-width: 768px) 112px, 144px"
              className="object-cover scale-[1.4] hover:scale-110 transition-transform duration-300"
              style={{ objectPosition: 'center' }}
              loading="eager"
            />
            {similarity !== undefined && !isRelevant && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="absolute top-2 right-2 z-10 bg-background/80 text-foreground rounded-full p-1">
                      <AlertCircle className="h-4 w-4" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Este producto está por debajo del umbral de similitud ({thresholdPercentage}%)</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          
          {/* Contenido a la derecha */}
          <div className="flex flex-col flex-1 gap-2">
            {description && (
              <p className="text-sm text-muted-foreground line-clamp-3">
                {description}
              </p>
            )}
            
            <div className="flex flex-wrap gap-2 mt-auto">
              {category && (
                <Badge variant="outline" className="text-xs">
                  {category}
                </Badge>
              )}
              <Badge 
                variant="outline" 
                className={cn(
                  "text-xs",
                  availability.includes('in stock') 
                    ? "bg-green-50 text-green-700 border-green-200" 
                    : "bg-red-50 text-red-700 border-red-200"
                )}
              >
                {availability}
              </Badge>
            </div>
            
            <div className="flex justify-between items-center pt-2 mt-auto">
              <div>
                <span className="font-bold text-primary">
                  {price} {currency}
                </span>
                {salePrice && (
                  <span className="ml-2 text-sm line-through text-muted-foreground">
                    {salePrice} {currency}
                  </span>
                )}
              </div>
              
              {showSimilarity && matchPercentage !== undefined && (
                <Badge 
                  variant={isRelevant ? "secondary" : "outline"} 
                  className="ml-2"
                >
                  {matchPercentage}%
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 